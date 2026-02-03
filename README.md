# Solitaire - Klondike ♠♥♣♦

A beautiful, fully functional Klondike Solitaire card game built with HTML, CSS, and JavaScript.

## Features

- **Drag-and-drop card movement** - Intuitive card dragging with visual feedback
- **Complete Klondike rules** - Standard Solitaire gameplay mechanics
- **Auto-complete** - One-click finish when all cards are revealed
- **Win detection** - Celebratory modal when you win
- **Move counter and timer** - Track your performance
- **Responsive design** - Works on desktop and mobile devices
- **Clean, attractive UI** - Modern gradient design with smooth animations

## How to Play

### Objective
Move all cards to the four foundation piles at the top right, building up by suit from Ace to King.

### Rules

1. **Stock & Waste**
   - Click the stock pile (top left) to draw cards
   - Only the top card of the waste pile is playable
   - When stock is empty, click it to reset from waste

2. **Tableau (7 columns)**
   - Build down in alternating colors (red on black, black on red)
   - Move face-up cards in sequence
   - Empty columns can only be filled with a King
   - Click face-down cards to reveal them

3. **Foundations (4 piles)**
   - Build up by suit from Ace to King
   - Only one card at a time can be moved to foundations

4. **Auto-Complete**
   - When all tableau cards are face up and stock is empty
   - Click "Auto Complete" to finish the game automatically

## Tech Stack

- Pure HTML5, CSS3, and JavaScript
- No external dependencies
- Responsive design with CSS Flexbox
- Custom drag-and-drop implementation

## Play Online

The game is deployed on GitHub Pages. Visit the live version to play!

## Local Development

Simply open `index.html` in any modern web browser. No server or build process required.

```bash
# Clone the repository
git clone <your-repo-url>

# Open in browser
open index.html
```

## Features Breakdown

### Card Rendering
- SVG-style card symbols (♠♥♣♦)
- Corner ranks with suit symbols
- Face-down card design with pattern
- Color coding (red for hearts/diamonds, black for clubs/spades)

### Game Mechanics
- Complete 52-card deck shuffling
- Standard Klondike dealing pattern
- Move validation for all pile types
- Win condition detection

### UI/UX
- Smooth hover animations
- Drag visual feedback
- Modal for win celebration
- Responsive breakpoints for mobile
- Timer and move counter

Enjoy playing! 🎴
