/**
 * OnlineGameManager - Handles online multiplayer game logic
 * Features: Game rooms, Matchmaking, Real-time Sync, Player Management
 * Uses 'gameRooms' collection only (new unified system)
 */

class OnlineGameManager {
    constructor(authManager) {
        this.authManager = authManager;
        this.currentGame = null;
        this.gameId = null;
        this.playerId = null;
        this.players = [];
        this.gameStateListener = null;
    }

    /**
     * Create a new game room in gameRooms collection
     */
    async createGameRoom(maxPlayers = 4) {
        try {
            if (!this.authManager.currentUser) {
                throw new Error('User not authenticated');
            }

            const gameRoomId = `lobby_${Date.now()}`;
            const gameData = {
                id: gameRoomId,
                hostId: this.authManager.currentUser.uid,
                hostUsername: this.authManager.currentUser.displayName,
                status: 'waiting',
                players: [{
                    uid: this.authManager.currentUser.uid,
                    username: this.authManager.currentUser.displayName,
                    status: 'active',
                    joinedAt: new Date()
                }],
                createdAt: new Date(),
                maxPlayers: maxPlayers,
                currentPlayers: 1
            };

            const db = firebase.firestore();
            await db.collection('gameRooms').doc(gameRoomId).set(gameData);
            
            this.gameId = gameRoomId;
            this.playerId = this.authManager.currentUser.uid;

            console.log('✅ Game room created:', this.gameId);
            return { success: true, gameId: this.gameId };

        } catch (error) {
            console.error('Error creating game room:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Join existing game room from gameRooms collection
     */
    async joinGameRoom(gameId) {
        try {
            if (!this.authManager.currentUser) {
                throw new Error('User not authenticated');
            }

            const db = firebase.firestore();
            const gameRef = db.collection('gameRooms').doc(gameId);
            const gameDoc = await gameRef.get();

            if (!gameDoc.exists) {
                throw new Error('Game room not found');
            }

            const game = gameDoc.data();

            if (game.currentPlayers >= game.maxPlayers) {
                throw new Error('Game is full');
            }

            const alreadyJoined = game.players.some(p => p.uid === this.authManager.currentUser.uid);
            if (alreadyJoined) {
                throw new Error('You are already in this game');
            }

            const newPlayer = {
                uid: this.authManager.currentUser.uid,
                username: this.authManager.currentUser.displayName,
                status: 'active',
                joinedAt: new Date()
            };

            await gameRef.update({
                players: firebase.firestore.FieldValue.arrayUnion(newPlayer),
                currentPlayers: game.currentPlayers + 1
            });

            this.gameId = gameId;
            this.playerId = this.authManager.currentUser.uid;

            console.log('✅ Joined game room:', gameId);
            return { success: true, gameId };

        } catch (error) {
            console.error('Error joining game room:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Leave current game
     */
    async leaveGame() {
        try {
            if (!this.gameId || !this.playerId) {
                throw new Error('Not in a game');
            }

            const db = firebase.firestore();
            const gameRef = db.collection('gameRooms').doc(this.gameId);
            const gameDoc = await gameRef.get();
            
            if (!gameDoc.exists) {
                throw new Error('Game room not found');
            }
            
            const game = gameDoc.data();

            const updatedPlayers = game.players.filter(p => p.uid !== this.playerId);
            
            if (updatedPlayers.length === 0) {
                await gameRef.delete();
            } else {
                const newHost = updatedPlayers[0];
                await gameRef.update({
                    players: updatedPlayers,
                    currentPlayers: updatedPlayers.length,
                    hostId: game.hostId === this.playerId ? newHost.uid : game.hostId,
                    hostUsername: game.hostId === this.playerId ? newHost.username : game.hostUsername
                });
            }

            if (this.gameStateListener) {
                this.gameStateListener();
            }

            this.gameId = null;
            this.playerId = null;
            this.currentGame = null;

            console.log('✅ Left game room');
            return { success: true };

        } catch (error) {
            console.error('Error leaving game:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Start game (host only)
     */
    async startGame() {
        try {
            if (!this.gameId) throw new Error('Not in a game');
            
            const db = firebase.firestore();
            const gameRef = db.collection('gameRooms').doc(this.gameId);
            const gameDoc = await gameRef.get();
            
            if (!gameDoc.exists) {
                throw new Error('Game room not found');
            }
            
            const game = gameDoc.data();

            if (game.hostId !== this.playerId) {
                throw new Error('Only host can start the game');
            }
            if (game.currentPlayers < 2) {
                throw new Error('Need at least 2 players to start');
            }

            await gameRef.update({
                status: 'started',
                startedAt: new Date()
            });

            console.log('✅ Game started');
            return { success: true };

        } catch (error) {
            console.error('Error starting game:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Listen for real-time game updates
     */
    onGameUpdate(callback) {
        try {
            if (!this.gameId) throw new Error('Not in a game');

            const db = firebase.firestore();
            this.gameStateListener = db
                .collection('gameRooms')
                .doc(this.gameId)
                .onSnapshot(
                    (doc) => {
                        if (doc.exists) {
                            this.currentGame = doc.data();
                            callback(this.currentGame);
                        }
                    },
                    (error) => {
                        console.error('Error listening to game updates:', error);
                    }
                );

        } catch (error) {
            console.error('Error setting up game listener:', error);
        }
    }

    /**
     * Update player status
     */
    async updatePlayerStatus(status) {
        try {
            if (!this.gameId) throw new Error('Not in a game');
            
            const db = firebase.firestore();
            const gameRef = db.collection('gameRooms').doc(this.gameId);
            const gameDoc = await gameRef.get();
            
            if (!gameDoc.exists) {
                throw new Error('Game room not found');
            }
            
            const game = gameDoc.data();

            const updatedPlayers = game.players.map(p => {
                if (p.uid === this.playerId) {
                    return { ...p, status };
                }
                return p;
            });

            await gameRef.update({
                players: updatedPlayers
            });

            console.log('✅ Player status updated:', status);
            return { success: true };

        } catch (error) {
            console.error('Error updating player status:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Submit game result
     */
    async submitGameResult(result) {
        try {
            if (!this.gameId) throw new Error('Not in a game');

            const db = firebase.firestore();
            const gameRef = db.collection('gameRooms').doc(this.gameId);
            
            await gameRef.update({
                status: 'finished',
                winner: result.winner,
                results: result.results || [],
                finishedAt: new Date()
            });

            console.log('✅ Game result submitted');
            return { success: true };

        } catch (error) {
            console.error('Error submitting game result:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get available games
     */
    async getAvailableGames() {
        try {
            const db = firebase.firestore();
            const snapshot = await db.collection('gameRooms')
                .where('status', '==', 'waiting')
                .where('currentPlayers', '<', 4)
                .orderBy('currentPlayers', 'desc')
                .get();

            const games = [];
            snapshot.forEach(doc => {
                games.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            return { success: true, games };

        } catch (error) {
            console.error('Error fetching available games:', error);
            return { success: false, error: error.message, games: [] };
        }
    }

    /**
     * Join matchmaking queue
     */
    async joinMatchmakingQueue() {
        try {
            if (!this.authManager.currentUser) {
                throw new Error('User not authenticated');
            }

            const queueEntry = {
                uid: this.authManager.currentUser.uid,
                username: this.authManager.currentUser.displayName,
                queuedAt: new Date()
            };

            const db = firebase.firestore();
            await db.collection('matchmakingQueue').add(queueEntry);

            const gamesSnapshot = await db.collection('gameRooms')
                .where('status', '==', 'waiting')
                .where('currentPlayers', '<', 4)
                .limit(1)
                .get();

            if (!gamesSnapshot.empty) {
                const gameId = gamesSnapshot.docs[0].id;
                return await this.joinGameRoom(gameId);
            }

            console.log('✅ Added to matchmaking queue');
            return { success: true, matched: false, message: 'Waiting for other players...' };

        } catch (error) {
            console.error('Error joining queue:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Cleanup
     */
    destroy() {
        if (this.gameStateListener) {
            this.gameStateListener();
        }
    }
}

// Initialize after AuthManager
let onlineGameManager = null;
window.addEventListener('authStateChanged', (event) => {
    if (event.detail.isAuthenticated && authManager) {
        onlineGameManager = new OnlineGameManager(authManager);
        console.log('✅ OnlineGameManager initialized');
    }
});
