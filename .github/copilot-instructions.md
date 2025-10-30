<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Peak Card Game Project Instructions

## Project Overview
This is a Python implementation of the "Peak" card game with the following rules:
- 4 players per game
- Deck contains cards numbered 1-10 and 10 special "Peak" cards
- Players cannot finish on cards 1-4
- Players can finish on cards 5-6
- Players can finish on cards 8-10 only if someone else drops an 8-10 card
- Peak cards force the next player to pick up 5 additional cards
- Players with over 20 cards are disqualified
- Last player standing wins

## Development Guidelines
- Use Python 3.x for all implementations
- Follow object-oriented programming principles
- Implement proper error handling and input validation
- Include comprehensive documentation and comments
- Write clean, readable code with descriptive variable names
- Use type hints where appropriate
- Implement proper game state management
- Include unit tests for game logic

## Code Organization
- `game.py` - Main game logic and flow control
- `player.py` - Player class and related methods
- `card.py` - Card classes and deck management
- `rules.py` - Game rules validation and enforcement
- `main.py` - Entry point for running the game
- `tests/` - Unit tests for all modules

## Completed Steps
✅ Create copilot-instructions.md file - Created project instructions and guidelines