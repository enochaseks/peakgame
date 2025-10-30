"""
Main game logic and flow control for the Peak card game.
"""

import random
from typing import List, Optional, Tuple
from card import Card, Deck, CardType
from player import Player
from rules import GameRules


class PeakGame:
    """Main game class that manages the Peak card game flow."""
    
    def __init__(self, player_names: List[str]):
        """
        Initialize a new Peak game.
        
        Args:
            player_names: List of player names (must be exactly 4)
        """
        if len(player_names) != GameRules.get_max_players():
            raise ValueError(f"Peak requires exactly {GameRules.get_max_players()} players")
        
        self.players: List[Player] = [Player(name) for name in player_names]
        self.deck = Deck()
        self.discard_pile: List[Card] = []
        self.current_player_index = 0
        self.game_over = False
        self.winner: Optional[Player] = None
        self.high_card_played_this_round = False
        self.round_number = 1
        
    def setup_game(self) -> None:
        """Set up the game by dealing cards to all players."""
        starting_hand_size = GameRules.is_valid_starting_hand_size()
        
        # Deal cards to each player
        for player in self.players:
            cards = self.deck.deal_cards(starting_hand_size)
            player.add_cards(cards)
        
        print(f"Game setup complete. Each player starts with {starting_hand_size} cards.")
        self._display_game_state()
    
    def get_current_player(self) -> Player:
        """Get the current active player."""
        return self.players[self.current_player_index]
    
    def get_last_played_card(self) -> Optional[Card]:
        """Get the last card played (top of discard pile)."""
        return self.discard_pile[-1] if self.discard_pile else None
    
    def play_card(self, player: Player, card: Card) -> bool:
        """
        Attempt to play a card for the given player.
        
        Args:
            player: The player attempting to play the card
            card: The card to play
            
        Returns:
            True if card was successfully played, False otherwise
        """
        # Check if it's the player's turn
        if player != self.get_current_player():
            print(f"It's not {player.name}'s turn!")
            return False
        
        # Check if player has the card
        if card not in player.hand:
            print(f"{player.name} doesn't have that card!")
            return False
        
        # Check if card can be played according to rules
        last_card = self.get_last_played_card()
        if not GameRules.can_play_card(card, last_card):
            print(f"Cannot play {card} - invalid move!")
            return False
        
        # Play the card
        player.remove_card(card)
        self.discard_pile.append(card)
        
        print(f"{player.name} played {card}")
        
        # Check if it's a high-value card (8-10)
        if GameRules.is_high_value_card(card):
            self.high_card_played_this_round = True
            print(f"High card played! Players can now finish on cards 8-10.")
        
        # Handle Peak card special effect
        if card.is_peak_card():
            self._handle_peak_card()
        
        # Check if player can finish on this card
        if not player.has_cards():
            if GameRules.can_finish_on_card(card, self.high_card_played_this_round):
                player.finish_game()
                print(f"{player.name} has finished the game!")
                self._check_game_over()
                return True
            else:
                # Player tried to finish on an invalid card
                print(f"{player.name} cannot finish on {card}!")
                # Player must pick up a penalty card
                penalty_card = self.deck.deal_card()
                if penalty_card:
                    player.add_card(penalty_card)
                    print(f"{player.name} picks up a penalty card: {penalty_card}")
        
        # Move to next player
        self._next_player()
        
        return True
    
    def _handle_peak_card(self) -> None:
        """Handle the special effect of a Peak card being played."""
        penalty_cards = GameRules.get_peak_card_penalty()
        next_player = self._get_next_active_player()
        
        if next_player:
            dealt_cards = self.deck.deal_cards(penalty_cards)
            next_player.add_cards(dealt_cards)
            print(f"{next_player.name} must pick up {penalty_cards} cards due to Peak card!")
            
            # Check if player is now disqualified
            if GameRules.should_disqualify_player(next_player):
                next_player.disqualify()
                print(f"{next_player.name} is disqualified for having over 20 cards!")
    
    def _get_next_active_player(self) -> Optional[Player]:
        """Get the next active player in turn order."""
        start_index = (self.current_player_index + 1) % len(self.players)
        
        for i in range(len(self.players)):
            player_index = (start_index + i) % len(self.players)
            player = self.players[player_index]
            if player.is_active():
                return player
        
        return None
    
    def _next_player(self) -> None:
        """Move to the next active player."""
        original_index = self.current_player_index
        
        for _ in range(len(self.players)):
            self.current_player_index = (self.current_player_index + 1) % len(self.players)
            current_player = self.players[self.current_player_index]
            
            if current_player.is_active():
                break
        else:
            # No active players found
            self._check_game_over()
            return
        
        # Check if we've completed a full round
        if self.current_player_index <= original_index:
            self.round_number += 1
            self.high_card_played_this_round = False
            print(f"\n--- Round {self.round_number} ---")
    
    def draw_card(self, player: Player) -> bool:
        """
        Allow a player to draw a card from the deck.
        
        Args:
            player: The player drawing a card
            
        Returns:
            True if card was drawn successfully, False otherwise
        """
        if player != self.get_current_player():
            print(f"It's not {player.name}'s turn!")
            return False
        
        card = self.deck.deal_card()
        if card:
            player.add_card(card)
            print(f"{player.name} drew a card: {card}")
            
            # Check if player is now disqualified
            if GameRules.should_disqualify_player(player):
                player.disqualify()
                print(f"{player.name} is disqualified for having over 20 cards!")
            
            self._next_player()
            return True
        else:
            print("No more cards in the deck!")
            return False
    
    def _check_game_over(self) -> None:
        """Check if the game should end and determine winner."""
        winner = GameRules.get_winner(self.players)
        
        if winner:
            self.game_over = True
            self.winner = winner
            print(f"\n🎉 Game Over! {winner.name} wins! 🎉")
        
        # Also check if we need to end due to no active players
        active_players = [p for p in self.players if p.is_active()]
        if len(active_players) == 0:
            self.game_over = True
            print("\n❌ Game Over! No active players remaining. No winner.")
    
    def get_player_options(self, player: Player) -> Tuple[List[Card], bool]:
        """
        Get the available options for a player's turn.
        
        Args:
            player: The player to get options for
            
        Returns:
            Tuple of (playable_cards, can_draw)
        """
        if player != self.get_current_player() or not player.is_active():
            return [], False
        
        last_card = self.get_last_played_card()
        playable_cards = []
        
        for card in player.hand:
            if GameRules.can_play_card(card, last_card):
                playable_cards.append(card)
        
        can_draw = not self.deck.is_empty()
        
        return playable_cards, can_draw
    
    def _display_game_state(self) -> None:
        """Display the current state of the game."""
        print(f"\n--- Game State (Round {self.round_number}) ---")
        print(f"Cards in deck: {self.deck.cards_remaining()}")
        
        if self.discard_pile:
            print(f"Last played card: {self.discard_pile[-1]}")
        
        print(f"High card played this round: {self.high_card_played_this_round}")
        print("\nPlayers:")
        
        for i, player in enumerate(self.players):
            status = ""
            if player.is_disqualified:
                status = " (DISQUALIFIED)"
            elif player.has_finished:
                status = " (FINISHED)"
            elif i == self.current_player_index:
                status = " (CURRENT TURN)"
            
            print(f"  {player.name}: {len(player.hand)} cards{status}")
    
    def is_game_over(self) -> bool:
        """Check if the game is over."""
        return self.game_over
    
    def get_winner(self) -> Optional[Player]:
        """Get the winner of the game."""
        return self.winner
    
    def display_game_state(self) -> None:
        """Public method to display game state."""
        self._display_game_state()