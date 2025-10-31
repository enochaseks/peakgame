# Audio Files for Peak Card Game

## Required Audio Files

### Background Music
Place in `audio/music/` folder:
- `background-music.mp3` - Main background music (looping, 30-120 seconds)
- `background-music.ogg` - Fallback format for better browser compatibility

**Recommendations:**
- Peaceful, ambient, non-distracting music
- Light electronic or acoustic instrumental
- Volume should be moderate (not overpowering)
- Seamless loop (no noticeable gap when repeating)

### Sound Effects
Place in `audio/sfx/` folder:

#### Card Sounds
- `card-flip.mp3/.ogg` - When drawing cards from deck
- `card-place.mp3/.ogg` - When playing regular cards
- `peak-card.mp3/.ogg` - Special sound for Peak cards (more dramatic)

#### Game Events  
- `win-sound.mp3/.ogg` - Victory celebration sound
- `lose-sound.mp3/.ogg` - Defeat/error sound
- `turn-notification.mp3/.ogg` - Subtle notification when it's your turn

#### Interface
- `button-click.mp3/.ogg` - UI button clicks and interactions

**Recommendations:**
- Keep sounds short (0.5-2 seconds)
- Clear, crisp audio quality
- Not too loud or jarring
- Match the game's friendly, casual tone

## File Formats
- **Primary**: MP3 (best compatibility)
- **Fallback**: OGG (better compression, open source)

Both formats are loaded for maximum browser compatibility.

## Audio Sources
Good places to find free game audio:
- **Freesound.org** - Community-generated sounds
- **Zapsplat.com** - Professional sound library (free with account)
- **Pixabay.com** - Free music and sound effects
- **Incompetech.com** - Royalty-free music by Kevin MacLeod

## Volume Levels
The game automatically sets appropriate volume levels:
- Background music: 30% of user volume setting
- Sound effects: 100% of user volume setting
- Individual sounds have pre-set volume attributes in HTML

## Browser Compatibility
- Modern browsers require user interaction before audio can play
- The game handles this automatically with a "Start Music" button
- All audio elements have multiple format sources for compatibility