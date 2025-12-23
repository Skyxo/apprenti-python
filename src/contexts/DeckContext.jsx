import React, { createContext, useContext, useState, useEffect } from 'react';
import { deckManager } from '../utils/deckManager';
import { parseAndGenerateCards } from '../utils/csvParser';

// Import raw CSVs
import module1Csv from '../assets/vocabulary/module1.csv?raw';
import module2Csv from '../assets/vocabulary/module2.csv?raw';
import module3Csv from '../assets/vocabulary/module3.csv?raw';

const DeckContext = createContext();

export const useDecks = () => {
    const context = useContext(DeckContext);
    if (!context) {
        throw new Error('useDecks must be used within a DeckProvider');
    }
    return context;
};

export const DeckProvider = ({ children }) => {
    const [decks, setDecks] = useState([]);
    const [loading, setLoading] = useState(true);

    const refreshDecks = () => {
        setLoading(true);
        try {
            const list = deckManager.getDecks();
            const decksWithStats = list.map(d => ({
                ...d,
                stats: deckManager.getDeckStats(d.id)
            }));
            setDecks(decksWithStats);
        } catch (error) {
            console.error("Failed to load decks:", error);
        } finally {
            setLoading(false);
        }
    };

    // Auto-seed Initial Decks - Prevent double execution
    const seedingRef = React.useRef(false);

    useEffect(() => {
        const seedDecks = async () => {
            if (seedingRef.current) return;
            seedingRef.current = true;

            const currentDecks = deckManager.getDecks();
            const modules = [
                { name: 'Module 1', content: module1Csv },
                { name: 'Module 2', content: module2Csv },
                { name: 'Module 3', content: module3Csv },
            ];

            let madeChanges = false;

            for (const mod of modules) {
                // FORCE RE-SEED FIX: Check if deck exists, if so DELETE it to ensure fresh parse with new logic
                const existingDeck = deckManager.getDecks().find(d => d.name === mod.name);
                if (existingDeck) {
                    // Check if it has old card count (approx 3x expected) or just force update
                    // Let's just force update for this session to fix the user's issue effectively
                    console.log(`Forcing re-seed for: ${mod.name}`);
                    deckManager.deleteDeck(existingDeck.id);
                }

                // Now recreate
                console.log(`Seeding deck: ${mod.name}`);
                const newDeck = deckManager.createDeck(mod.name);
                try {
                    const cards = await parseAndGenerateCards(mod.content, newDeck.id);
                    deckManager.addCards(cards);
                    madeChanges = true;
                } catch (e) {
                    console.error(`Failed to seed ${mod.name}`, e);
                }
            }

            if (madeChanges) {
                refreshDecks();
            } else {
                refreshDecks();
            }
        };

        seedDecks();
    }, []);

    const createDeck = (name) => {
        const newDeck = deckManager.createDeck(name);
        refreshDecks();
        return newDeck;
    };

    const deleteDeck = (id) => {
        deckManager.deleteDeck(id);
        refreshDecks();
    };

    const addCardsToDeck = (cards) => {
        deckManager.addCards(cards);
        refreshDecks();
    };

    const getDeck = (id) => decks.find(d => d.id === id);

    return (
        <DeckContext.Provider value={{
            decks,
            loading,
            refreshDecks,
            createDeck,
            deleteDeck,
            addCardsToDeck,
            getDeck
        }}>
            {children}
        </DeckContext.Provider>
    );
};
