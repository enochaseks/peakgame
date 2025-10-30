// Simple Node.js server for cross-device multiplayer
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// In-memory storage for game sessions
const gameSessions = new Map();

// Serve the main game file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API endpoints for game sessions
app.post('/api/game/:pin', (req, res) => {
    const pin = req.params.pin;
    const gameData = req.body;
    
    gameSessions.set(pin, gameData);
    console.log(`💾 Saved game session ${pin}:`, gameData);
    
    res.json({ success: true });
});

app.get('/api/game/:pin', (req, res) => {
    const pin = req.params.pin;
    const gameData = gameSessions.get(pin);
    
    if (gameData) {
        console.log(`📖 Loaded game session ${pin}`);
        res.json(gameData);
    } else {
        res.status(404).json({ error: 'Game not found' });
    }
});

app.delete('/api/game/:pin', (req, res) => {
    const pin = req.params.pin;
    gameSessions.delete(pin);
    console.log(`🗑️ Deleted game session ${pin}`);
    
    res.json({ success: true });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Peak Card Game server running on http://localhost:${PORT}`);
    console.log(`🌐 Share this address with friends: http://YOUR_IP_ADDRESS:${PORT}`);
    console.log('📱 To find your IP: Run "ipconfig" in Command Prompt and look for IPv4 Address');
});