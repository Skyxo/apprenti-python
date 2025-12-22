const STORAGE_KEY_DECKS = 'toefl_decks';
const STORAGE_KEY_CARDS = 'toefl_cards';

export const deckManager = {
    getDecks: () => {
        const data = localStorage.getItem(STORAGE_KEY_DECKS);
        return data ? JSON.parse(data) : [];
    },

    createDeck: (name) => {
        const decks = deckManager.getDecks();
        const newDeck = {
            id: crypto.randomUUID(),
            name,
            createdAt: new Date().toISOString(),
        };
        decks.push(newDeck);
        localStorage.setItem(STORAGE_KEY_DECKS, JSON.stringify(decks));
        return newDeck;
    },

    deleteDeck: (deckId) => {
        const decks = deckManager.getDecks().filter(d => d.id !== deckId);
        localStorage.setItem(STORAGE_KEY_DECKS, JSON.stringify(decks));

        // Also delete cards
        const cards = deckManager.getCards().filter(c => c.deckId !== deckId);
        localStorage.setItem(STORAGE_KEY_CARDS, JSON.stringify(cards));
    },

    getCards: (deckId = null) => {
        const data = localStorage.getItem(STORAGE_KEY_CARDS);
        const allCards = data ? JSON.parse(data) : [];
        if (deckId) {
            return allCards.filter(c => c.deckId === deckId);
        }
        return allCards;
    },

    addCards: (newCards) => {
        const allCards = deckManager.getCards();
        const uniqueNewCards = newCards.filter(nc => !allCards.some(ec => ec.term === nc.term && ec.type === nc.type && ec.deckId === nc.deckId));
        // ^ Simple duplicate check. 

        const updatedCards = [...allCards, ...newCards];
        // ^ Actually, let's just push everything. If they import duplicates, that's on them, or maybe they want to practice twice.

        localStorage.setItem(STORAGE_KEY_CARDS, JSON.stringify(updatedCards));
    },

    updateCard: (updatedCard) => {
        const allCards = deckManager.getCards();
        const index = allCards.findIndex(c => c.id === updatedCard.id);
        if (index !== -1) {
            allCards[index] = updatedCard;
            localStorage.setItem(STORAGE_KEY_CARDS, JSON.stringify(allCards));
        }
    },

    // Helper to get stats
    getDeckStats: (deckId) => {
        const cards = deckManager.getCards(deckId);
        const total = cards.length;
        const due = cards.filter(c => new Date(c.dueDate) <= new Date()).length;
        const learning = cards.filter(c => c.state === 'learning').length;
        const review = cards.filter(c => c.state === 'review').length;
        const newCards = cards.filter(c => c.state === 'new').length;

        return { total, due, learning, review, new: newCards };
    }
};
