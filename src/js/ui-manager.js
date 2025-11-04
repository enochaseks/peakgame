/**
 * UIManager - Handles UI state and mode switching
 * Manages: Mode selection, Auth UI, Game views, Screen transitions
 */

class UIManager {
    constructor() {
        this.currentMode = null; // 'local', 'online'
        this.currentScreen = null;
        this.initializeEventListeners();
    }

    /**
     * Initialize all event listeners
     */
    initializeEventListeners() {
        window.addEventListener('authStateChanged', (event) => {
            this.handleAuthStateChange(event.detail);
        });
    }

    /**
     * Show mode selection screen
     */
    showModeSelector() {
        console.log('📋 Showing mode selector');
        this.hideAllScreens();
        const modeSelector = document.getElementById('modeSelector');
        if (modeSelector) {
            modeSelector.style.display = 'flex';
            this.currentScreen = 'mode-select';
        }
    }

    /**
     * Show auth screens
     */
    showAuthUI() {
        console.log('🔐 Showing auth UI');
        this.hideAllScreens();
        const authContainer = document.getElementById('authContainer');
        if (authContainer) {
            authContainer.style.display = 'flex';
            this.currentScreen = 'auth';
        }
    }

    /**
     * Show login form
     */
    showLoginForm() {
        const forms = ['loginForm', 'registerForm', 'passwordResetForm'];
        forms.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = id === 'loginForm' ? 'block' : 'none';
        });
        this.currentScreen = 'login';
    }

    /**
     * Show register form
     */
    showRegisterForm() {
        const forms = ['loginForm', 'registerForm', 'passwordResetForm'];
        forms.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = id === 'registerForm' ? 'block' : 'none';
        });
        this.currentScreen = 'register';
    }

    /**
     * Show password reset form
     */
    showPasswordResetForm() {
        const forms = ['loginForm', 'registerForm', 'passwordResetForm'];
        forms.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = id === 'passwordResetForm' ? 'block' : 'none';
        });
        this.currentScreen = 'password-reset';
    }

    /**
     * Show local game (original game)
     */
    showLocalGame() {
        console.log('🏠 Showing local game');
        this.hideAllScreens();
        const gameContainer = document.getElementById('gameContainer');
        if (gameContainer) {
            gameContainer.style.display = 'block';
            this.currentScreen = 'game';
            this.currentMode = 'local';
        }
    }

    /**
     * Show online lobbies
     */
    showOnlineLobbies() {
        console.log('🌐 Showing online lobbies');
        this.hideAllScreens();
        const onlineContainer = document.getElementById('onlineContainer');
        if (onlineContainer) {
            onlineContainer.style.display = 'block';
            this.currentScreen = 'online';
            this.currentMode = 'online';
        }
    }

    /**
     * Hide all main screens
     */
    hideAllScreens() {
        const screens = ['modeSelector', 'authContainer', 'gameContainer', 'onlineContainer'];
        screens.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
    }

    /**
     * Handle auth state changes
     */
    handleAuthStateChange(authState) {
        const { isAuthenticated, user, emailVerified } = authState;

        if (isAuthenticated) {
            console.log('✅ User authenticated - Email Verified:', emailVerified);
            if (this.currentMode === 'online' && this.currentScreen === 'auth') {
                // Check if email is verified before showing lobbies
                if (emailVerified) {
                    this.showOnlineLobbies();
                } else {
                    console.log('⏳ Waiting for email verification...');
                    // Email not verified - verification screen will be shown by handler
                }
            }
            this.updateUserInfo(user);
        } else {
            console.log('❌ User logged out');
            if (this.currentMode === 'online') {
                this.showModeSelector();
            }
        }
    }

    /**
     * Update user info displays
     */
    updateUserInfo(user) {
        const usernameElements = document.querySelectorAll('[data-display-username]');
        usernameElements.forEach(el => {
            el.textContent = user?.displayName || 'Player';
        });

        if (authManager?.userProfile) {
            const stats = authManager.userProfile.stats || {};
            const profileSummary = document.getElementById('userProfileSummary');
            if (profileSummary) {
                profileSummary.innerHTML = `
                    <div class="user-stat"><span>Wins:</span><strong>${stats.gamesWon || 0}</strong></div>
                    <div class="user-stat"><span>Rate:</span><strong>${stats.winRate || 0}%</strong></div>
                    <div class="user-stat"><span>Points:</span><strong>${stats.totalPoints || 0}</strong></div>
                `;
            }
        }
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info', duration = 3000) {
        const notif = document.createElement('div');
        notif.className = `notification notification-${type}`;
        notif.textContent = message;
        
        const container = document.getElementById('notificationContainer') || document.body;
        container.appendChild(notif);

        setTimeout(() => notif.classList.add('show'), 10);

        if (duration > 0) {
            setTimeout(() => {
                notif.classList.remove('show');
                setTimeout(() => notif.remove(), 300);
            }, duration);
        }

        return notif;
    }

    /**
     * Show loading
     */
    showLoading(message = 'Loading...') {
        let loader = document.getElementById('loadingOverlay');
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'loadingOverlay';
            loader.className = 'loading-overlay';
            loader.innerHTML = `
                <div class="loading-content">
                    <div class="spinner"></div>
                    <p id="loadingMessage">${message}</p>
                </div>
            `;
            document.body.appendChild(loader);
        } else {
            loader.style.display = 'flex';
            const msg = document.getElementById('loadingMessage');
            if (msg) msg.textContent = message;
        }
    }

    /**
     * Hide loading
     */
    hideLoading() {
        const loader = document.getElementById('loadingOverlay');
        if (loader) loader.style.display = 'none';
    }

    /**
     * Get current state
     */
    getState() {
        return {
            currentMode: this.currentMode,
            currentScreen: this.currentScreen
        };
    }
}

// Global instance
let uiManager = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    uiManager = new UIManager();
    console.log('✅ UIManager initialized');
});
