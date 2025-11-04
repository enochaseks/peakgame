/**
 * AuthManager - Handles Firebase Authentication and User Management
 * Features: Register, Login, Logout, Password Reset, Session Management
 */

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.authStateUnsubscribe = null;
        this.userProfile = null;
        this.db = null;
        this.initializeFirestore();
        this.initializeAuthStateListener();
    }

    /**
     * Initialize Firestore connection
     */
    initializeFirestore() {
        try {
            // Get the default Firestore instance
            this.db = firebase.firestore();
            console.log('✅ Firestore initialized:', this.db);
            
            // Enable offline persistence
            this.db.enablePersistence()
                .then(() => console.log('✅ Firestore offline persistence enabled'))
                .catch((err) => console.warn('⚠️ Firestore offline persistence not available:', err.code));
        } catch (error) {
            console.error('❌ Error initializing Firestore:', error);
            this.db = firebase.firestore();
        }
    }

    /**
     * Initialize auth state listener to track login/logout
     */
    initializeAuthStateListener() {
        this.authStateUnsubscribe = firebase.auth().onAuthStateChanged(
            async (user) => {
                this.currentUser = user;
                this.isAuthenticated = !!user;
                
                if (user) {
                    // Reload user to get latest verification status
                    try {
                        await user.reload();
                    } catch (e) {
                        console.warn('Could not reload user:', e);
                    }
                    
                    console.log('✅ User authenticated:', user.email, 'Verified:', user.emailVerified);
                    await this.loadUserProfile(user.uid);
                } else {
                    console.log('ℹ️ User logged out');
                    this.userProfile = null;
                }
                
                // Dispatch custom event for other components
                window.dispatchEvent(new CustomEvent('authStateChanged', { 
                    detail: { 
                        user, 
                        isAuthenticated: this.isAuthenticated,
                        emailVerified: user ? user.emailVerified : false
                    } 
                }));
            },
            (error) => {
                console.error('Auth state listener error:', error);
            }
        );
    }

    /**
     * Register new user
     */
    async register(email, password, username) {
        try {
            if (!email || !password || !username) {
                throw new Error('All fields are required');
            }
            if (password.length < 6) {
                throw new Error('Password must be at least 6 characters');
            }
            if (username.length < 3) {
                throw new Error('Username must be at least 3 characters');
            }

            console.log('📝 Starting registration for:', username);

            // Create account FIRST (this is what matters)
            const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            console.log('✅ User created in Firebase Auth:', user.uid);

            // Update profile
            await user.updateProfile({ displayName: username });
            console.log('✅ Profile display name updated');

            // Try to create Firestore profile
            try {
                console.log('📝 Creating Firestore profile for:', user.uid);
                
                if (!this.db) {
                    console.warn('⚠️ Firestore not initialized, reinitializing...');
                    this.initializeFirestore();
                }

                // Create user profile in Firestore
                await this.db.collection('users').doc(user.uid).set({
                    uid: user.uid,
                    email: email,
                    username: username,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    emailVerified: false,
                    stats: {
                        gamesPlayed: 0,
                        gamesWon: 0,
                        totalPoints: 0,
                        winRate: 0
                    },
                    onlineStatus: 'online',
                    lastSeen: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                console.log('✅ Firestore profile created successfully');
            } catch (firestoreError) {
                console.error('❌ Firestore error:', firestoreError.code, firestoreError.message);
                // If it's a permission/configuration error, we need to fix it
                if (firestoreError.code === 'failed-precondition' || firestoreError.code === 'permission-denied') {
                    console.error('🔴 CRITICAL: Firestore database not properly initialized or rules not set!');
                    console.error('Please ensure Firestore is created in Firebase Console');
                    throw new Error('Database not properly configured. Please contact support.');
                }
                // For other errors, continue (offline mode)
                console.warn('⚠️ Continuing without Firestore:', firestoreError.code);
            }

            // Send verification email
            try {
                await user.sendEmailVerification();
                console.log('✅ Verification email sent to:', email);
            } catch (emailError) {
                console.warn('⚠️ Email might not be configured:', emailError.message);
            }

            console.log('✅ Registration completed successfully');
            return { success: true, user, requiresVerification: true };

        } catch (error) {
            console.error('❌ Registration error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send email verification
     */
    async sendEmailVerification() {
        try {
            const user = firebase.auth().currentUser;
            if (!user) throw new Error('No user logged in');
            if (user.emailVerified) throw new Error('Email already verified');
            
            await user.sendEmailVerification();
            console.log('✅ Verification email sent to:', user.email);
            return { success: true, message: 'Verification email sent to ' + user.email };
        } catch (error) {
            console.error('Error sending verification email:', error.message);
            // Firebase auth might not be configured to send emails, but that's okay
            if (error.code === 'auth/configuration-not-found' || error.code === 'auth/unavailable') {
                return { 
                    success: false, 
                    error: 'Email service not configured. Please check your email manually or contact support.',
                    notConfigured: true 
                };
            }
            return { success: false, error: error.message };
        }
    }

    /**
     * Check if email is verified and reload user data
     */
    async checkEmailVerification() {
        try {
            const user = firebase.auth().currentUser;
            if (!user) throw new Error('No user logged in');
            
            // Reload user to get latest verification status
            await user.reload();
            console.log('✅ Email verification status checked:', user.emailVerified);
            return {
                isVerified: user.emailVerified,
                email: user.email
            };
        } catch (error) {
            console.error('Error checking verification:', error);
            return { isVerified: false, error: error.message };
        }
    }

    /**
     * Login existing user
     */
    async login(email, password) {
        try {
            if (!email || !password) {
                throw new Error('Email and password are required');
            }

            console.log('🔐 Attempting login for:', email);

            const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            console.log('✅ Authentication successful');
            
            // Reload to get latest email verification status
            try {
                await user.reload();
            } catch (e) {
                console.warn('⚠️ Could not reload user:', e.code);
            }
            
            // Check if email is verified
            if (!user.emailVerified) {
                console.warn('⚠️ Email not verified');
                return { 
                    success: true, 
                    user, 
                    emailVerified: false,
                    message: 'Please verify your email to access all features'
                };
            }
            
            // Try to update last seen in Firestore
            try {
                if (!this.db) {
                    this.initializeFirestore();
                }
                
                await this.db.collection('users').doc(user.uid).update({
                    lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
                    onlineStatus: 'online',
                    emailVerified: user.emailVerified
                });
                console.log('✅ Firestore profile updated');
            } catch (firestoreError) {
                console.warn('⚠️ Could not update Firestore:', firestoreError.code);
                // Continue anyway - Firestore is optional
            }

            console.log('✅ Login successful');
            return { success: true, user, emailVerified: true };

        } catch (error) {
            console.error('❌ Login error:', error);
            let msg = error.message;
            if (error.code === 'auth/user-not-found') msg = 'User not found';
            else if (error.code === 'auth/wrong-password') msg = 'Incorrect password';
            else if (error.code === 'auth/invalid-email') msg = 'Invalid email format';
            else if (error.code === 'auth/user-disabled') msg = 'Account has been disabled';
            return { success: false, error: msg };
        }
    }

    /**
     * Resend verification email
     */
    async resendVerificationEmail() {
        try {
            const user = firebase.auth().currentUser;
            if (!user) throw new Error('No user logged in');
            
            await user.sendEmailVerification();
            console.log('✅ Verification email resent to:', user.email);
            return { success: true, message: 'Verification email sent to ' + user.email };
        } catch (error) {
            console.error('Error resending verification email:', error.message);
            if (error.code === 'auth/configuration-not-found' || error.code === 'auth/unavailable') {
                return { 
                    success: false, 
                    error: 'Email service not configured. Please try again later or contact support.',
                    notConfigured: true 
                };
            }
            return { success: false, error: error.message };
        }
    }

    /**
     * Check if current user's email is verified
     */
    isEmailVerified() {
        const user = firebase.auth().currentUser;
        return user ? user.emailVerified : false;
    }

    /**
     * Logout current user
     */
    async logout() {
        try {
            // Try to update Firestore if online, but don't fail if offline
            if (this.currentUser) {
                try {
                    await firebase.firestore().collection('users').doc(this.currentUser.uid).update({
                        onlineStatus: 'offline',
                        lastSeen: firebase.firestore.FieldValue.serverTimestamp()
                    });
                } catch (firestoreError) {
                    // Firestore offline or unavailable - that's okay, continue with logout
                    console.warn('⚠️ Could not update Firestore status (offline):', firestoreError.code);
                }
            }
            
            // Always do the auth logout
            await firebase.auth().signOut();
            console.log('✅ User logged out');
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            // Even if there's an error, try to sign out
            try {
                await firebase.auth().signOut();
            } catch (e) {
                console.error('Failed to sign out:', e);
            }
            return { success: true }; // Return success anyway since we need to logout
        }
    }

    /**
     * Send password reset email
     */
    async sendPasswordReset(email) {
        try {
            if (!email) throw new Error('Email is required');
            await firebase.auth().sendPasswordResetEmail(email);
            console.log('✅ Password reset email sent');
            return { success: true, message: 'Check your email for reset instructions' };
        } catch (error) {
            console.error('Password reset error:', error);
            let msg = error.message;
            if (error.code === 'auth/user-not-found') msg = 'No account found with this email';
            return { success: false, error: msg };
        }
    }

    /**
     * Load user profile from Firestore
     */
    async loadUserProfile(uid) {
        try {
            if (!this.db) {
                this.initializeFirestore();
            }
            
            const doc = await this.db.collection('users').doc(uid).get();
            if (doc.exists) {
                this.userProfile = doc.data();
                console.log('✅ User profile loaded');
            } else {
                console.warn('⚠️ User profile not found in Firestore');
            }
        } catch (error) {
            // Firestore offline - this is okay, app will work in offline mode
            if (error.code === 'unavailable' || error.message.includes('offline')) {
                console.warn('⚠️ Firestore offline - operating in offline mode');
            } else if (error.code === 'permission-denied') {
                console.error('🔴 Permission denied - check Firestore security rules');
            } else {
                console.error('Error loading profile:', error.code, error.message);
            }
        }
    }

    /**
     * Update user profile
     */
    async updateUserProfile(updates) {
        try {
            if (!this.currentUser) throw new Error('User not authenticated');
            
            if (!this.db) {
                this.initializeFirestore();
            }
            
            await this.db.collection('users').doc(this.currentUser.uid).update({
                ...updates,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
            this.userProfile = { ...this.userProfile, ...updates };
            console.log('✅ Profile updated');
            return { success: true };
        } catch (error) {
            console.error('Profile update error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Update game stats after game
     */
    async updateGameStats(gameStats) {
        try {
            if (!this.currentUser) throw new Error('User not authenticated');
            const userRef = firebase.firestore().collection('users').doc(this.currentUser.uid);
            const userDoc = await userRef.get();
            const currentStats = userDoc.data().stats || {};

            const updatedStats = {
                gamesPlayed: (currentStats.gamesPlayed || 0) + 1,
                gamesWon: (currentStats.gamesWon || 0) + (gameStats.isWinner ? 1 : 0),
                totalPoints: (currentStats.totalPoints || 0) + (gameStats.points || 0)
            };
            updatedStats.winRate = updatedStats.gamesPlayed > 0 
                ? Math.round((updatedStats.gamesWon / updatedStats.gamesPlayed) * 100) 
                : 0;

            await userRef.update({ stats: updatedStats });
            this.userProfile.stats = updatedStats;
            console.log('✅ Stats updated');
            return { success: true, stats: updatedStats };
        } catch (error) {
            console.error('Error updating stats:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get leaderboard
     */
    async getLeaderboard(limit = 50) {
        try {
            const snapshot = await firebase.firestore().collection('users')
                .orderBy('stats.gamesWon', 'desc')
                .orderBy('stats.winRate', 'desc')
                .limit(limit)
                .get();

            const leaderboard = [];
            snapshot.forEach((doc, index) => {
                leaderboard.push({
                    rank: index + 1,
                    ...doc.data()
                });
            });
            return leaderboard;
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            return [];
        }
    }

    /**
     * Get auth status
     */
    getAuthStatus() {
        return {
            isAuthenticated: this.isAuthenticated,
            currentUser: this.currentUser,
            userProfile: this.userProfile || {}
        };
    }

    /**
     * Get current user ID
     */
    getCurrentUserId() {
        return this.currentUser?.uid || null;
    }

    /**
     * Get current user profile
     */
    getCurrentUser() {
        return this.userProfile || {
            uid: this.currentUser?.uid,
            email: this.currentUser?.email,
            displayName: this.currentUser?.displayName || 'Player'
        };
    }

    /**
     * Cleanup
     */
    destroy() {
        if (this.authStateUnsubscribe) {
            this.authStateUnsubscribe();
        }
    }
}

// Initialize after Firebase loads
let authManager = null;
document.addEventListener('DOMContentLoaded', () => {
    const checkFirebase = setInterval(() => {
        if (firebase.auth) {
            authManager = new AuthManager();
            clearInterval(checkFirebase);
            console.log('✅ AuthManager initialized');
        }
    }, 100);
});
