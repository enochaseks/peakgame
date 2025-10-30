"""
Game rules validation and enforcement for the Peak card game.
"""

from typing import List, Optional
from card import Card, CardType
from player import Player


class GameRules:
    """Handles all rule validation and enforcement for the Peak card game."""
    
    @staticmethod
    def can_play_card(card: Card, last_played_card: Optional[Card] = None) -> bool:
        """
        Check if a card can be played based on game rules.
        
        Args:
            card: The card to check
            last_played_card: The previously played card
            
        Returns:
            True if card can be played, False otherwise
        """
        # Peak cards can always be played
        if card.is_peak_card():
            return True
        
        # If no card has been played yet, any regular card can be played
        if last_played_card is None:
            return True
        
        # If last card was a Peak card, any regular card can be played
        if last_played_card.is_peak_card():
            return True
        
        # Regular cards can be played if they match the value or are adjacent
        if not card.is_peak_card() and not last_played_card.is_peak_card():
            value_diff = abs(card.value - last_played_card.value)
            return value_diff <= 1  # Same value or adjacent values
        
        return False
    
    @staticmethod
    def can_finish_on_card(card: Card, high_card_played_this_round: bool = False) -> bool:
        """
        Check if a player can finish the game on a specific card.
        
        Args:
            card: The card to check
            high_card_played_this_round: Whether an 8-10 card was played this round
            
        Returns:
            True if player can finish on this card, False otherwise
        """
        # Cannot finish on Peak cards
        if card.is_peak_card():
            return False
        
        # Cannot finish on cards 1-4
        if 1 <= card.value <= 4:
            return False
        
        # Can always finish on cards 5-6
        if 5 <= card.value <= 6:
            return True
        
        # Can finish on cards 8-10 only if someone played an 8-10 this round
        if 8 <= card.value <= 10:
            return high_card_played_this_round
        
        # Card 7 is not mentioned in rules, assume cannot finish on it
        if card.value == 7:
            return False
        
        return False
    
    @staticmethod
    def should_disqualify_player(player: Player) -> bool:
        """
        Check if a player should be disqualified.
        
        Args:
            player: The player to check
            
        Returns:
            True if player should be disqualified, False otherwise
        """
        return len(player.hand) > 20
    
    @staticmethod
    def get_peak_card_penalty() -> int:
        """
        Get the number of cards a player must pick up when a Peak card is played.
        
        Returns:
            Number of penalty cards (always 5)
        """
        return 5
    
    @staticmethod
    def is_high_value_card(card: Card) -> bool:
        """
        Check if a card is considered high value (8-10).
        
        Args:
            card: The card to check
            
        Returns:
            True if card is 8, 9, or 10, False otherwise
        """
        return not card.is_peak_card() and 8 <= card.value <= 10
    
    @staticmethod
    def validate_game_state(players: List[Player]) -> List[str]:
        """
        Validate the current game state and return any rule violations.
        
        Args:
            players: List of all players in the game
            
        Returns:
            List of rule violation messages (empty if no violations)
        """
        violations = []
        
        # Check if any players should be disqualified
        for player in players:
            if not player.is_disqualified and GameRules.should_disqualify_player(player):
                violations.append(f"{player.name} should be disqualified (>20 cards)")
        
        # Check if game should end (only one active player remaining)
        active_players = [p for p in players if p.is_active()]
        if len(active_players) <= 1:
            violations.append("Game should end - only one or no active players remaining")
        
        return violations
    
    @staticmethod
    def get_winner(players: List[Player]) -> Optional[Player]:
        """
        Determine the winner of the game.
        
        Args:
            players: List of all players in the game
            
        Returns:
            The winning player, or None if no winner yet
        """
        active_players = [p for p in players if p.is_active()]
        
        # If only one player is active, they win
        if len(active_players) == 1:
            return active_players[0]
        
        # If no players are active, no winner
        if len(active_players) == 0:
            return None
        
        # Check if any player has finished the game
        finished_players = [p for p in players if p.has_finished]
        if finished_players:
            return finished_players[0]  # First player to finish wins
        
        return None
    
    @staticmethod
    def is_valid_starting_hand_size() -> int:
        """
        Get the valid starting hand size for each player.
        
        Returns:
            Number of cards each player starts with
        """
        return 7  # Standard starting hand size
    
    @staticmethod
    def get_max_players() -> int:
        """
        Get the maximum number of players allowed in a game.
        
        Returns:
            Maximum number of players (always 4)
        """
        return 4
    
    @staticmethod
    def get_min_players() -> int:
        """
        Get the minimum number of players required for a game.
        
        Returns:
            Minimum number of players (always 4)
        """
        return 4