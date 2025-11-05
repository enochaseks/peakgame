# Peak Card Game - itch.io & Newgrounds Deployment Guide

## 🎮 About the Game
Peak Card Game is a fast-paced multiplayer card game featuring special cards like Peak, Reverse, Star, Goblin, and Pause cards. Play locally with friends or online with players worldwide!

## 📦 Building for Upload

### Method 1: Using npm script (Recommended)
```bash
npm run build:itch
```

### Method 2: Using PowerShell directly
```bash
.\build-itch.ps1
```

### Method 3: Using bash (Mac/Linux)
```bash
chmod +x build-itch.sh
./build-itch.sh
```

## 📤 Uploading to itch.io

1. Go to https://itch.io/game/new
2. Fill in game details:
   - **Title**: Peak Card Game
   - **Project URL**: peak-card-game (or your preferred URL)
   - **Classification**: Game
   - **Kind of project**: HTML

3. Upload the `peak-card-game.zip` file
4. Set the following options:
   - ✅ This file will be played in the browser
   - Embed options: Click "Embed in page"
   - Viewport dimensions: 1920 x 1080 (or "Automatically start in fullscreen")
   - Set "Frame options" to "fullscreen"

5. Add screenshots and description
6. Set pricing (Free or Paid)
7. Click "Save & view page" to publish!

## 📤 Uploading to Newgrounds

1. Go to https://www.newgrounds.com/projects/games/new
2. Fill in game details:
   - **Title**: Peak Card Game
   - **Category**: Strategy / Card Game

3. Upload the `peak-card-game.zip` file
4. Set as HTML5 game
5. Set viewport dimensions: 1920 x 1080
6. Add thumbnails and description
7. Submit for approval!

## 🎯 Game Features to Highlight

### Special Cards:
- ⛰️ **Peak Cards**: Next player draws 5 cards
- 🔄 **Reverse Cards**: Changes play direction
- ✨ **Star Cards**: Removes all Peak cards from other players
- 👹 **Goblin Cards**: Gives bad cards to all players
- ⏸️ **Pause Cards**: Freezes a player for 2 minutes

### Game Modes:
- **Local Multiplayer**: 2-4 players on the same device
- **Online Multiplayer**: Play with friends or matchmaking
- **Cross-platform**: Works on desktop, tablet, and mobile

## 📝 Recommended Description

```
🎴 Peak Card Game - The Ultimate Multiplayer Card Showdown!

Challenge your friends in this fast-paced card game featuring powerful special cards that can change the game in an instant!

🎮 FEATURES:
✅ Local & Online Multiplayer
✅ 2-4 Players
✅ 5 Types of Special Cards
✅ Strategic Gameplay
✅ Beautiful Card Animations
✅ Mobile & Desktop Support

⛰️ Play Peak cards to overwhelm opponents
🔄 Reverse the direction of play
✨ Remove enemy Peak cards with Star cards
👹 Curse everyone with Goblin cards
⏸️ Freeze opponents with Pause cards

Can you be the last player standing?

🎯 How to Play:
- Cannot finish on cards 1-4 or special cards
- Can finish on cards 5-6 anytime
- Can finish on cards 8-10 if a high card was played this round
- Get disqualified if you have over 20 cards
- Last player standing wins!

🎵 Features music and sound effects
🌐 Play online or locally with friends
📱 Works on all devices
```

## 🔧 Technical Details

- Built with: HTML5, CSS3, JavaScript
- Framework: Vite
- Backend: Firebase (for online multiplayer)
- Resolution: Responsive (1920x1080 recommended)
- File size: ~2-5 MB (optimized)

## ⚠️ Important Notes

1. The game includes Firebase configuration for online multiplayer
2. Audio files are included and preloaded
3. The game works offline for local multiplayer
4. Online features require Firebase to be properly configured

## 🐛 Common Issues

### Build fails:
```bash
# Make sure dependencies are installed
npm install

# Then try building again
npm run build:itch
```

### Zip file too large:
- The build is already optimized by Vite
- Images and audio are compressed
- Firebase config is minimal

### Game doesn't load on itch.io:
- Make sure "This file will be played in the browser" is checked
- Set viewport to "Fullscreen" or at least 1920x1080
- Enable "Mobile friendly" if you want mobile support

## 📞 Support

For issues or questions:
- GitHub: https://github.com/enochaseks/peakgame
- Open an issue on GitHub for bug reports

## 📜 License

ISC License - See LICENSE file for details

---

Made with ❤️ by Enoch
