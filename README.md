# Peak Card Game

A Python implementation of the "Peak" card game - a strategic card game for exactly 4 players with unique finishing rules and special Peak cards.

## Game Overview

Peak is an exciting card game where players race to get rid of all their cards while navigating special rules about which cards they can finish on. The game features regular numbered cards (1-10) and special "Peak" cards that add strategic complexity.

## Game Rules

### Setup
- **Players**: Exactly 4 players required
- **Deck**: 10 regular cards (numbered 1-10) + 10 special "Peak" cards
- **Starting Hand**: Each player begins with 7 cards

### Basic Gameplay
- Players take turns playing cards or drawing from the deck
- Cards can be played if they match the previous card's value or are adjacent (±1)
- Peak cards can always be played

### Finishing Rules
Players have different restrictions on which cards they can use to win:

- **Cannot finish on cards 1-4**: These cards cannot be your final card
- **Can finish on cards 5-6**: Always allowed as finishing cards
- **Can finish on cards 8-10**: Only allowed if someone else played an 8-10 card during the current round

### Special Peak Card Effects
- When a Peak card is played, the next player must pick up **5 additional cards**
- Peak cards can be played at any time
- Peak cards cannot be used to finish the game

### Disqualification
- Players with **more than 20 cards** are automatically disqualified
- Disqualified players are eliminated from the game

### Winning
- The last active player standing wins the game
- A player wins immediately upon playing their final card (if it's a valid finishing card)

## Installation & Setup

### Prerequisites
- Python 3.6 or higher
- No additional dependencies required

### Running the Game

1. **Clone or download the project files**
2. **Navigate to the project directory**
3. **Run the game**:
   ```bash
   python main.py
   ```

## Project Structure

```
Peak Card Game/
├── main.py          # Entry point - run this to start the game
├── game.py          # Main game logic and flow control
├── player.py        # Player class and hand management
├── card.py          # Card classes and deck management
├── rules.py         # Game rules validation and enforcement
├── tests/           # Unit tests
│   └── test_peak_game.py
├── .github/
│   └── copilot-instructions.md
└── README.md        # This file
```

## How to Play

### Starting a Game
1. Run `python main.py`
2. Enter names for all 4 players when prompted
3. The game will automatically deal 7 cards to each player

### During Your Turn
You can choose to:
- **Play a card** (P) - Select from your playable cards
- **Draw a card** (D) - Take a card from the deck
- **Show hand** (H) - Display your current cards
- **Show game state** (S) - View all players' card counts and game status
- **Quit** (Q) - Exit the game

### Game Display
The game shows:
- Number of cards remaining in the deck
- Last played card
- Whether a high card (8-10) was played this round
- Each player's card count and status
- Current player's turn

### Strategy Tips
- Save cards 5-6 for finishing since they're always valid
- Pay attention to when high cards (8-10) are played in a round
- Use Peak cards strategically to force opponents to draw cards
- Watch opponents' card counts to avoid helping them get disqualified

## Running Tests

To run the unit tests:

```bash
python -m pytest tests/
```

Or run the test file directly:

```bash
python tests/test_peak_game.py
```

## Code Architecture

### Classes

**Card**: Represents individual cards with value and type (regular/Peak)
**Deck**: Manages the card deck with shuffling and dealing
**Player**: Handles player state, hand management, and status
**GameRules**: Validates moves and enforces game rules
**PeakGame**: Coordinates the overall game flow and turn management

### Key Features
- **Type hints** for better code clarity
- **Comprehensive error handling** for invalid moves
- **Modular design** for easy testing and maintenance
- **Extensive unit tests** for game logic validation
- **Clear separation of concerns** between game components

## Development

### Code Style
- Follow PEP 8 Python style guidelines
- Use descriptive variable and function names
- Include docstrings for all classes and methods
- Add type hints where appropriate

### Testing
- Unit tests cover all major game mechanics
- Test both valid and invalid game states
- Verify rule enforcement and edge cases

### Contributing
1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## Game Variations

The current implementation follows the standard Peak rules, but the modular design allows for easy customization:

- Modify starting hand size in `GameRules.is_valid_starting_hand_size()`
- Adjust Peak card penalty in `GameRules.get_peak_card_penalty()`
- Change disqualification threshold in `GameRules.should_disqualify_player()`
- Add new card types by extending the `CardType` enum

## Troubleshooting

### Common Issues

**"Peak requires exactly 4 players" error**
- Ensure you enter exactly 4 unique player names

**Game seems stuck**
- Check if all players have been disqualified
- Verify the deck isn't empty

**Invalid move errors**
- Review the finishing rules for your current card
- Check if the card you're trying to play follows adjacency rules

## License

This project is open source and available under the MIT License.

## Acknowledgments

Created as a digital implementation of the Peak card game with a focus on clean code architecture and comprehensive game rule enforcement.