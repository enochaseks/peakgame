/**
 * Multiplayer Game Manager
 * Handles real-time game state synchronization across all players
 */

class MultiplayerGameManager {
    constructor(roomId, playerId, matchmakingService) {
        this.roomId = roomId;
        this.playerId = playerId;
        this.matchmaking = matchmakingService;
        this.db = firebase.database();
        this.gameState = null;
        this.players = [];
        this.listeners = {
            onGameStateUpdated: null,
            onCardPlayed: null,
            onPlayerJoined: null,
            onPlayerDisconnected: null,
            onGameEnded: null,
            onError: null
        };
        this.activeListeners = [];
    }

    /**
     * Register event listener
     */
    on(event, callback) {
        if (this.listeners.hasOwnProperty(event)) {
            this.listeners[event] = callback;
        }
    }

    /**
     * Initialize multiplayer game
     */
    async initializeGame(gameConfig) {
        try {
            console.log(`[MultiplayerGame] Initializing game for room ${this.roomId}`);

            const gameState = {
                roomId: this.roomId,
                status: 'in_progress',
                startedAt: firebase.database.ServerValue.TIMESTAMP,
                gameConfig: gameConfig,
                players: gameConfig.players || [],
                currentPlayerIndex: 0,
                playDirection: 1, // 1 for clockwise, -1 for counter-clockwise
                deck: gameConfig.deck || [],
                discardPile: [],
                lastPlayedCard: null,
                highCardPlayed: false,
                round: 1,
                gameHistory: [],
                activePlayers: Object.keys(gameConfig.players || {})
            };

            // Write initial game state
            await this.db.ref(`matchmaking/rooms/${this.roomId}/gameState`).set(gameState);
            
            // Listen to game state changes
            this.listenToGameState();

            console.log(`[MultiplayerGame] Game initialized`);
            return gameState;

        } catch (error) {
            console.error('[MultiplayerGame] Error initializing game:', error);
            this.fireError('initialization_failed', error);
            throw error;
        }
    }

    /**
     * Listen to real-time game state updates
     */
    listenToGameState() {
        const gameStateRef = this.db.ref(`matchmaking/rooms/${this.roomId}/gameState`);
        
        const listener = gameStateRef.on('value', (snapshot) => {
            const gameState = snapshot.val();
            if (gameState) {
                this.gameState = gameState;
                
                if (this.listeners.onGameStateUpdated) {
                    this.listeners.onGameStateUpdated(gameState);
                }
            }
        });

        this.activeListeners.push({ ref: gameStateRef, event: 'value', callback: listener });
    }

    /**
     * Update game state
     */
    async updateGameState(updates) {
        try {
            await this.db.ref(`matchmaking/rooms/${this.roomId}/gameState`).update(updates);
        } catch (error) {
            console.error('[MultiplayerGame] Error updating game state:', error);
            this.fireError('state_update_failed', error);
            throw error;
        }
    }

    /**
     * Play a card in multiplayer
     */
    async playCard(cardIndex, card) {
        try {
            // Create action record
            const action = {
                playerId: this.playerId,
                action: 'play_card',
                card: card,
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                gameTime: Date.now()
            };

            // Add to game history
            const historyRef = this.db.ref(`matchmaking/rooms/${this.roomId}/gameState/gameHistory`).push();
            await historyRef.set(action);

            // Update last played card
            await this.updateGameState({
                lastPlayedCard: card,
                'gameHistory': action
            });

            if (this.listeners.onCardPlayed) {
                this.listeners.onCardPlayed({
                    playerId: this.playerId,
                    card: card
                });
            }

            return true;

        } catch (error) {
            console.error('[MultiplayerGame] Error playing card:', error);
            this.fireError('card_play_failed', error);
            throw error;
        }
    }

    /**
     * Draw a card in multiplayer
     */
    async drawCard() {
        try {
            const action = {
                playerId: this.playerId,
                action: 'draw_card',
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                gameTime: Date.now()
            };

            // Add to game history
            const historyRef = this.db.ref(`matchmaking/rooms/${this.roomId}/gameState/gameHistory`).push();
            await historyRef.set(action);

            return true;

        } catch (error) {
            console.error('[MultiplayerGame] Error drawing card:', error);
            this.fireError('card_draw_failed', error);
            throw error;
        }
    }

    /**
     * Update player hand
     */
    async updatePlayerHand(hand) {
        try {
            await this.db.ref(`matchmaking/rooms/${this.roomId}/playerStats/${this.playerId}/hand`).set(hand);
            await this.db.ref(`matchmaking/rooms/${this.roomId}/playerStats/${this.playerId}/cardsInHand`).set(hand.length);
        } catch (error) {
            console.error('[MultiplayerGame] Error updating hand:', error);
            throw error;
        }
    }

    /**
     * Advance to next player turn
     */
    async nextTurn() {
        try {
            const currentIndex = this.gameState.currentPlayerIndex || 0;
            const playerCount = this.gameState.activePlayers?.length || 4;
            
            let nextIndex = (currentIndex + this.gameState.playDirection) % playerCount;
            if (nextIndex < 0) nextIndex += playerCount;

            await this.updateGameState({
                currentPlayerIndex: nextIndex
            });

        } catch (error) {
            console.error('[MultiplayerGame] Error advancing turn:', error);
            throw error;
        }
    }

    /**
     * Change play direction
     */
    async changeDirection() {
        try {
            const newDirection = this.gameState.playDirection === 1 ? -1 : 1;
            await this.updateGameState({
                playDirection: newDirection
            });
        } catch (error) {
            console.error('[MultiplayerGame] Error changing direction:', error);
            throw error;
        }
    }

    /**
     * Disqualify a player
     */
    async disqualifyPlayer(playerId) {
        try {
            const activePlayers = this.gameState.activePlayers || [];
            const updatedActivePlayers = activePlayers.filter(id => id !== playerId);

            await this.updateGameState({
                activePlayers: updatedActivePlayers
            });

            // Check if game should end
            if (updatedActivePlayers.length === 1) {
                await this.endGame(updatedActivePlayers[0]);
            }

        } catch (error) {
            console.error('[MultiplayerGame] Error disqualifying player:', error);
            throw error;
        }
    }

    /**
     * End the game
     */
    async endGame(winnerId) {
        try {
            await this.updateGameState({
                status: 'completed',
                winnerId: winnerId,
                endedAt: firebase.database.ServerValue.TIMESTAMP
            });

            if (this.listeners.onGameEnded) {
                this.listeners.onGameEnded({
                    roomId: this.roomId,
                    winnerId: winnerId,
                    allPlayers: this.gameState.players
                });
            }

            console.log(`[MultiplayerGame] Game ended. Winner: ${winnerId}`);

        } catch (error) {
            console.error('[MultiplayerGame] Error ending game:', error);
            throw error;
        }
    }

    /**
     * Listen to player disconnections
     */
    listenToPlayerDisconnections() {
        const playersRef = this.db.ref(`matchmaking/rooms/${this.roomId}/players`);
        
        const listener = playersRef.on('child_removed', (snapshot) => {
            const disconnectedPlayerId = snapshot.key;
            
            console.log(`[MultiplayerGame] Player disconnected: ${disconnectedPlayerId}`);

            if (this.listeners.onPlayerDisconnected) {
                this.listeners.onPlayerDisconnected({
                    playerId: disconnectedPlayerId
                });
            }
        });

        this.activeListeners.push({ ref: playersRef, event: 'child_removed', callback: listener });
    }

    /**
     * Send chat message (optional feature)
     */
    async sendMessage(message) {
        try {
            const messageObj = {
                playerId: this.playerId,
                message: message,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            };

            await this.db.ref(`matchmaking/rooms/${this.roomId}/messages`).push().set(messageObj);

        } catch (error) {
            console.error('[MultiplayerGame] Error sending message:', error);
        }
    }

    /**
     * Fire error event
     */
    fireError(errorCode, error) {
        if (this.listeners.onError) {
            this.listeners.onError({
                code: errorCode,
                error: error,
                timestamp: Date.now()
            });
        }
    }

    /**
     * Get current game state
     */
    getGameState() {
        return this.gameState;
    }

    /**
     * Get player info
     */
    async getPlayerInfo(playerId) {
        try {
            const snapshot = await this.db.ref(`matchmaking/rooms/${this.roomId}/playerStats/${playerId}`).once('value');
            return snapshot.val();
        } catch (error) {
            console.error('[MultiplayerGame] Error getting player info:', error);
            return null;
        }
    }

    /**
     * Cleanup listeners
     */
    cleanup() {
        this.activeListeners.forEach(({ ref, event, callback }) => {
            ref.off(event, callback);
        });
        this.activeListeners = [];
    }

    /**
     * Disconnect from game
     */
    async disconnect() {
        try {
            this.cleanup();
            
            // Optionally notify other players
            await this.db.ref(`matchmaking/rooms/${this.roomId}/players/${this.playerId}`).remove();
            
            console.log(`[MultiplayerGame] Disconnected from game`);

        } catch (error) {
            console.error('[MultiplayerGame] Error disconnecting:', error);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MultiplayerGameManager;
}
