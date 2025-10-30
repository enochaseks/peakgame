"""
Entry point for running the Peak card game.
"""

import sys
from typing import List
from game import PeakGame
from player import Player
from card import Card


def get_player_names() -> List[str]:
    """Get player names from user input."""
    print("Welcome to Peak Card Game!")
    print("This game requires exactly 4 players.\n")
    
    player_names = []
    for i in range(4):
        while True:
            name = input(f"Enter name for Player {i + 1}: ").strip()
            if name and name not in player_names:
                player_names.append(name)
                break
            elif name in player_names:
                print("Name already taken. Please choose a different name.")
            else:
                print("Please enter a valid name.")
    
    return player_names


def display_game_rules():
    """Display the rules of the Peak card game."""
    print("\n" + "="*50)
    print("PEAK CARD GAME RULES")
    print("="*50)
    print("• 4 players per game")
    print("• Deck contains cards numbered 1-10 and 10 special 'Peak' cards")
    print("• Each player starts with 7 cards")
    print("\nFINISHING RULES:")
    print("• Players CANNOT finish on cards 1-4")
    print("• Players CAN finish on cards 5-6")
    print("• Players CAN finish on cards 8-10 ONLY if someone else played an 8-10 card this round")
    print("\nSPECIAL CARDS:")
    print("• Peak cards force the next player to pick up 5 additional cards")
    print("• Peak cards can always be played")
    print("\nDISQUALIFICATION:")
    print("• Players with over 20 cards are disqualified")
    print("• Last player standing wins")
    print("="*50 + "\n")


def display_player_hand(player: Player):
    """Display a player's hand in a formatted way."""
    print(f"\n{player.name}'s hand ({len(player.hand)} cards):")
    for i, card in enumerate(player.hand, 1):
        print(f"  {i}. {card}")


def get_player_choice(game: PeakGame, player: Player) -> str:
    """Get the player's choice for their turn."""
    playable_cards, can_draw = game.get_player_options(player)
    
    print(f"\n{player.name}'s turn!")
    display_player_hand(player)
    
    last_card = game.get_last_played_card()
    if last_card:
        print(f"Last played card: {last_card}")
    
    print(f"High card played this round: {game.high_card_played_this_round}")
    
    print("\nOptions:")
    if playable_cards:
        print("P - Play a card")
    if can_draw:
        print("D - Draw a card")
    print("Q - Quit game")
    print("H - Show hand again")
    print("S - Show game state")
    
    while True:
        choice = input("Choose an option: ").strip().upper()
        if choice in ['P', 'D', 'Q', 'H', 'S']:
            return choice
        print("Invalid choice. Please try again.")


def handle_play_card(game: PeakGame, player: Player) -> bool:
    """Handle the player's choice to play a card."""
    playable_cards, _ = game.get_player_options(player)
    
    if not playable_cards:
        print("No playable cards available!")
        return False
    
    print("\nPlayable cards:")
    for i, card in enumerate(playable_cards, 1):
        print(f"  {i}. {card}")
    
    while True:
        try:
            choice = input("Enter card number to play (or 'back' to return): ").strip()
            if choice.lower() == 'back':
                return False
            
            card_index = int(choice) - 1
            if 0 <= card_index < len(playable_cards):
                card_to_play = playable_cards[card_index]
                return game.play_card(player, card_to_play)
            else:
                print("Invalid card number.")
        except ValueError:
            print("Please enter a valid number or 'back'.")


def play_game():
    """Main game loop."""
    try:
        # Display rules
        display_game_rules()
        
        # Get player names
        player_names = get_player_names()
        
        # Create and setup game
        game = PeakGame(player_names)
        game.setup_game()
        
        # Main game loop
        while not game.is_game_over():
            current_player = game.get_current_player()
            
            # Skip turn if player is not active
            if not current_player.is_active():
                continue
            
            # Get player's choice
            choice = get_player_choice(game, current_player)
            
            if choice == 'P':
                handle_play_card(game, current_player)
            elif choice == 'D':
                game.draw_card(current_player)
            elif choice == 'Q':
                print("Thanks for playing!")
                return
            elif choice == 'H':
                display_player_hand(current_player)
                input("Press Enter to continue...")
            elif choice == 'S':
                game.display_game_state()
                input("Press Enter to continue...")
        
        # Game over
        winner = game.get_winner()
        if winner:
            print(f"\n🎉 Congratulations {winner.name}! You won! 🎉")
        else:
            print("\n😞 Game ended with no winner.")
            
    except KeyboardInterrupt:
        print("\n\nGame interrupted. Thanks for playing!")
    except Exception as e:
        print(f"\nAn error occurred: {e}")
        print("Please report this issue.")


def main():
    """Main entry point."""
    try:
        play_game()
    except Exception as e:
        print(f"Fatal error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()