// Solitaire Game Logic
class Solitaire {
    constructor() {
        this.suits = ['hearts', 'diamonds', 'clubs', 'spades'];
        this.suitSymbols = {
            hearts: '♥',
            diamonds: '♦',
            clubs: '♣',
            spades: '♠'
        };
        this.ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        this.deck = [];
        this.piles = {
            stock: [],
            waste: [],
            foundations: [[], [], [], []],
            tableau: [[], [], [], [], [], [], []]
        };
        this.moves = 0;
        this.timer = 0;
        this.timerInterval = null;
        this.gameStarted = false;
        this.draggedCards = null;
        this.dragSource = null;
        this.dragStartPos = { x: 0, y: 0 };

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.newGame();
    }

    createDeck() {
        this.deck = [];
        for (let suit of this.suits) {
            for (let i = 0; i < this.ranks.length; i++) {
                this.deck.push({
                    suit: suit,
                    rank: this.ranks[i],
                    value: i + 1,
                    faceUp: false
                });
            }
        }
    }

    shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    dealCards() {
        // Deal to tableau
        let cardIndex = 0;
        for (let i = 0; i < 7; i++) {
            for (let j = i; j < 7; j++) {
                const card = this.deck[cardIndex++];
                if (j === i) {
                    card.faceUp = true;
                }
                this.piles.tableau[j].push(card);
            }
        }

        // Remaining cards go to stock
        while (cardIndex < this.deck.length) {
            this.piles.stock.push(this.deck[cardIndex++]);
        }
    }

    newGame() {
        this.stopTimer();
        this.moves = 0;
        this.timer = 0;
        this.gameStarted = false;
        this.piles = {
            stock: [],
            waste: [],
            foundations: [[], [], [], []],
            tableau: [[], [], [], [], [], [], []]
        };

        this.createDeck();
        this.shuffleDeck();
        this.dealCards();
        this.render();
        this.updateUI();
    }

    startTimer() {
        if (!this.gameStarted) {
            this.gameStarted = true;
            this.timerInterval = setInterval(() => {
                this.timer++;
                this.updateTimerDisplay();
            }, 1000);
        }
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.timer / 60).toString().padStart(2, '0');
        const seconds = (this.timer % 60).toString().padStart(2, '0');
        document.getElementById('timer').textContent = `${minutes}:${seconds}`;
    }

    updateUI() {
        document.getElementById('moves').textContent = this.moves;
        this.updateTimerDisplay();
        this.updateAutoCompleteButton();
    }

    setupEventListeners() {
        // Stock click
        document.getElementById('stock').addEventListener('click', () => this.drawFromStock());

        // New game button
        document.getElementById('new-game-btn').addEventListener('click', () => this.newGame());

        // Auto complete button
        document.getElementById('auto-complete-btn').addEventListener('click', () => this.autoComplete());

        // Play again button
        document.getElementById('play-again-btn').addEventListener('click', () => {
            document.getElementById('win-modal').classList.add('hidden');
            this.newGame();
        });

        // Drag and drop setup
        this.setupDragAndDrop();
    }

    setupDragAndDrop() {
        let isDragging = false;
        let dragData = null;
        let startX, startY;
        let highlightedPile = null;

        document.addEventListener('mousedown', (e) => {
            const card = e.target.closest('.card');
            if (!card || card.classList.contains('face-down')) return;

            const pileId = card.closest('.pile')?.id;
            if (!pileId) return;

            const [pileType, pileIndex] = this.parsePileId(pileId);
            if (pileType === 'stock') return;

            const cardIndex = parseInt(card.dataset.index);
            const pile = this.getPile(pileType, pileIndex);

            // Only allow dragging face-up cards
            if (!pile[cardIndex].faceUp) return;

            // For tableau, can drag multiple cards
            if (pileType === 'tableau') {
                dragData = {
                    cards: pile.slice(cardIndex),
                    source: { type: pileType, index: pileIndex, cardIndex: cardIndex }
                };
            } else {
                dragData = {
                    cards: [pile[cardIndex]],
                    source: { type: pileType, index: pileIndex, cardIndex: cardIndex }
                };
            }

            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;

            card.classList.add('dragging');
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging || !dragData) return;

            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            dragData.cards.forEach((card, i) => {
                const cardElement = document.querySelector(`.card[data-index="${dragData.source.cardIndex + i}"][data-pile-type="${dragData.source.type}"][data-pile-index="${dragData.source.index}"]`);
                if (cardElement) {
                    cardElement.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(1.05)`;
                }
            });

            // Highlight valid drop target
            const dropTarget = this.findDropTarget(e.clientX, e.clientY);
            this.highlightDropTarget(dropTarget, dragData, highlightedPile);
            highlightedPile = dropTarget;
        });

        document.addEventListener('mouseup', (e) => {
            if (!isDragging || !dragData) return;

            // Find drop target BEFORE removing drag styling
            const dropTarget = this.findDropTarget(e.clientX, e.clientY);

            isDragging = false;

            // Clear transform styles
            document.querySelectorAll('.card.dragging').forEach(card => {
                card.classList.remove('dragging');
                card.style.transform = '';
            });

            // Remove highlight
            if (highlightedPile) {
                const pileElement = document.getElementById(`${highlightedPile.type === 'foundations' ? 'foundation-' + highlightedPile.index : highlightedPile.type === 'tableau' ? 'tableau-' + highlightedPile.index : highlightedPile.type}`);
                if (pileElement) pileElement.classList.remove('highlight');
            }

            if (dropTarget) {
                this.tryMoveCards(dragData, dropTarget);
            }

            dragData = null;
            highlightedPile = null;
        });
    }

    highlightDropTarget(dropTarget, dragData, oldHighlightedPile) {
        // Remove old highlight
        if (oldHighlightedPile) {
            const oldElement = document.getElementById(`${oldHighlightedPile.type === 'foundations' ? 'foundation-' + oldHighlightedPile.index : oldHighlightedPile.type === 'tableau' ? 'tableau-' + oldHighlightedPile.index : oldHighlightedPile.type}`);
            if (oldElement) oldElement.classList.remove('highlight');
        }

        // Add new highlight if valid
        if (dropTarget && this.isValidMove(dragData.cards, dropTarget)) {
            const element = document.getElementById(`${dropTarget.type === 'foundations' ? 'foundation-' + dropTarget.index : dropTarget.type === 'tableau' ? 'tableau-' + dropTarget.index : dropTarget.type}`);
            if (element) element.classList.add('highlight');
        }
    }

    findDropTarget(x, y) {
        // Disable pointer events on dragging cards temporarily to find element below
        const draggingCards = document.querySelectorAll('.card.dragging');
        draggingCards.forEach(card => card.style.pointerEvents = 'none');

        const element = document.elementFromPoint(x, y);

        // Find the pile element
        let pile = element?.closest('.pile');

        // If not directly over a pile, check if we're over a card and get its parent pile
        if (!pile && element?.classList.contains('card')) {
            pile = element.closest('.pile');
        }

        // Restore pointer events
        draggingCards.forEach(card => card.style.pointerEvents = '');

        if (!pile) return null;

        const [pileType, pileIndex] = this.parsePileId(pile.id);
        return { type: pileType, index: pileIndex };
    }

    parsePileId(id) {
        if (id === 'stock' || id === 'waste') {
            return [id, null];
        }
        if (id.startsWith('foundation-')) {
            return ['foundations', parseInt(id.split('-')[1])];
        }
        if (id.startsWith('tableau-')) {
            return ['tableau', parseInt(id.split('-')[1])];
        }
        return [null, null];
    }

    getPile(type, index) {
        if (type === 'stock') return this.piles.stock;
        if (type === 'waste') return this.piles.waste;
        if (type === 'foundations') return this.piles.foundations[index];
        if (type === 'tableau') return this.piles.tableau[index];
        return [];
    }

    tryMoveCards(dragData, target) {
        if (target.type === 'stock') return;

        const { cards, source } = dragData;
        const targetPile = this.getPile(target.type, target.index);

        // Check if move is valid
        if (this.isValidMove(cards, target)) {
            this.startTimer();

            // Remove cards from source
            const sourcePile = this.getPile(source.type, source.index);
            sourcePile.splice(source.cardIndex, cards.length);

            // Flip the new top card in tableau if needed
            if (source.type === 'tableau' && sourcePile.length > 0) {
                sourcePile[sourcePile.length - 1].faceUp = true;
            }

            // Add cards to target
            targetPile.push(...cards);

            this.moves++;
            this.updateUI();
            this.render();

            // Check for win
            if (this.checkWin()) {
                this.showWinModal();
            }
        }
    }

    isValidMove(cards, target) {
        const card = cards[0];

        // Moving to foundation
        if (target.type === 'foundations') {
            // Can only move single card to foundation
            if (cards.length > 1) return false;

            const foundation = this.piles.foundations[target.index];
            if (foundation.length === 0) {
                // Must be Ace
                return card.rank === 'A';
            } else {
                const topCard = foundation[foundation.length - 1];
                return card.suit === topCard.suit && card.value === topCard.value + 1;
            }
        }

        // Moving to tableau
        if (target.type === 'tableau') {
            const tableau = this.piles.tableau[target.index];
            if (tableau.length === 0) {
                // Must be King
                return card.rank === 'K';
            } else {
                const topCard = tableau[tableau.length - 1];
                // Must be opposite color and one rank lower
                const oppositeColor = this.isOppositeColor(card, topCard);
                return oppositeColor && card.value === topCard.value - 1;
            }
        }

        return false;
    }

    isOppositeColor(card1, card2) {
        const isRed = (card) => card.suit === 'hearts' || card.suit === 'diamonds';
        return isRed(card1) !== isRed(card2);
    }

    drawFromStock() {
        this.startTimer();

        if (this.piles.stock.length > 0) {
            // Draw from stock to waste
            const card = this.piles.stock.pop();
            card.faceUp = true;
            this.piles.waste.push(card);
        } else {
            // Reset stock from waste
            while (this.piles.waste.length > 0) {
                const card = this.piles.waste.pop();
                card.faceUp = false;
                this.piles.stock.push(card);
            }
        }

        this.moves++;
        this.updateUI();
        this.render();
    }

    canAutoComplete() {
        // Check if all tableau cards are face up
        for (let i = 0; i < 7; i++) {
            for (let card of this.piles.tableau[i]) {
                if (!card.faceUp) return false;
            }
        }

        // Check if stock is empty
        if (this.piles.stock.length > 0) return false;

        // Check if there are any possible moves from tableau to foundations
        return this.hasPossibleFoundationMoves();
    }

    hasPossibleFoundationMoves() {
        for (let tableau of this.piles.tableau) {
            if (tableau.length === 0) continue;

            const card = tableau[tableau.length - 1];
            for (let i = 0; i < 4; i++) {
                const foundation = this.piles.foundations[i];
                const cards = [card];
                const target = { type: 'foundations', index: i };
                if (this.isValidMove(cards, target)) {
                    return true;
                }
            }
        }
        return false;
    }

    updateAutoCompleteButton() {
        const btn = document.getElementById('auto-complete-btn');
        btn.disabled = !this.canAutoComplete();
    }

    async autoComplete() {
        while (this.canAutoComplete() && !this.checkWin()) {
            let moved = false;

            // Try to move cards from tableau to foundations
            for (let i = 0; i < 7; i++) {
                const tableau = this.piles.tableau[i];
                if (tableau.length === 0) continue;

                const card = tableau[tableau.length - 1];
                for (let j = 0; j < 4; j++) {
                    const foundation = this.piles.foundations[j];
                    const cards = [card];
                    const target = { type: 'foundations', index: j };

                    if (this.isValidMove(cards, target)) {
                        tableau.pop();
                        foundation.push(card);
                        this.moves++;
                        moved = true;
                        break;
                    }
                }
                if (moved) break;
            }

            if (moved) {
                this.updateUI();
                this.render();
                await new Promise(resolve => setTimeout(resolve, 100));
            } else {
                break;
            }
        }

        if (this.checkWin()) {
            this.showWinModal();
        }
    }

    checkWin() {
        // Win when all foundations have 13 cards
        return this.piles.foundations.every(foundation => foundation.length === 13);
    }

    showWinModal() {
        this.stopTimer();
        document.getElementById('win-moves').textContent = this.moves;
        document.getElementById('win-time').textContent = document.getElementById('timer').textContent;
        document.getElementById('win-modal').classList.remove('hidden');
    }

    render() {
        this.renderStock();
        this.renderWaste();
        this.renderFoundations();
        this.renderTableau();
    }

    renderStock() {
        const stockElement = document.getElementById('stock');
        stockElement.innerHTML = '';

        if (this.piles.stock.length > 0) {
            const card = this.createCardElement(null, 0, 'stock', null, false);
            stockElement.appendChild(card);
        }
    }

    renderWaste() {
        const wasteElement = document.getElementById('waste');
        wasteElement.innerHTML = '';

        if (this.piles.waste.length > 0) {
            const card = this.piles.waste[this.piles.waste.length - 1];
            const cardElement = this.createCardElement(card, this.piles.waste.length - 1, 'waste', null, true);
            wasteElement.appendChild(cardElement);
        }
    }

    renderFoundations() {
        for (let i = 0; i < 4; i++) {
            const foundationElement = document.getElementById(`foundation-${i}`);
            foundationElement.innerHTML = '';

            const foundation = this.piles.foundations[i];
            if (foundation.length > 0) {
                const card = foundation[foundation.length - 1];
                const cardElement = this.createCardElement(card, foundation.length - 1, 'foundations', i, true);
                cardElement.style.top = '5px';
                cardElement.style.left = '5px';
                foundationElement.appendChild(cardElement);
            }
        }
    }

    renderTableau() {
        for (let i = 0; i < 7; i++) {
            const tableauElement = document.getElementById(`tableau-${i}`);
            tableauElement.innerHTML = '';

            const tableau = this.piles.tableau[i];
            tableau.forEach((card, index) => {
                const cardElement = this.createCardElement(card, index, 'tableau', i, card.faceUp);
                cardElement.style.top = `${index * 20}px`;
                cardElement.style.left = '5px';
                tableauElement.appendChild(cardElement);
            });
        }
    }

    createCardElement(card, index, pileType, pileIndex, faceUp) {
        const cardElement = document.createElement('div');
        cardElement.className = `card ${card ? card.suit : ''} ${faceUp ? '' : 'face-down'}`;
        cardElement.dataset.index = index;
        cardElement.dataset.pileType = pileType;
        cardElement.dataset.pileIndex = pileIndex;

        if (card && faceUp) {
            const symbol = this.suitSymbols[card.suit];

            cardElement.innerHTML = `
                <div class="card-corner top-left">
                    <span class="card-rank">${card.rank}</span>
                    <span class="card-suit">${symbol}</span>
                </div>
                <div class="card-center">${symbol}</div>
                <div class="card-corner bottom-right">
                    <span class="card-rank">${card.rank}</span>
                    <span class="card-suit">${symbol}</span>
                </div>
            `;
        }

        return cardElement;
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Solitaire();
});
