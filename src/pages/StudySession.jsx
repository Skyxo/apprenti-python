import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useDecks } from '../contexts/DeckContext';
import { deckManager } from '../utils/deckManager'; // Still need this for direct card updates or move to context?
// Actually context should handle "updateCard" to be cleaner, but for now direct is fine for performance.
import { scheduleCard, isDue, RATE_AGAIN, RATE_HARD, RATE_GOOD, RATE_EASY } from '../utils/scheduler';
import Flashcard from '../components/Flashcard';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

export default function StudySession() {
    const { deckId } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const mode = searchParams.get('mode') || 'mixed';

    const { getDeck } = useDecks(); // Used just for deck name if needed, but we mostly need cards

    const [queue, setQueue] = useState([]);
    const [currentCard, setCurrentCard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sessionStats, setSessionStats] = useState({ correct: 0, wrong: 0 });

    useEffect(() => {
        // We load cards directly from manager to ensure fresh state, 
        // or we could add 'getCards' to context. 
        // For a cram app, fetching fresh from localStorage is safer.
        const cards = deckManager.getCards(deckId);
        let dueCards = cards.filter(isDue);

        // 1. FILTER BY MODE
        if (mode === 'cloze') {
            dueCards = dueCards.filter(c => c.type === 'cloze');
        } else if (mode === 'translation') {
            dueCards = dueCards.filter(c => c.type === 'translation');
        } else if (mode === 'definition') {
            dueCards = dueCards.filter(c => c.type === 'definition');
        }

        // 2. SHUFFLE (Randomize Order)
        // Fisher-Yates Shuffle
        for (let i = dueCards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [dueCards[i], dueCards[j]] = [dueCards[j], dueCards[i]];
        }

        setQueue(dueCards);
        setLoading(false);
    }, [deckId, mode]);

    useEffect(() => {
        if (queue.length > 0) {
            setCurrentCard(queue[0]);
        } else {
            setCurrentCard(null);
        }
    }, [queue]);

    const handleRate = (rating) => {
        if (!currentCard) return;

        // 1. Calculate new state
        const updates = scheduleCard(currentCard, rating);
        const updatedCard = { ...currentCard, ...updates };

        // 2. Persist
        deckManager.updateCard(updatedCard);

        // 3. Update stats
        if (rating === RATE_AGAIN) {
            setSessionStats(s => ({ ...s, wrong: s.wrong + 1 }));
        } else {
            setSessionStats(s => ({ ...s, correct: s.correct + 1 }));
        }

        // 4. Manage Queue
        let newQueue = [...queue];
        newQueue.shift(); // Remove current

        if (updates.interval < 20) {
            // Re-insert into queue. 
            const insertImg = rating === RATE_AGAIN ? 3 : 10;
            const index = Math.min(newQueue.length, insertImg);
            newQueue.splice(index, 0, updatedCard);
        }

        setQueue(newQueue);
    };

    const getNextIntervals = () => {
        if (!currentCard) return {};
        return {
            [RATE_AGAIN]: scheduleCard(currentCard, RATE_AGAIN).interval,
            [RATE_HARD]: scheduleCard(currentCard, RATE_HARD).interval,
            [RATE_GOOD]: scheduleCard(currentCard, RATE_GOOD).interval,
            [RATE_EASY]: scheduleCard(currentCard, RATE_EASY).interval,
        };
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

    if (!currentCard) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-50 p-6 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle className="text-green-600 w-10 h-10" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Session Complete!</h1>
                <p className="text-slate-500 mb-8 max-w-xs mx-auto">You've crunched through all your due cards in {getModeLabel()}. Great job!</p>

                <div className="grid grid-cols-2 gap-4 w-full max-w-xs mb-8">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                        <div className="text-3xl font-bold text-green-500">{sessionStats.correct}</div>
                        <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Mastered</div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                        <div className="text-3xl font-bold text-amber-500">{sessionStats.wrong}</div>
                        <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Learning</div>
                    </div>
                </div>

                <div className="space-y-3 w-full max-w-xs">
                    <button
                        onClick={() => navigate('/')}
                        className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold shadow-lg active:scale-95 transition-all"
                    >
                        Return to Decks
                    </button>
                    {/* Retry button to start same mode again? Maybe later */}
                </div>
            </div>
        );
    }

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
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider disabled-text">
                        {getModeLabel()}
                    </span>
                </div>
                <span className="text-xs font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full">
                    {queue.length}
                </span>
            </header>

            <main className="flex-1 flex flex-col p-4 justify-center">
                <Flashcard
                    card={currentCard}
                    onRate={handleRate}
                    nextIntervals={getNextIntervals()}
                />
            </main>
        </div>
    );
}
