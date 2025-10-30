"""
Card classes and deck management for the Peak card game.
"""

import random
from typing import List, Optional
from enum import Enum


class CardType(Enum):
    """Enumeration for different card types in the game."""
    REGULAR = "regular"
    PEAK = "peak"


class Card:
    """Represents a single card in the Peak card game."""
    
    def __init__(self, value: int, card_type: CardType = CardType.REGULAR):
        """
        Initialize a card.
        
        Args:
            value: The numerical value of the card (1-10 for regular cards)
            card_type: The type of card (REGULAR or PEAK)
        """
        self.value = value
        self.card_type = card_type
    
    def __str__(self) -> str:
        """String representation of the card."""
        if self.card_type == CardType.PEAK:
            return "Peak"
        return str(self.value)
    
    def __repr__(self) -> str:
        """Detailed string representation of the card."""
        return f"Card({self.value}, {self.card_type.value})"
    
    def __eq__(self, other) -> bool:
        """Check if two cards are equal."""
        if not isinstance(other, Card):
            return False
        return self.value == other.value and self.card_type == other.card_type
    
    def is_peak_card(self) -> bool:
        """Check if this is a Peak card."""
        return self.card_type == CardType.PEAK
    
    def can_finish_on(self) -> bool:
        """
        Check if a player can finish the game on this card.
        
        Returns:
            True if player can finish on this card, False otherwise
        """
        if self.is_peak_card():
            return False
        
        # Cannot finish on cards 1-4
        if 1 <= self.value <= 4:
            return False
        
        # Can finish on cards 5-6
        if 5 <= self.value <= 6:
            return True
        
        # Cards 8-10 can be finished on only if someone else drops an 8-10
        # This condition will be checked in the game logic
        if 8 <= self.value <= 10:
            return True
        
        return False


class Deck:
    """Manages the deck of cards for the Peak card game."""
    
    def __init__(self):
        """Initialize a new deck with all cards."""
        self.cards: List[Card] = []
        self._create_deck()
        self.shuffle()
    
    def _create_deck(self) -> None:
        """Create a complete deck of cards."""
        self.cards = []
        
        # Add regular cards (1-10)
        for value in range(1, 11):
            self.cards.append(Card(value, CardType.REGULAR))
        
        # Add 10 Peak cards
        for _ in range(10):
            self.cards.append(Card(0, CardType.PEAK))  # Peak cards have value 0
    
    def shuffle(self) -> None:
        """Shuffle the deck."""
        random.shuffle(self.cards)
    
    def deal_card(self) -> Optional[Card]:
        """
        Deal a single card from the top of the deck.
        
        Returns:
            The card from the top of the deck, or None if deck is empty
        """
        if self.cards:
            return self.cards.pop()
        return None
    
    def deal_cards(self, count: int) -> List[Card]:
        """
        Deal multiple cards from the deck.
        
        Args:
            count: Number of cards to deal
            
        Returns:
            List of cards dealt
        """
        dealt_cards = []
        for _ in range(count):
            card = self.deal_card()
            if card:
                dealt_cards.append(card)
            else:
                break
        return dealt_cards
    
    def cards_remaining(self) -> int:
        """Get the number of cards remaining in the deck."""
        return len(self.cards)
    
    def is_empty(self) -> bool:
        """Check if the deck is empty."""
        return len(self.cards) == 0
    
    def reset(self) -> None:
        """Reset the deck to contain all cards and shuffle."""
        self._create_deck()
        self.shuffle()