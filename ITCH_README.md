# Peak Card Game

A competitive 4-player card game with strategic gameplay, special cards, and real-time multiplayer support!

## Game Overview

**Peak** is an exciting card game where players race to get rid of their cards first. But it's not just about playing numbers - special cards like Peak, Goblin, Star, Reverse, and the rare Pause card add tactical depth and hilarious moments.

## How to Play

### Game Rules

- **Players:** 4 players per game
- **Deck:** Regular cards (1-10), plus special cards (Peak, Goblin, Star, Reverse, Pause)
- **Goal:** Be the first to get rid of all your cards!

### Card Types

1. **Regular Cards (1-10)** - Play adjacent numbers or pass
2. **Peak Card** 🔴 PEAAAKKK - Next player draws 5 cards (+5)
3. **Goblin Card** 💜 👹GOBLIN - Next player draws 1 card (+1)
4. **Star Card** 💚 ✨STAR - Removes peak cards from other players (-Peak)
5. **Reverse Card** 💜 ↩️REVERSE - Reverses play direction
6. **Pause Card** 🟡 ⏸️PAUSE (RARE!) - Pauses next player for 10 seconds

### Finishing Rules

- **Can't finish on:** Cards 1-4
- **Can finish on:** Cards 5-6
- **Can finish on 8-10:** Only if someone has already played an 8-10
- **Can't finish on:** Special cards

### Disqualification

Get disqualified if you have more than 20 cards!

## Features

✨ **Real-time Multiplayer** - Play with friends online using PIN-based join
🎮 **Beautiful UI** - Smooth animations and interactive gameplay
🎵 **Sound Effects** - Audio feedback for all game actions
📱 **Mobile Friendly** - Play on phone, tablet, or desktop
🔄 **Live Sync** - Firebase integration for seamless multiplayer
⚡ **PWA Support** - Install as an app on your home screen
💾 **Offline Ready** - Service worker caching for reliability

## How to Play Online

1. **Create Game** - Enter your name and create a new game
2. **Share PIN** - Share the 4-digit PIN with friends
3. **Join Game** - Friends enter PIN to join your game
4. **Play!** - Once all players join, start the game and play!

## Starting a Game

- Host creates a game with player count (4 players)
- Up to 4 players can join using the game PIN
- Host can start once all players have joined
- Players can be on different devices/networks

## Controls

- **Click/Tap Card** - Play a card (if valid)
- **Draw Card Button** - Draw from deck (when it's your turn)
- **Audio Toggle** - Control sound effects and background music
- **Volume Slider** - Adjust audio volume

## Technical Details

- **Built with:** Vanilla JavaScript, HTML5, CSS3
- **Backend:** Firebase Realtime Database
- **Hosting:** Firebase Hosting
- **PWA:** Service Worker + Web Manifest

## Browser Support

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile, etc.)

## Tips & Strategies

🎯 **Save Special Cards** - Don't waste them early; use them strategically
🎯 **Watch the Numbers** - Remember what high cards have been played
🎯 **Use Peak Wisely** - Peak cards can turn the game around!
🎯 **Count Your Cards** - Keep track of opponent card counts
🎯 **Reverse Smartly** - Reverse cards are powerful when used at the right moment

## Troubleshooting

**"Can't join game?"**
- Make sure PIN is correct
- Check that game hasn't started yet
- Verify internet connection

**"Game feels laggy?"**
- Check your internet connection
- Refresh the page
- Try a different browser

**"Sounds not working?"**
- Click "Start Music" button
- Adjust volume slider
- Check browser audio settings

## About

Created with ❤️ for card game enthusiasts and party gamers!

Enjoy the game and may the cards be ever in your favor! 🎴

---

**Version:** 1.0.0  
**Last Updated:** November 2025
