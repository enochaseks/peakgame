/**
 * OnlineGameRoom - Handles real-time multiplayer game logic with full Peak Card Game rules
 * Features: Real-time game sync, Player management, Card effects, Game state
 */

class OnlineGameRoom {
    constructor(gameId, playerId, authManager) {
        this.gameId = gameId;
        this.playerId = playerId;
        this.authManager = authManager;
        this.gameState = {
            currentRound: 1,
            players: [],
            currentPlayerIndex: 0,
            direction: 1, // 1 = clockwise, -1 = counterclockwise
            deck: [],
            discardPile: [],
            lastPlayedCard: null,
            gameStatus: 'waiting',
            highCardPlayed: false,
            peakCardsPlayed: 0,
            gameLog: []
        };
        this.gameStateListener = null;
        this.cardEffectsActive = {};
    }

    /**
     * Initialize game and load game state
     */
    async initializeGame() {
        try {
            const db = firebase.firestore();
            const gameRef = db.collection('gameRooms').doc(this.gameId);
            
            // Retry logic: wait for game room to exist (it might be created by another player)
            let gameDoc = await gameRef.get();
            let retries = 0;
            const maxRetries = 10;
            
            while (!gameDoc.exists && retries < maxRetries) {
                console.log(`⏳ Game room not found yet, retrying... (${retries + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms before retrying
                gameDoc = await gameRef.get();
                retries++;
            }

            if (!gameDoc.exists) {
                throw new Error('Game room not found after retries');
            }

            const gameData = gameDoc.data();
            
            // Initialize game state
            this.gameState = {
                currentRound: 1,
                players: gameData.players || [],
                currentPlayerIndex: 0,
                direction: 1,
                deck: this.initializeDeck(),
                discardPile: [],
                lastPlayedCard: null,
                gameStatus: 'ready',
                highCardPlayed: false,
                peakCardsPlayed: 0,
                gameLog: [`Game started with ${this.gameState.players.length} players`]
            };

            // Set up real-time listener for game state changes
            this.setupGameStateListener();

            console.log('✅ Online game room initialized:', this.gameId);
            return { success: true };

        } catch (error) {
            console.error('❌ Error initializing game:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Initialize deck with all cards and effects
     */
    initializeDeck() {
        const deck = [];
        
        // Add numbered cards 1-10 (4 of each = 40 cards)
        for (let i = 1; i <= 10; i++) {
            for (let j = 0; j < 4; j++) {
                deck.push({
                    number: i,
                    type: 'number',
                    effect: null
                });
            }
        }

        // Add 10 Peak cards (special cards)
        for (let i = 0; i < 10; i++) {
            deck.push({
                number: 'PEAK',
                type: 'peak',
                effect: 'pickupFive' // Next player picks up 5 cards
            });
        }

        // Shuffle deck
        return this.shuffleDeck(deck);
    }

    /**
     * Shuffle deck using Fisher-Yates algorithm
     */
    shuffleDeck(deck) {
        const shuffled = [...deck];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * Deal initial hands to all players
     */
    async dealInitialHands() {
        try {
            const handsPerPlayer = 5;
            
            for (let player of this.gameState.players) {
                const hand = [];
                for (let i = 0; i < handsPerPlayer; i++) {
                    if (this.gameState.deck.length > 0) {
                        hand.push(this.gameState.deck.pop());
                    }
                }
                player.hand = hand;
                player.cardCount = hand.length;
                player.status = 'active';
                player.peakCardsPlayed = 0;
            }

            // Save to Firestore
            const db = firebase.firestore();
            await db.collection('gameRooms').doc(this.gameId).update({
                gameState: this.gameState,
                status: 'playing'
            });

            console.log('✅ Initial hands dealt');
            return { success: true };

        } catch (error) {
            console.error('❌ Error dealing hands:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Play a card from hand
     */
    async playCard(cardIndex, playerIndex = null) {
        try {
            const actualPlayerIndex = playerIndex !== null ? playerIndex : this.gameState.currentPlayerIndex;
            const player = this.gameState.players[actualPlayerIndex];
            
            if (!player || !player.hand || !player.hand[cardIndex]) {
                throw new Error('Invalid card selection');
            }

            const card = player.hand[cardIndex];

            // Validate card play based on Peak Card Game rules
            const validation = this.validateCardPlay(card, this.gameState.lastPlayedCard);
            if (!validation.valid) {
                throw new Error(validation.reason);
            }

            // Remove card from player's hand
            player.hand.splice(cardIndex, 1);

            // Apply card effect
            await this.applyCardEffect(card, actualPlayerIndex);

            // Update game state
            this.gameState.lastPlayedCard = card;
            this.gameState.discardPile.push(card);

            // Check if player finished
            if (player.hand.length === 0) {
                return await this.handlePlayerFinish(actualPlayerIndex);
            }

            // Move to next player
            await this.advanceToNextPlayer();

            // Save game state
            await this.saveGameState();

            return { success: true, card: card };

        } catch (error) {
            console.error('❌ Error playing card:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Validate if card can be played based on Peak Card Game rules
     */
    validateCardPlay(card, lastPlayedCard) {
        // No card played yet - can play anything
        if (!lastPlayedCard) {
            return { valid: true };
        }

        // Peak cards can always be played
        if (card.type === 'peak') {
            return { valid: true };
        }

        // Numbers must be higher than last played
        if (card.type === 'number') {
            // Cannot finish on 1-4
            if (card.number <= 4) {
                return { 
                    valid: false, 
                    reason: 'Cannot finish on cards 1-4' 
                };
            }

            // Can finish on 5-6
            if (card.number >= 5 && card.number <= 6) {
                return { valid: true };
            }

            // Can only finish on 8-10 if someone else dropped high card
            if (card.number >= 8 && card.number <= 10) {
                if (this.gameState.highCardPlayed) {
                    return { valid: true };
                } else {
                    return { 
                        valid: false, 
                        reason: 'Can only finish on 8-10 if high card was played' 
                    };
                }
            }

            return { valid: true };
        }

        return { valid: true };
    }

    /**
     * Apply card effect
     */
    async applyCardEffect(card, playerIndex) {
        try {
            if (card.type === 'peak' && card.effect === 'pickupFive') {
                // Next player picks up 5 cards
                const nextPlayerIndex = (playerIndex + this.gameState.direction + this.gameState.players.length) % this.gameState.players.length;
                const nextPlayer = this.gameState.players[nextPlayerIndex];

                for (let i = 0; i < 5; i++) {
                    if (this.gameState.deck.length > 0) {
                        nextPlayer.hand.push(this.gameState.deck.pop());
                    }
                }

                nextPlayer.cardCount = nextPlayer.hand.length;

                // Check if player exceeded 20 cards (disqualified)
                if (nextPlayer.cardCount > 20) {
                    nextPlayer.status = 'disqualified';
                    this.gameState.gameLog.push(`${nextPlayer.username} disqualified (over 20 cards)`);
                }

                this.gameState.peakCardsPlayed++;
            }

            // Track if high card (8-10) was played
            if (card.type === 'number' && card.number >= 8) {
                this.gameState.highCardPlayed = true;
            }

        } catch (error) {
            console.error('❌ Error applying card effect:', error);
        }
    }

    /**
     * Handle player finishing (playing all cards)
     */
    async handlePlayerFinish(playerIndex) {
        try {
            const finisher = this.gameState.players[playerIndex];
            finisher.status = 'finished';
            this.gameState.gameLog.push(`${finisher.username} finished!`);

            // Check if game is over (only one player left)
            const activePlayers = this.gameState.players.filter(p => p.status === 'active' || p.status === 'finished');
            
            if (activePlayers.length === 1) {
                const winner = activePlayers[0];
                this.gameState.gameStatus = 'finished';
                this.gameState.gameLog.push(`🎉 ${winner.username} wins!`);
                return { success: true, gameOver: true, winner: winner };
            }

            return { success: true, gameOver: false };

        } catch (error) {
            console.error('❌ Error handling player finish:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Draw card when player can't play
     */
    async drawCard() {
        try {
            const currentPlayer = this.gameState.players[this.gameState.currentPlayerIndex];
            
            if (this.gameState.deck.length === 0) {
                // Reshuffle discard pile as new deck
                this.gameState.deck = this.shuffleDeck(this.gameState.discardPile);
                this.gameState.discardPile = [];
            }

            const card = this.gameState.deck.pop();
            currentPlayer.hand.push(card);
            currentPlayer.cardCount = currentPlayer.hand.length;

            // Check if disqualified
            if (currentPlayer.cardCount > 20) {
                currentPlayer.status = 'disqualified';
                this.gameState.gameLog.push(`${currentPlayer.username} disqualified (over 20 cards)`);
            }

            await this.advanceToNextPlayer();
            await this.saveGameState();

            return { success: true, card: card };

        } catch (error) {
            console.error('❌ Error drawing card:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Advance to next player
     */
    async advanceToNextPlayer() {
        try {
            do {
                this.gameState.currentPlayerIndex = (this.gameState.currentPlayerIndex + this.gameState.direction + this.gameState.players.length) % this.gameState.players.length;
                const nextPlayer = this.gameState.players[this.gameState.currentPlayerIndex];
                
                if (nextPlayer.status === 'active') {
                    break;
                }
            } while (true);

            console.log('✅ Advanced to next player');
            return { success: true };

        } catch (error) {
            console.error('❌ Error advancing to next player:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Save game state to Firestore
     */
    async saveGameState() {
        try {
            const db = firebase.firestore();
            await db.collection('gameRooms').doc(this.gameId).update({
                gameState: this.gameState,
                lastUpdated: new Date()
            });

            console.log('✅ Game state saved');
            return { success: true };

        } catch (error) {
            console.error('❌ Error saving game state:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Set up real-time listener for game state changes
     */
    setupGameStateListener() {
        try {
            const db = firebase.firestore();
            const gameRef = db.collection('gameRooms').doc(this.gameId);

            this.gameStateListener = gameRef.onSnapshot(
                (doc) => {
                    if (doc.exists) {
                        const data = doc.data();
                        if (data.gameState) {
                            this.gameState = data.gameState;
                            // Dispatch event for UI updates
                            window.dispatchEvent(new CustomEvent('gameStateUpdated', { 
                                detail: { gameState: this.gameState, gameId: this.gameId } 
                            }));
                        }
                    }
                },
                (error) => {
                    console.error('❌ Game state listener error:', error);
                }
            );

            console.log('✅ Game state listener set up');

        } catch (error) {
            console.error('❌ Error setting up listener:', error);
        }
    }

    /**
     * Cleanup and disconnect listener
     */
    cleanup() {
        if (this.gameStateListener) {
            this.gameStateListener();
            this.gameStateListener = null;
        }
        console.log('✅ Game room cleaned up');
    }

    /**
     * Get current game state
     */
    getGameState() {
        return this.gameState;
    }

    /**
     * Get current player
     */
    getCurrentPlayer() {
        return this.gameState.players[this.gameState.currentPlayerIndex];
    }

    /**
     * Get player's hand
     */
    getPlayerHand(playerIndex = null) {
        const idx = playerIndex !== null ? playerIndex : this.gameState.currentPlayerIndex;
        return this.gameState.players[idx]?.hand || [];
    }
}
