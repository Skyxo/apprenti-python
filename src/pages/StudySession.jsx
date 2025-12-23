import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useDecks } from '../contexts/DeckContext';
import { deckManager } from '../utils/deckManager';
import { scheduleCard, isDue, RATE_AGAIN, RATE_HARD, RATE_GOOD, RATE_EASY } from '../utils/scheduler';
import Flashcard from '../components/Flashcard';
import { ArrowLeft, Repeat, Trophy } from 'lucide-react';

export default function StudySession() {
    const { deckId } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const mode = searchParams.get('mode') || 'mixed';
    const { refreshDecks } = useDecks();

    const [queue, setQueue] = useState([]);
    const [currentCard, setCurrentCard] = useState(null);
    const [loading, setLoading] = useState(true);

    // Stats State
    const [stats, setStats] = useState({
        completions: 0,
        mastery: 0,
        correct: 0,
        wrong: 0
    });

    // Forced Refresh on Mount (To fix old data structure)
    useEffect(() => {
        // Simple heuristic: if we load a card and it doesn't have 'variations' but we expect it to (new format),
        // we might want to trigger a re-seed. 
        // For now, let's just rely on user potentially deleting deck if needed, 
        // OR we can force clear if we detect old structure.
    }, []);

    // Helper to calculate mastery %
    const calculateMastery = (cards) => {
        if (!cards || cards.length === 0) return 0;
        const mastered = cards.filter(c => c.state === 'review' && c.interval > 60).length;
        return Math.round((mastered / cards.length) * 100);
    };

    // Helper: Select variation for a card based on mode
    const getCardWithVariation = (card, mode) => {
        if (!card.variations) {
            // BACKWARD COMPATIBILITY: If card is old format (pre-fix), just return it as is
            return card;
        }

        let selectedType = mode;

        if (mode === 'mixed') {
            const availableTypes = Object.keys(card.variations);
            if (availableTypes.length > 0) {
                selectedType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
            }
        }

        const variation = card.variations[selectedType];

        // If exact requested variation missing, fallback to any available
        if (!variation) {
            const anyType = Object.keys(card.variations)[0];
            if (!anyType) return card; // Should not happen if filtered correctly
            return { ...card, ...card.variations[anyType] };
        }

        return { ...card, ...variation };
    };

    // Load Cards Function
    const loadCards = useCallback((forceAll = false) => {
        let cards = deckManager.getCards(deckId);

        // Update Mastery
        const mastery = calculateMastery(cards);

        // Filter out cards that don't support the current mode (if specific mode selected)
        if (mode !== 'mixed') {
            cards = cards.filter(c => {
                // Support new structure (variations) OR old structure (type)
                if (c.variations) return !!c.variations[mode];
                return c.type === mode;
            });
        }

        let dueCards = forceAll ? cards : cards.filter(isDue);

        if (dueCards.length === 0 && forceAll) {
            dueCards = cards;
        }

        if (dueCards.length === 0) return [];

        // Shuffle
        for (let i = dueCards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [dueCards[i], dueCards[j]] = [dueCards[j], dueCards[i]];
        }

        return { cards: dueCards, mastery };
    }, [deckId, mode]);

    // Initial Load
    useEffect(() => {
        const result = loadCards(false);
        const cards = result ? result.cards : []; // Safety check
        const mastery = result ? result.mastery : 0;

        if (cards.length === 0) {
            const forceResult = loadCards(true);
            const forceCards = forceResult ? forceResult.cards : [];
            setQueue(forceCards);
            setStats(s => ({ ...s, mastery: forceResult ? forceResult.mastery : 0 }));
        } else {
            setQueue(cards);
            setStats(s => ({ ...s, mastery }));
        }

        setLoading(false);
    }, [loadCards]);

    // Queue Management
    useEffect(() => {
        if (queue.length > 0) {
            // Apply Variation Projection here!
            const rawCard = queue[0];
            const displayCard = getCardWithVariation(rawCard, mode);
            setCurrentCard(displayCard);
        } else {
            // INFINITE LOOP LOGIC
            if (!loading) {
                setStats(s => ({ ...s, completions: s.completions + 1 }));

                const result = loadCards(true);
                if (result && result.cards.length > 0) {
                    setQueue(result.cards);
                    setStats(s => ({ ...s, mastery: result.mastery }));
                }
            }
        }
    }, [queue, loading, loadCards, mode]); // Added mode dependency to re-project if mode changes? (Though param doesn't change usually)

    const handleRate = (rating) => {
        if (!currentCard) return;

        // NOTE: 'currentCard' is the projected version (with question/answer), 
        // but 'queue[0]' is the REAL raw card we need to update in DB.
        const realCard = queue[0];

        // 1. Calculate new state
        const updates = scheduleCard(realCard, rating);
        const updatedCard = { ...realCard, ...updates };

        // 2. Persist
        deckManager.updateCard(updatedCard);

        // 3. Update stats
        if (rating === RATE_AGAIN) {
            setStats(s => ({ ...s, wrong: s.wrong + 1 }));
        } else {
            setStats(s => ({ ...s, correct: s.correct + 1 }));
        }

        // 4. Manage Queue
        setQueue(prev => {
            let newQueue = [...prev];
            newQueue.shift(); // Remove current

            // Spaced Repetition Session Logic
            if (updates.interval < 20) {
                const insertImg = rating === RATE_AGAIN ? 3 : 10;
                const index = Math.min(newQueue.length, insertImg);
                newQueue.splice(index, 0, updatedCard);
            }

            return newQueue;
        });
    };

    const getModeLabel = () => {
        switch (mode) {
            case 'cloze': return 'Cloze Mode';
            case 'translation': return 'French → English';
            case 'definition': return 'Def → English';
            default: return 'Mixed Mode';
        }
    };

    if (loading) return <div className="p-10 text-center text-slate-500">Loading your session...</div>;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <header className="px-4 py-3 bg-white shadow-sm flex items-center justify-between z-10">
                <button
                    onClick={() => navigate('/')}
                    className="p-2 -ml-2 text-slate-400 hover:text-slate-900 transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>

                <div className="flex flex-col items-center">
                    <span className="font-bold text-slate-700">Study Session</span>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <span>{getModeLabel()}</span>
                        <span className="text-slate-300">•</span>
                        <span className="flex items-center gap-1 text-amber-500">
                            <Trophy size={10} /> {stats.mastery}%
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {stats.completions > 0 && (
                        <div className="flex items-center gap-1 bg-green-50 text-green-600 px-2 py-1 rounded-full text-xs font-bold">
                            <Repeat size={12} />
                            <span>{stats.completions}</span>
                        </div>
                    )}
                    <span className="text-xs font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full">
                        {queue.length}
                    </span>
                </div>
            </header>

            <main className="flex-1 flex flex-col p-4 justify-center relative">
                {currentCard && (
                    <Flashcard
                        card={currentCard}
                        onRate={handleRate}
                    />
                )}
            </main>
        </div>
    );
}
