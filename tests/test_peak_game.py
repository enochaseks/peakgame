"""
Unit tests for the Peak card game.
"""

import unittest
import sys
import os

# Add the parent directory to the Python path so we can import the game modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from card import Card, Deck, CardType
from player import Player
from rules import GameRules
from game import PeakGame


class TestCard(unittest.TestCase):
    """Test cases for the Card class."""
    
    def test_regular_card_creation(self):
        """Test creating a regular card."""
        card = Card(5)
        self.assertEqual(card.value, 5)
        self.assertEqual(card.card_type, CardType.REGULAR)
        self.assertFalse(card.is_peak_card())
    
    def test_peak_card_creation(self):
        """Test creating a Peak card."""
        card = Card(0, CardType.PEAK)
        self.assertEqual(card.value, 0)
        self.assertEqual(card.card_type, CardType.PEAK)
        self.assertTrue(card.is_peak_card())
    
    def test_card_string_representation(self):
        """Test string representation of cards."""
        regular_card = Card(7)
        peak_card = Card(0, CardType.PEAK)
        
        self.assertEqual(str(regular_card), "7")
        self.assertEqual(str(peak_card), "Peak")
    
    def test_can_finish_on_card(self):
        """Test the can_finish_on method."""
        # Cannot finish on cards 1-4
        for value in range(1, 5):
            card = Card(value)
            self.assertFalse(card.can_finish_on())
        
        # Can finish on cards 5-6
        for value in range(5, 7):
            card = Card(value)
            self.assertTrue(card.can_finish_on())
        
        # Can finish on cards 8-10 (condition checked in game logic)
        for value in range(8, 11):
            card = Card(value)
            self.assertTrue(card.can_finish_on())
        
        # Cannot finish on Peak cards
        peak_card = Card(0, CardType.PEAK)
        self.assertFalse(peak_card.can_finish_on())


class TestDeck(unittest.TestCase):
    """Test cases for the Deck class."""
    
    def test_deck_creation(self):
        """Test creating a new deck."""
        deck = Deck()
        # Should have 10 regular cards (1-10) + 10 Peak cards = 20 total
        self.assertEqual(deck.cards_remaining(), 20)
    
    def test_dealing_cards(self):
        """Test dealing cards from the deck."""
        deck = Deck()
        initial_count = deck.cards_remaining()
        
        card = deck.deal_card()
        self.assertIsNotNone(card)
        self.assertEqual(deck.cards_remaining(), initial_count - 1)
    
    def test_dealing_multiple_cards(self):
        """Test dealing multiple cards at once."""
        deck = Deck()
        cards = deck.deal_cards(5)
        
        self.assertEqual(len(cards), 5)
        self.assertEqual(deck.cards_remaining(), 15)
    
    def test_empty_deck(self):
        """Test dealing from an empty deck."""
        deck = Deck()
        # Deal all cards
        while not deck.is_empty():
            deck.deal_card()
        
        self.assertTrue(deck.is_empty())
        self.assertIsNone(deck.deal_card())
        self.assertEqual(len(deck.deal_cards(5)), 0)


class TestPlayer(unittest.TestCase):
    """Test cases for the Player class."""
    
    def test_player_creation(self):
        """Test creating a new player."""
        player = Player("Alice")
        self.assertEqual(player.name, "Alice")
        self.assertEqual(player.get_hand_size(), 0)
        self.assertFalse(player.is_disqualified)
        self.assertFalse(player.has_finished)
        self.assertTrue(player.is_active())
    
    def test_adding_cards(self):
        """Test adding cards to a player's hand."""
        player = Player("Bob")
        card1 = Card(5)
        card2 = Card(0, CardType.PEAK)
        
        player.add_card(card1)
        self.assertEqual(player.get_hand_size(), 1)
        
        player.add_cards([card2])
        self.assertEqual(player.get_hand_size(), 2)
    
    def test_disqualification(self):
        """Test player disqualification when having too many cards."""
        player = Player("Charlie")
        
        # Add 21 cards to trigger disqualification
        for i in range(21):
            card = Card(1)
            player.add_card(card)
        
        self.assertTrue(player.is_disqualified)
        self.assertFalse(player.is_active())
    
    def test_removing_cards(self):
        """Test removing cards from a player's hand."""
        player = Player("Diana")
        card = Card(7)
        
        player.add_card(card)
        self.assertTrue(player.remove_card(card))
        self.assertEqual(player.get_hand_size(), 0)
        
        # Try to remove a card that's not in hand
        self.assertFalse(player.remove_card(Card(8)))


class TestGameRules(unittest.TestCase):
    """Test cases for the GameRules class."""
    
    def test_can_play_card(self):
        """Test the can_play_card rule."""
        # Peak cards can always be played
        peak_card = Card(0, CardType.PEAK)
        self.assertTrue(GameRules.can_play_card(peak_card))
        
        # First card can be any regular card
        first_card = Card(5)
        self.assertTrue(GameRules.can_play_card(first_card, None))
        
        # After a Peak card, any regular card can be played
        regular_card = Card(3)
        self.assertTrue(GameRules.can_play_card(regular_card, peak_card))
    
    def test_can_finish_on_card(self):
        """Test the can_finish_on_card rule."""
        # Cannot finish on cards 1-4
        self.assertFalse(GameRules.can_finish_on_card(Card(1)))
        self.assertFalse(GameRules.can_finish_on_card(Card(4)))
        
        # Can finish on cards 5-6
        self.assertTrue(GameRules.can_finish_on_card(Card(5)))
        self.assertTrue(GameRules.can_finish_on_card(Card(6)))
        
        # Can finish on cards 8-10 only if high card was played
        self.assertFalse(GameRules.can_finish_on_card(Card(8), False))
        self.assertTrue(GameRules.can_finish_on_card(Card(8), True))
        
        # Cannot finish on Peak cards
        peak_card = Card(0, CardType.PEAK)
        self.assertFalse(GameRules.can_finish_on_card(peak_card))
    
    def test_should_disqualify_player(self):
        """Test player disqualification rule."""
        player = Player("Test")
        
        # Add 20 cards - should not be disqualified
        for _ in range(20):
            player.add_card(Card(1))
        self.assertFalse(GameRules.should_disqualify_player(player))
        
        # Add one more card - should be disqualified
        player.add_card(Card(1))
        self.assertTrue(GameRules.should_disqualify_player(player))
    
    def test_peak_card_penalty(self):
        """Test Peak card penalty."""
        self.assertEqual(GameRules.get_peak_card_penalty(), 5)
    
    def test_is_high_value_card(self):
        """Test high value card detection."""
        self.assertFalse(GameRules.is_high_value_card(Card(7)))
        self.assertTrue(GameRules.is_high_value_card(Card(8)))
        self.assertTrue(GameRules.is_high_value_card(Card(9)))
        self.assertTrue(GameRules.is_high_value_card(Card(10)))
        self.assertFalse(GameRules.is_high_value_card(Card(0, CardType.PEAK)))


class TestPeakGame(unittest.TestCase):
    """Test cases for the PeakGame class."""
    
    def test_game_creation(self):
        """Test creating a new game."""
        player_names = ["Alice", "Bob", "Charlie", "Diana"]
        game = PeakGame(player_names)
        
        self.assertEqual(len(game.players), 4)
        self.assertFalse(game.is_game_over())
        self.assertIsNone(game.get_winner())
    
    def test_invalid_player_count(self):
        """Test that game requires exactly 4 players."""
        with self.assertRaises(ValueError):
            PeakGame(["Alice", "Bob"])  # Too few players
        
        with self.assertRaises(ValueError):
            PeakGame(["Alice", "Bob", "Charlie", "Diana", "Eve"])  # Too many players
    
    def test_game_setup(self):
        """Test game setup."""
        player_names = ["Alice", "Bob", "Charlie", "Diana"]
        game = PeakGame(player_names)
        game.setup_game()
        
        # Each player should have 7 cards
        for player in game.players:
            self.assertEqual(player.get_hand_size(), 7)
    
    def test_current_player(self):
        """Test current player tracking."""
        player_names = ["Alice", "Bob", "Charlie", "Diana"]
        game = PeakGame(player_names)
        
        # First player should be Alice
        self.assertEqual(game.get_current_player().name, "Alice")


if __name__ == '__main__':
    unittest.main()