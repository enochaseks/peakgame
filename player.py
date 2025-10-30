"""
Player class and related methods for the Peak card game.
"""

from typing import List, Optional
from card import Card, CardType


class Player:
    """Represents a player in the Peak card game."""
    
    def __init__(self, name: str):
        """
        Initialize a player.
        
        Args:
            name: The player's name
        """
        self.name = name
        self.hand: List[Card] = []
        self.is_disqualified = False
        self.has_finished = False
    
    def __str__(self) -> str:
        """String representation of the player."""
        return f"{self.name} ({len(self.hand)} cards)"
    
    def __repr__(self) -> str:
        """Detailed string representation of the player."""
        return f"Player(name='{self.name}', cards={len(self.hand)}, disqualified={self.is_disqualified})"
    
    def add_card(self, card: Card) -> None:
        """
        Add a card to the player's hand.
        
        Args:
            card: The card to add
        """
        self.hand.append(card)
        
        # Check if player should be disqualified
        if len(self.hand) > 20:
            self.is_disqualified = True
    
    def add_cards(self, cards: List[Card]) -> None:
        """
        Add multiple cards to the player's hand.
        
        Args:
            cards: List of cards to add
        """
        for card in cards:
            self.add_card(card)
    
    def remove_card(self, card: Card) -> bool:
        """
        Remove a specific card from the player's hand.
        
        Args:
            card: The card to remove
            
        Returns:
            True if card was removed, False if card not found
        """
        try:
            self.hand.remove(card)
            return True
        except ValueError:
            return False
    
    def get_hand_size(self) -> int:
        """Get the number of cards in the player's hand."""
        return len(self.hand)
    
    def has_cards(self) -> bool:
        """Check if the player has any cards."""
        return len(self.hand) > 0
    
    def get_playable_cards(self, last_played_card: Optional[Card] = None) -> List[Card]:
        """
        Get all cards that can be played based on the current game state.
        
        Args:
            last_played_card: The last card played in the game
            
        Returns:
            List of playable cards
        """
        if not self.hand:
            return []
        
        # For now, all cards in hand are potentially playable
        # Game logic will determine actual playability
        return self.hand.copy()
    
    def get_peak_cards(self) -> List[Card]:
        """Get all Peak cards in the player's hand."""
        return [card for card in self.hand if card.is_peak_card()]
    
    def get_regular_cards(self) -> List[Card]:
        """Get all regular cards in the player's hand."""
        return [card for card in self.hand if not card.is_peak_card()]
    
    def can_finish_game(self) -> bool:
        """
        Check if the player can potentially finish the game.
        
        Returns:
            True if player has cards they can finish on, False otherwise
        """
        if self.is_disqualified or not self.hand:
            return False
        
        # Check if any card in hand can be used to finish
        for card in self.hand:
            if card.can_finish_on():
                return True
        
        return False
    
    def show_hand(self) -> str:
        """
        Get a string representation of the player's hand.
        
        Returns:
            Formatted string showing all cards in hand
        """
        if not self.hand:
            return "No cards"
        
        card_strings = [str(card) for card in self.hand]
        return ", ".join(card_strings)
    
    def disqualify(self) -> None:
        """Disqualify the player from the game."""
        self.is_disqualified = True
    
    def finish_game(self) -> None:
        """Mark the player as having finished the game."""
        self.has_finished = True
    
    def is_active(self) -> bool:
        """
        Check if the player is still active in the game.
        
        Returns:
            True if player is not disqualified and hasn't finished
        """
        return not self.is_disqualified and not self.has_finished
    
    def reset(self) -> None:
        """Reset the player for a new game."""
        self.hand = []
        self.is_disqualified = False
        self.has_finished = False