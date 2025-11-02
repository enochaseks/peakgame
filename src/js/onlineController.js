/**
 * Online Game Controller
 * Manages the online game flow and UI interactions
 */

class OnlineGameController {
    constructor() {
        this.matchmaking = null;
        this.multiplayerGame = null;
        this.gameState = null;
        this.currentMode = null; // 'offline', 'online'
        this.playerId = null;
        this.roomId = null;
    }

    /**
     * Initialize online mode
     */
    async initializeOnlineMode() {
        try {
            console.log('[OnlineController] Initializing online mode');
            
            this.matchmaking = new MatchmakingService();
            
            // Set up matchmaking event listeners
            this.matchmaking.on('onMatchFound', (room) => {
                console.log('[OnlineController] Match found!', room);
                this.onMatchFound(room);
            });

            this.matchmaking.on('onMatchmakingCancelled', (reason) => {
                console.log('[OnlineController] Matchmaking cancelled:', reason);
                this.onMatchmakingCancelled(reason);
            });

            this.currentMode = 'online';
            this.playerId = this.matchmaking.playerId;

            return {
                success: true,
                playerId: this.playerId
            };

        } catch (error) {
            console.error('[OnlineController] Error initializing online mode:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Find a match for the specified number of players
     */
    async findMatch(playerCount) {
        try {
            if (!this.matchmaking) {
                throw new Error('Online mode not initialized');
            }

            console.log(`[OnlineController] Finding match for ${playerCount} players`);

            // Show loading UI
            this.showMatchmakingUI(playerCount);

            // Join the queue
            await this.matchmaking.joinQueue(playerCount);

        } catch (error) {
            console.error('[OnlineController] Error finding match:', error);
            this.showError(`Failed to find match: ${error.message}`);
        }
    }

    /**
     * Called when a match is found
     */
    async onMatchFound(room) {
        try {
            console.log('[OnlineController] Starting online game');

            this.roomId = room.roomId;
            const playerIds = Object.keys(room.players);

            // Initialize multiplayer game manager
            this.multiplayerGame = new MultiplayerGameManager(
                this.roomId,
                this.playerId,
                this.matchmaking
            );

            // Set up event listeners
            this.multiplayerGame.on('onGameStateUpdated', (gameState) => {
                this.onGameStateUpdated(gameState);
            });

            this.multiplayerGame.on('onCardPlayed', (playData) => {
                this.onCardPlayed(playData);
            });

            this.multiplayerGame.on('onGameEnded', (endData) => {
                this.onGameEnded(endData);
            });

            this.multiplayerGame.on('onPlayerDisconnected', (playerData) => {
                this.onPlayerDisconnected(playerData);
            });

            // Hide matchmaking UI
            this.hideMatchmakingUI();

            // Show game starting UI
            this.showGameStartingUI(playerIds);

            // Wait a bit then start the game
            await this.delay(2000);
            await this.startOnlineGame(playerIds);

        } catch (error) {
            console.error('[OnlineController] Error on match found:', error);
            this.showError(`Error starting game: ${error.message}`);
        }
    }

    /**
     * Start the online game
     */
    async startOnlineGame(playerIds) {
        try {
            console.log('[OnlineController] Starting online game with players:', playerIds);

            // Check what functions are available
            console.log('[OnlineController] Checking for game functions...');
            console.log('  - window.createDeck:', typeof window.createDeck);
            console.log('  - window.Player:', typeof window.Player);
            console.log('  - window.dealCards:', typeof window.dealCards);
            console.log('  - window.updateDisplay:', typeof window.updateDisplay);
            console.log('  - window.game:', typeof window.game);
            console.log('  - window.gameSession:', typeof window.gameSession);

            // Wait for game engine to be initialized with exponential backoff
            let retries = 0;
            let waitTime = 100;
            const maxRetries = 50;
            
            while (retries < maxRetries) {
                if (typeof window.createDeck === 'function' && typeof window.Player === 'function' && 
                    typeof window.dealCards === 'function' && typeof window.updateDisplay === 'function') {
                    console.log('[OnlineController] Game engine ready!');
                    break;
                }
                
                if (retries % 5 === 0) {
                    console.log('[OnlineController] Still waiting for game engine... retry', retries + 1, '/', maxRetries);
                }
                
                await new Promise(resolve => setTimeout(resolve, waitTime));
                retries++;
            }

            if (typeof window.createDeck !== 'function' || typeof window.Player !== 'function') {
                console.error('[OnlineController] Game engine functions not found after waiting:');
                console.error('  - window.createDeck:', typeof window.createDeck);
                console.error('  - window.Player:', typeof window.Player);
                console.error('  - window.dealCards:', typeof window.dealCards);
                console.error('  - window.updateDisplay:', typeof window.updateDisplay);
                throw new Error('Game engine not initialized. Please refresh the page.');
            }

            console.log('[OnlineController] Game engine ready, initializing online game');

            // Create a PIN for this online game (for compatibility with existing system)
            const onlinePin = 'online_' + this.roomId;

            // Initialize players using the existing Player class
            const playerNames = playerIds.map((id, index) => `Player ${index + 1}`);
            
            // Set up game session for compatibility
            window.gameSession = window.gameSession || {};
            window.gameSession.pin = onlinePin;
            window.gameSession.isHost = this.playerId === playerIds[0];
            window.gameSession.playerName = playerIds[playerIds.indexOf(this.playerId)] ? 
                `Player ${playerIds.indexOf(this.playerId) + 1}` : 'Player 1';
            window.gameSession.lobbyPlayers = {};
            window.gameSession.gameStarted = true;
            window.gameSession.maxPlayers = playerIds.length;

            playerIds.forEach((id, index) => {
                window.gameSession.lobbyPlayers[id] = {
                    name: `Player ${index + 1}`,
                    playerId: id,
                    ready: true
                };
            });

            console.log('[OnlineController] Creating game with players:', playerNames);

            // Initialize game using the existing game engine
            window.game = {
                players: playerNames.map(name => new window.Player(name)),
                deck: window.createDeck(),
                discardPile: [],
                currentPlayerIndex: 0,
                roundNumber: 1,
                highCardPlayedThisRound: false,
                gameOver: false,
                winner: null,
                direction: 1
            };

            console.log('[OnlineController] Game created, dealing cards...');

            // Deal initial cards using existing function
            window.dealCards();

            // Ensure all players are active
            window.game.players.forEach(player => {
                player.active = true;
                player.isDisqualified = false;
                player.hasFinished = false;
            });

            console.log('[OnlineController] Cards dealt, showing game UI...');

            // Hide starting UI and show game UI
            this.showGameUI();

            // Update the display using existing function
            if (typeof window.updateDisplay === 'function') {
                console.log('[OnlineController] Updating display...');
                window.updateDisplay();
            }

            // Mark game initialization as complete so checkGameOver can run normally
            window.gameInitializationComplete = true;

            // Show success message using existing function
            if (typeof window.showMessage === 'function') {
                window.showMessage('Online game started! Each player has 7 cards.', 'success');
            }

            console.log('[OnlineController] Online game started successfully');
            console.log('Players:', window.game.players.map(p => `${p.name}: ${p.hand.length} cards`));

        } catch (error) {
            console.error('[OnlineController] Error starting online game:', error);
            console.error('Stack trace:', error.stack);
            this.showError(`Error starting game: ${error.message}`);
            throw error;
        }
    }

    /**
     * Play a card in online game
     */
    async playCard(cardIndex) {
        try {
            if (!this.multiplayerGame) {
                throw new Error('Game not initialized');
            }

            await this.multiplayerGame.playCard(cardIndex, null);

        } catch (error) {
            console.error('[OnlineController] Error playing card:', error);
            this.showError(`Error playing card: ${error.message}`);
        }
    }

    /**
     * Draw a card in online game
     */
    async drawCard() {
        try {
            if (!this.multiplayerGame) {
                throw new Error('Game not initialized');
            }

            await this.multiplayerGame.drawCard();

        } catch (error) {
            console.error('[OnlineController] Error drawing card:', error);
            this.showError(`Error drawing card: ${error.message}`);
        }
    }

    /**
     * Called when game state is updated
     */
    onGameStateUpdated(gameState) {
        console.log('[OnlineController] Game state updated:', gameState);
        this.gameState = gameState;

        // Trigger UI update
        if (window.updateOnlineGameUI) {
            window.updateOnlineGameUI(gameState);
        }
    }

    /**
     * Called when a card is played
     */
    onCardPlayed(playData) {
        console.log('[OnlineController] Card played:', playData);

        if (window.onRemoteCardPlayed) {
            window.onRemoteCardPlayed(playData);
        }
    }

    /**
     * Called when game ends
     */
    onGameEnded(endData) {
        console.log('[OnlineController] Game ended:', endData);

        this.showGameEndUI(endData);
    }

    /**
     * Called when player disconnects
     */
    onPlayerDisconnected(playerData) {
        console.log('[OnlineController] Player disconnected:', playerData);

        this.showWarning(`Player ${playerData.playerId} disconnected`);
    }

    /**
     * Cancel matchmaking
     */
    async cancelMatchmaking() {
        try {
            if (this.matchmaking) {
                await this.matchmaking.cancelQueue();
            }
            this.hideMatchmakingUI();
            
            // Show setup screen again
            const startScreen = document.getElementById('startScreen');
            if (startScreen) {
                startScreen.style.display = 'block';
            }
            
            const gameTypeSection = document.getElementById('gameTypeSection');
            if (gameTypeSection) {
                gameTypeSection.style.display = 'block';
            }
            
            const onlinePlayerCountSection = document.getElementById('onlinePlayerCountSection');
            if (onlinePlayerCountSection) {
                onlinePlayerCountSection.style.display = 'block';
            }
        } catch (error) {
            console.error('[OnlineController] Error cancelling matchmaking:', error);
        }
    }

    /**
     * Leave online game
     */
    async leaveGame() {
        try {
            if (this.multiplayerGame) {
                await this.multiplayerGame.disconnect();
            }

            if (this.matchmaking) {
                await this.matchmaking.leaveRoom();
            }

            this.resetState();
            this.showMainMenu();

        } catch (error) {
            console.error('[OnlineController] Error leaving game:', error);
        }
    }

    /**
     * Get match statistics
     */
    async getMatchStats() {
        try {
            if (!this.matchmaking) {
                return null;
            }

            const stats = {
                activeRooms: await this.matchmaking.getActiveRoomsCount(),
                queueStats: await this.matchmaking.getQueueStats(),
                playerId: this.playerId
            };

            return stats;

        } catch (error) {
            console.error('[OnlineController] Error getting match stats:', error);
            return null;
        }
    }

    /**
     * Called when matchmaking is cancelled
     */
    onMatchmakingCancelled(reason) {
        if (reason.reason === 'timeout') {
            this.showWarning('No match found after 15 minutes. Please try again.');
        }
        this.hideMatchmakingUI();
    }

    // ==================== UI Methods ====================

    showMatchmakingUI(playerCount) {
        const modal = document.createElement('div');
        modal.id = 'matchmakingModal';
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content" style="text-align: center;">
                <h2>🎮 Finding Players</h2>
                <p>Looking for ${playerCount}-player game...</p>
                <div class="loading-spinner"></div>
                <p id="queueStats" style="margin-top: 20px; font-size: 12px; color: #666;"></p>
                <div style="display: flex; gap: 10px; margin-top: 20px; justify-content: center;">
                    <button onclick="onlineController.cancelMatchmaking()" class="btn quit" style="flex: 1;">Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Update queue stats
        this.updateQueueStatsDisplay();
    }

    async updateQueueStatsDisplay() {
        try {
            const stats = await this.getMatchStats();
            if (stats) {
                const statsText = `Players in queue: ${Object.values(stats.queueStats).reduce((a, b) => a + b, 0)}`;
                const statsEl = document.getElementById('queueStats');
                if (statsEl) {
                    statsEl.textContent = statsText;
                }
            }
        } catch (error) {
            console.error('Error updating queue stats:', error);
        }
    }

    hideMatchmakingUI() {
        const modal = document.getElementById('matchmakingModal');
        if (modal) {
            modal.remove();
        }
    }

    showGameStartingUI(playerIds) {
        const modal = document.createElement('div');
        modal.id = 'gameStartingModal';
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content" style="text-align: center;">
                <h2>🎮 Game Found!</h2>
                <p>Players found: ${playerIds.length}</p>
                <p>Starting game...</p>
                <div class="loading-spinner"></div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    hideGameStartingUI() {
        const modal = document.getElementById('gameStartingModal');
        if (modal) {
            modal.remove();
        }
    }

    showGameUI() {
        this.hideGameStartingUI();
        // Hide setup modal
        const setupModal = document.getElementById('setupModal');
        if (setupModal) {
            setupModal.style.display = 'none';
        }
        // Show game container
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.style.display = 'block';
        }
    }

    showGameEndUI(endData) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content" style="text-align: center;">
                <h2>🏆 Game Over!</h2>
                <p>${endData.winnerId === this.playerId ? 'You Won!' : 'You Lost!'}</p>
                <button onclick="onlineController.leaveGame()" class="btn">Back to Menu</button>
            </div>
        `;
        document.body.appendChild(modal);
    }

    showMainMenu() {
        // This would show the main menu
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.style.display = 'none';
        }

        const setupModal = document.getElementById('setupModal');
        if (setupModal) {
            setupModal.style.display = 'flex';
        }
    }

    showError(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff4444;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 10000;
            max-width: 300px;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => notification.remove(), 5000);
    }

    showWarning(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff9900;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 10000;
            max-width: 300px;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => notification.remove(), 5000);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    resetState() {
        this.matchmaking = null;
        this.multiplayerGame = null;
        this.gameState = null;
        this.currentMode = null;
        this.playerId = null;
        this.roomId = null;
    }
}

// Create global instance
let onlineController = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    onlineController = new OnlineGameController();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OnlineGameController;
}
