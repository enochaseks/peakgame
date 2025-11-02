/**
 * Matchmaking Service for Peak Card Game
 * Handles player queuing, room creation, and online player management
 */

class MatchmakingService {
    constructor() {
        this.db = firebase.database();
        this.playerId = this.generatePlayerId();
        this.currentRoom = null;
        this.waitTimeout = 15 * 60 * 1000; // 15 minutes in milliseconds
        this.listeners = {
            onRoomCreated: null,
            onPlayerJoined: null,
            onPlayerLeft: null,
            onMatchFound: null,
            onMatchmakingCancelled: null
        };
        this.activeListeners = [];
    }

    /**
     * Generate a unique player ID for anonymous players
     */
    generatePlayerId() {
        return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Register a listener callback
     */
    on(event, callback) {
        if (this.listeners.hasOwnProperty(event)) {
            this.listeners[event] = callback;
        }
    }

    /**
     * Join the matchmaking queue for a specific game type
     * @param {number} playerCount - Number of players needed (2, 3, or 4)
     */
    async joinQueue(playerCount) {
        if (![2, 3, 4].includes(playerCount)) {
            throw new Error('Invalid player count. Must be 2, 3, or 4.');
        }

        try {
            // Check if already in queue
            if (this.currentRoom) {
                throw new Error('Already in a matchmaking queue or game');
            }

            console.log(`[Matchmaking] ${this.playerId} joining queue for ${playerCount} players`);

            // Create queue entry
            const queueEntry = {
                playerId: this.playerId,
                playerCount: playerCount,
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                status: 'waiting',
                joinedAt: Date.now()
            };

            // Add to queue
            const queueRef = this.db.ref(`matchmaking/queues/${playerCount}/${this.playerId}`);
            await queueRef.set(queueEntry);

            // Set up auto-cleanup on disconnect
            queueRef.onDisconnect().remove();

            // Listen for match creation
            this.watchForMatch(playerCount);

            // Set timeout for 15 minutes
            const timeoutId = setTimeout(() => {
                this.cancelQueue();
                if (this.listeners.onMatchmakingCancelled) {
                    this.listeners.onMatchmakingCancelled({
                        reason: 'timeout',
                        message: 'No match found after 15 minutes'
                    });
                }
            }, this.waitTimeout);

            // Store timeout ID for cleanup
            this.queueTimeoutId = timeoutId;

            // Check for existing queued players and try to create match
            await this.tryCreateMatch(playerCount);

        } catch (error) {
            console.error('[Matchmaking] Error joining queue:', error);
            throw error;
        }
    }

    /**
     * Watch for match creation
     */
    watchForMatch(playerCount) {
        const roomRef = this.db.ref(`matchmaking/rooms`);
        
        const listener = roomRef.on('child_added', (snapshot) => {
            const room = snapshot.val();
            
            // Check if this player is in the room
            if (room.players && room.players[this.playerId] && room.playerCount === playerCount) {
                this.currentRoom = {
                    roomId: snapshot.key,
                    ...room
                };

                console.log(`[Matchmaking] Match found!`, this.currentRoom);
                
                // Clear queue timeout
                if (this.queueTimeoutId) {
                    clearTimeout(this.queueTimeoutId);
                }

                // Remove from queue
                this.db.ref(`matchmaking/queues/${playerCount}/${this.playerId}`).remove().catch(console.error);

                if (this.listeners.onMatchFound) {
                    this.listeners.onMatchFound(this.currentRoom);
                }

                // Stop listening once match is found
                roomRef.off('child_added', listener);
            }
        });

        this.activeListeners.push({ ref: roomRef, event: 'child_added', callback: listener });
    }

    /**
     * Try to create a match if enough players are in queue
     */
    async tryCreateMatch(playerCount) {
        try {
            const queueRef = this.db.ref(`matchmaking/queues/${playerCount}`);
            const snapshot = await queueRef.once('value');
            const queuedPlayers = snapshot.val() || {};
            const playerIds = Object.keys(queuedPlayers);

            console.log(`[Matchmaking] Queued players for ${playerCount}: ${playerIds.length}`);

            // If we have enough players, create a room
            if (playerIds.length >= playerCount) {
                // Take first N players from queue
                const matchedPlayerIds = playerIds.slice(0, playerCount);
                await this.createRoom(matchedPlayerIds, playerCount);
            }
        } catch (error) {
            console.error('[Matchmaking] Error trying to create match:', error);
        }
    }

    /**
     * Create a new game room
     */
    async createRoom(playerIds, playerCount) {
        try {
            const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const players = {};
            const playerStats = {};

            // Initialize player objects
            playerIds.forEach(playerId => {
                players[playerId] = {
                    playerId: playerId,
                    joinedAt: firebase.database.ServerValue.TIMESTAMP,
                    status: 'ready',
                    ready: true
                };
                playerStats[playerId] = {
                    hand: [],
                    cardsInHand: 0,
                    isActive: true
                };
            });

            const room = {
                roomId: roomId,
                playerCount: playerCount,
                players: players,
                playerStats: playerStats,
                status: 'waiting_start',
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                gameStartedAt: null,
                gameState: null
            };

            // Write room to database
            await this.db.ref(`matchmaking/rooms/${roomId}`).set(room);

            // Remove matched players from queue
            const promises = playerIds.map(playerId => 
                this.db.ref(`matchmaking/queues/${playerCount}/${playerId}`).remove()
            );
            await Promise.all(promises);

            console.log(`[Matchmaking] Room created: ${roomId} with ${playerCount} players`);

            return roomId;

        } catch (error) {
            console.error('[Matchmaking] Error creating room:', error);
            throw error;
        }
    }

    /**
     * Get current room details
     */
    async getRoom(roomId) {
        try {
            const snapshot = await this.db.ref(`matchmaking/rooms/${roomId}`).once('value');
            return snapshot.val();
        } catch (error) {
            console.error('[Matchmaking] Error getting room:', error);
            throw error;
        }
    }

    /**
     * Listen to room updates in real-time
     */
    listenToRoom(roomId, callback) {
        const roomRef = this.db.ref(`matchmaking/rooms/${roomId}`);
        
        const listener = roomRef.on('value', (snapshot) => {
            const room = snapshot.val();
            if (room) {
                callback(room);
            }
        });

        this.activeListeners.push({ ref: roomRef, event: 'value', callback: listener });
        
        return () => {
            roomRef.off('value', listener);
        };
    }

    /**
     * Update player status in room
     */
    async updatePlayerStatus(roomId, status) {
        try {
            await this.db.ref(`matchmaking/rooms/${roomId}/players/${this.playerId}/status`).set(status);
        } catch (error) {
            console.error('[Matchmaking] Error updating player status:', error);
            throw error;
        }
    }

    /**
     * Cancel matchmaking and leave queue
     */
    async cancelQueue() {
        try {
            if (this.queueTimeoutId) {
                clearTimeout(this.queueTimeoutId);
            }

            // Find and remove from all queues
            const queuesRef = this.db.ref('matchmaking/queues');
            const snapshot = await queuesRef.once('value');
            const queues = snapshot.val() || {};

            const promises = Object.keys(queues).map(playerCount => 
                this.db.ref(`matchmaking/queues/${playerCount}/${this.playerId}`).remove()
            );

            await Promise.all(promises);

            console.log(`[Matchmaking] Player ${this.playerId} cancelled queue`);

        } catch (error) {
            console.error('[Matchmaking] Error cancelling queue:', error);
        }
    }

    /**
     * Leave current room and game
     */
    async leaveRoom() {
        try {
            if (!this.currentRoom) {
                throw new Error('Not in a room');
            }

            const roomId = this.currentRoom.roomId;
            
            // Remove player from room
            await this.db.ref(`matchmaking/rooms/${roomId}/players/${this.playerId}`).remove();
            
            // Remove player stats
            await this.db.ref(`matchmaking/rooms/${roomId}/playerStats/${this.playerId}`).remove();

            // Check if room is empty, if so delete it
            const snapshot = await this.db.ref(`matchmaking/rooms/${roomId}/players`).once('value');
            if (!snapshot.val()) {
                await this.db.ref(`matchmaking/rooms/${roomId}`).remove();
            }

            this.currentRoom = null;
            console.log(`[Matchmaking] Player ${this.playerId} left room ${roomId}`);

        } catch (error) {
            console.error('[Matchmaking] Error leaving room:', error);
        }
    }

    /**
     * Get active rooms count for stats
     */
    async getActiveRoomsCount() {
        try {
            const snapshot = await this.db.ref('matchmaking/rooms').once('value');
            const rooms = snapshot.val() || {};
            return Object.keys(rooms).length;
        } catch (error) {
            console.error('[Matchmaking] Error getting active rooms:', error);
            return 0;
        }
    }

    /**
     * Get queue stats
     */
    async getQueueStats() {
        try {
            const snapshot = await this.db.ref('matchmaking/queues').once('value');
            const queues = snapshot.val() || {};
            const stats = {};

            Object.keys(queues).forEach(playerCount => {
                stats[playerCount] = Object.keys(queues[playerCount] || {}).length;
            });

            return stats;
        } catch (error) {
            console.error('[Matchmaking] Error getting queue stats:', error);
            return { '2': 0, '3': 0, '4': 0 };
        }
    }

    /**
     * Clean up all listeners
     */
    cleanup() {
        this.activeListeners.forEach(({ ref, event, callback }) => {
            ref.off(event, callback);
        });
        this.activeListeners = [];

        if (this.queueTimeoutId) {
            clearTimeout(this.queueTimeoutId);
        }
    }

    /**
     * Destroy and clean up matchmaking service
     */
    async destroy() {
        await this.cancelQueue();
        this.cleanup();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MatchmakingService;
}
