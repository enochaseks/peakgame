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

        // Add 10 Peak cards (⛰️ Next player picks up 5 cards)
        for (let i = 0; i < 10; i++) {
            deck.push({
                number: 'PEAK',
                type: 'peak',
                effect: 'pickupFive'
            });
        }

        // Add 4 Reverse cards (🔄 Changes play direction)
        for (let i = 0; i < 4; i++) {
            deck.push({
                number: 'REVERSE',
                type: 'reverse',
                effect: 'reverseDirection'
            });
        }

        // Add 4 Star cards (✨ Removes all Peak cards from other players)
        for (let i = 0; i < 4; i++) {
            deck.push({
                number: 'STAR',
                type: 'star',
                effect: 'removePeaks'
            });
        }

        // Add 4 Goblin cards (👹 Gives bad cards 1-4 to all other players)
        for (let i = 0; i < 4; i++) {
            deck.push({
                number: 'GOBLIN',
                type: 'goblin',
                effect: 'giveBadCards'
            });
        }

        // Add 4 Pause cards (⏸️ Pauses another player for 2 minutes)
        for (let i = 0; i < 4; i++) {
            deck.push({
                number: 'PAUSE',
                type: 'pause',
                effect: 'pausePlayer'
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
            let actualPlayerIndex = playerIndex;
            if (actualPlayerIndex === null) {
                actualPlayerIndex = this.getPlayerIndexByUid(this.playerId);
            }

            if (actualPlayerIndex !== this.gameState.currentPlayerIndex) {
                throw new Error('Not your turn!');
            }

            const player = this.gameState.players[actualPlayerIndex];
            
            if (!player || !player.hand || !player.hand[cardIndex]) {
                throw new Error('Invalid card selection');
            }

            if (player.status !== 'active') {
                throw new Error('You cannot play cards');
            }

            const card = player.hand[cardIndex];

            const validation = this.validateCardPlay(card, this.gameState.lastPlayedCard);
            if (!validation.valid) {
                throw new Error(validation.reason);
            }

            player.hand.splice(cardIndex, 1);
            player.cardCount = player.hand.length;

            this.gameState.lastPlayedCard = card;
            this.gameState.discardPile.push(card);

            await this.applyCardEffect(card, actualPlayerIndex);

            if (player.hand.length === 0) {
                if (this.canFinishOnCard(card)) {
                    return await this.handlePlayerFinish(actualPlayerIndex);
                } else {
                    if (this.gameState.deck.length > 0) {
                        player.hand.push(this.gameState.deck.pop());
                        player.cardCount = player.hand.length;
                        this.gameState.gameLog.push(`❌ ${player.username} cannot finish on ${card.number}!`);
                    }
                }
            }

            await this.advanceToNextPlayer();
            await this.saveGameState();

            return { 
                success: true, 
                card: card,
                newDirection: this.gameState.direction 
            };

        } catch (error) {
            console.error('Error playing card:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Validate if card can be played based on Peak Card Game rules
     */
    validateCardPlay(card, lastPlayedCard) {
        // No card played yet - can play anything except can't finish on certain cards
        if (!lastPlayedCard) {
            return { valid: true };
        }

        // Special cards can always be played
        if (card.type === 'peak' || card.type === 'reverse' || card.type === 'star' || card.type === 'goblin' || card.type === 'pause') {
            return { valid: true };
        }

        // Numbers must follow game rules
        if (card.type === 'number') {
            // Can always play cards 1-10 during the game
            return { valid: true };
        }

        return { valid: true };
    }

    /**
     * Check if player can finish on this card
     */
    canFinishOnCard(card) {
        // Cannot finish on special cards
        if (card.type === 'peak' || card.type === 'reverse' || card.type === 'star' || card.type === 'goblin' || card.type === 'pause') {
            return false;
        }

        // Cannot finish on cards 1-4
        if (card.type === 'number' && card.number >= 1 && card.number <= 4) {
            return false;
        }

        // Can finish on 5-6
        if (card.type === 'number' && card.number >= 5 && card.number <= 6) {
            return true;
        }

        // Can only finish on 8-10 if high card was played this round
        if (card.type === 'number' && card.number >= 8 && card.number <= 10) {
            return this.gameState.highCardPlayed;
        }

        return false;
    }

    /**
     * Apply card effect
     */
    async applyCardEffect(card, playerIndex) {
        try {
            // Peak Card Effect: Next player picks up 5 cards
            if (card.type === 'peak' && card.effect === 'pickupFive') {
                const nextPlayerIndex = (playerIndex + this.gameState.direction + this.gameState.players.length) % this.gameState.players.length;
                const nextPlayer = this.gameState.players[nextPlayerIndex];

                for (let i = 0; i < 5; i++) {
                    // Refill deck if needed
                    if (this.gameState.deck.length === 0 && this.gameState.discardPile.length > 1) {
                        const topCard = this.gameState.discardPile[this.gameState.discardPile.length - 1];
                        this.gameState.deck = this.shuffleDeck(this.gameState.discardPile.slice(0, -1));
                        this.gameState.discardPile = [topCard];
                    }
                    
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
                this.gameState.gameLog.push(`⛰️ ${nextPlayer.username} picked up 5 cards from Peak!`);
            }

            // Reverse Card Effect: Change direction
            if (card.type === 'reverse' && card.effect === 'reverseDirection') {
                this.gameState.direction *= -1;
                const directionText = this.gameState.direction === 1 ? 'clockwise ↻' : 'counter-clockwise ↺';
                this.gameState.gameLog.push(`🔄 Direction reversed! Now playing ${directionText}`);
            }

            // Star Card Effect: Remove all Peak cards from other players
            if (card.type === 'star' && card.effect === 'removePeaks') {
                let totalRemoved = 0;
                for (let i = 0; i < this.gameState.players.length; i++) {
                    if (i !== playerIndex) {
                        const player = this.gameState.players[i];
                        const peakCards = player.hand.filter(c => c.type === 'peak');
                        totalRemoved += peakCards.length;
                        
                        // Remove peak cards from hand
                        player.hand = player.hand.filter(c => c.type !== 'peak');
                        player.cardCount = player.hand.length;
                        
                        // Put peak cards back in deck and shuffle
                        this.gameState.deck.push(...peakCards);
                    }
                }
                
                if (totalRemoved > 0) {
                    this.gameState.deck = this.shuffleDeck(this.gameState.deck);
                    this.gameState.gameLog.push(`✨ Star removed ${totalRemoved} Peak cards!`);
                } else {
                    this.gameState.gameLog.push(`✨ Star played, but no Peak cards found`);
                }
            }

            // Goblin Card Effect: Give bad cards (1-4) to all other players
            if (card.type === 'goblin' && card.effect === 'giveBadCards') {
                const badCardNumbers = [1, 2, 3, 4];
                for (let i = 0; i < this.gameState.players.length; i++) {
                    if (i !== playerIndex && this.gameState.players[i].status === 'active') {
                        const randomBad = badCardNumbers[Math.floor(Math.random() * badCardNumbers.length)];
                        const badCard = {
                            number: randomBad,
                            type: 'number',
                            effect: null
                        };
                        this.gameState.players[i].hand.push(badCard);
                        this.gameState.players[i].cardCount++;
                        
                        // Check disqualification
                        if (this.gameState.players[i].cardCount > 20) {
                            this.gameState.players[i].status = 'disqualified';
                            this.gameState.gameLog.push(`${this.gameState.players[i].username} disqualified (over 20 cards)`);
                        }
                    }
                }
                this.gameState.gameLog.push(`👹 Goblin gave bad cards to all players!`);
            }

            // Pause Card Effect: Pause a player for 2 minutes
            if (card.type === 'pause' && card.effect === 'pausePlayer') {
                // Find next active player to pause
                let targetIndex = (playerIndex + 1) % this.gameState.players.length;
                while (this.gameState.players[targetIndex].status !== 'active' || targetIndex === playerIndex) {
                    targetIndex = (targetIndex + 1) % this.gameState.players.length;
                    if (targetIndex === playerIndex) break; // Safety check
                }
                
                if (targetIndex !== playerIndex) {
                    const targetPlayer = this.gameState.players[targetIndex];
                    targetPlayer.pausedUntil = Date.now() + (2 * 60 * 1000); // 2 minutes
                    this.gameState.gameLog.push(`⏸️ ${targetPlayer.username} is paused for 2 minutes!`);
                }
            }

            // Track if high card (8-10) was played
            if (card.type === 'number' && card.number >= 8) {
                this.gameState.highCardPlayed = true;
                this.gameState.gameLog.push(`🎯 High card ${card.number} played! Others can finish on 8-10`);
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
            
            // Refill deck if empty
            if (this.gameState.deck.length === 0) {
                if (this.gameState.discardPile.length > 1) {
                    // Keep the top card of discard pile
                    const topCard = this.gameState.discardPile[this.gameState.discardPile.length - 1];
                    this.gameState.deck = this.shuffleDeck(this.gameState.discardPile.slice(0, -1));
                    this.gameState.discardPile = [topCard];
                    this.gameState.gameLog.push(`🔄 Deck refilled from discard pile!`);
                } else {
                    throw new Error('No cards left to draw');
                }
            }

            const card = this.gameState.deck.pop();
            currentPlayer.hand.push(card);
            currentPlayer.cardCount = currentPlayer.hand.length;
            
            this.gameState.gameLog.push(`🃏 ${currentPlayer.username} drew a card`);

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
            let attempts = 0;
            const maxAttempts = this.gameState.players.length * 2;
            
            do {
                this.gameState.currentPlayerIndex = (this.gameState.currentPlayerIndex + this.gameState.direction + this.gameState.players.length) % this.gameState.players.length;
                const nextPlayer = this.gameState.players[this.gameState.currentPlayerIndex];
                
                // Check if player is paused
                if (nextPlayer.pausedUntil && Date.now() < nextPlayer.pausedUntil) {
                    const remainingTime = Math.ceil((nextPlayer.pausedUntil - Date.now()) / 1000);
                    this.gameState.gameLog.push(`⏸️ ${nextPlayer.username} is paused (${remainingTime}s remaining)`);
                    attempts++;
                    continue;
                }
                
                // Clear pause if time expired
                if (nextPlayer.pausedUntil && Date.now() >= nextPlayer.pausedUntil) {
                    nextPlayer.pausedUntil = null;
                    this.gameState.gameLog.push(`▶️ ${nextPlayer.username} is no longer paused!`);
                }
                
                // Found active player
                if (nextPlayer.status === 'active') {
                    break;
                }
                
                attempts++;
            } while (attempts < maxAttempts);

            console.log('✅ Advanced to next player:', this.gameState.players[this.gameState.currentPlayerIndex].username);
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

    /**
     * Get player index by UID
     */
    getPlayerIndexByUid(uid) {
        return this.gameState.players.findIndex(p => p.uid === uid);
    }

    /**
     * Is it this player's turn?
     */
    isMyTurn() {
        const myIndex = this.getPlayerIndexByUid(this.playerId);
        return myIndex === this.gameState.currentPlayerIndex;
    }

    /**
     * Get my player data
     */
    getMyPlayer() {
        return this.gameState.players.find(p => p.uid === this.playerId);
    }
}
