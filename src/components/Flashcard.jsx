import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { Lightbulb, RotateCcw, Volume2 } from 'lucide-react';
import { RATE_AGAIN, RATE_HARD, RATE_GOOD, RATE_EASY } from '../utils/scheduler';
import { useTTS } from '../hooks/useTTS';

export default function Flashcard({ card, onRate, nextIntervals }) {
    const [isFlipped, setIsFlipped] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const { speak, stop } = useTTS();

    // Reset state and speak question when card changes
    useEffect(() => {
        setIsFlipped(false);
        setShowHint(false);
        stop();

        // Auto-read question after a short delay
        const timer = setTimeout(() => {
            // Safety: Redact the answer if it exists in the question (in case CSV import missed it)
            // Escaping regex special chars for the answer
            const safeAnswer = card.answer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const safeText = card.question.replace(new RegExp(safeAnswer, 'gi'), '...').replace(/_______/g, '...');
            speak(safeText, 'en-US');
        }, 500);
        return () => clearTimeout(timer);
    }, [card, speak, stop]);

    // Handle Hint Speech
    useEffect(() => {
        if (showHint) {
            // Speak Definition (EN) then Translation (FR)
            speak(card.definition, 'en-US');
            // Note: Sequential speech with different langs is tricky with simple hook. 
            // For now let's just speak definition.
            // Complex chaining would require an "onEnd" queue.
        }
    }, [showHint, speak, card]);

    // Handle Answer Speech
    useEffect(() => {
        if (isFlipped) {
            speak(card.answer, 'en-US');
        }
    }, [isFlipped, speak, card]);

    if (!card) return <div className="p-8 text-center text-gray-500">No more cards due!</div>;

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
    };

    return (
        <div className="flex flex-col h-full items-center justify-between p-4 max-w-md mx-auto w-full">
            {/* CARD AREA */}
            <div
                className="relative w-full aspect-square md:aspect-[4/3] cursor-pointer perspective-1000 group"
                onClick={handleFlip}
            >
                <motion.div
                    className="w-full h-full relative preserve-3d"
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.15 }} // Snappy flip
                >
                    {/* FRONT */}
                    <div className="absolute inset-0 backface-hidden bg-white border-2 border-slate-200 rounded-3xl shadow-xl flex flex-col items-center justify-center p-6 text-center">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                const safeAnswer = card.answer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                const safeText = card.question.replace(new RegExp(safeAnswer, 'gi'), '...').replace(/_______/g, '...');
                                speak(safeText, 'en-US');
                            }}
                            className="absolute top-4 right-4 text-slate-400 hover:text-blue-500 transition-colors"
                        >
                            <Volume2 size={20} />
                        </button>

                        <h2 className="text-2xl font-serif text-slate-800 leading-relaxed font-medium">
                            {card.question}
                        </h2>

                        {/* Progressive Hint by Card Type */}
                        <div className="mt-8" onClick={(e) => e.stopPropagation()}>
                            {!showHint ? (
                                <button
                                    onClick={() => setShowHint(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-600 rounded-full text-sm font-bold border border-yellow-100 hover:bg-yellow-100 transition-colors"
                                >
                                    <Lightbulb size={16} /> Show Hint
                                </button>
                            ) : (
                                <div className="space-y-4">
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm"
                                    >
                                        {/* Dynamic content based on type */}
                                        {card.type === 'cloze' && (
                                            <>
                                                {card.definition && <p className="mb-2"><span className="font-bold text-slate-400">Def:</span> {card.definition}</p>}
                                                {/* User request: Remove Fr translation to make it harder */}
                                            </>
                                        )}
                                        {card.type === 'translation' && (
                                            <>
                                                {card.example && (
                                                    <p className="mb-2 italic text-slate-500">
                                                        "{card.example.replace(new RegExp(card.answer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '_______')}"
                                                    </p>
                                                )}
                                                {card.definition && <p><span className="font-bold text-slate-400">Def:</span> {card.definition}</p>}
                                            </>
                                        )}
                                        {card.type === 'definition' && (
                                            <>
                                                {/* User request: Remove Fr translation to make it harder */}
                                                {card.example && (
                                                    <p className="italic text-slate-500">
                                                        "{card.example.replace(new RegExp(card.answer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '_______')}"
                                                    </p>
                                                )}
                                            </>
                                        )}

                                        {/* Fallback for other types or missing data */}
                                        {!['cloze', 'translation', 'definition'].includes(card.type) && (
                                            <>
                                                {card.definition && <p className="mb-1"><span className="font-bold text-slate-400">Def:</span> {card.definition}</p>}
                                            </>
                                        )}
                                    </motion.div>
                                    <button
                                        onClick={() => setShowHint(false)}
                                        className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wider"
                                    >
                                        Hide Hint
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* BACK */}
                    <div className="absolute inset-0 backface-hidden rotate-y-180 bg-slate-900 rounded-3xl shadow-xl flex flex-col items-center justify-center p-6 text-center text-white">
                        <span className="absolute top-4 left-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Answer</span>
                        <span className="absolute top-4 right-4 text-slate-500">
                            <RotateCcw size={16} />
                        </span>

                        <h2 className="text-3xl font-bold mb-2 text-green-400">{card.answer}</h2>
                        <div className="text-slate-300 text-sm mt-4 space-y-2">
                            {card.definition && <p>{card.definition}</p>}
                            {card.translation && <p className="italic text-slate-400">{card.translation}</p>}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* CONTROLS */}
            <div className="w-full mt-8 h-20">
                {/* CONTROLS */}
                <div className="w-full mt-8 h-20">
                    <div className="grid grid-cols-4 gap-2">
                        <RateButton
                            label="Again"
                            time={formatTime(nextIntervals[RATE_AGAIN])}
                            color="bg-red-500"
                            onClick={() => onRate(RATE_AGAIN)}
                        />
                        <RateButton
                            label="Hard"
                            time={formatTime(nextIntervals[RATE_HARD])}
                            color="bg-orange-500"
                            onClick={() => onRate(RATE_HARD)}
                        />
                        <RateButton
                            label="Good"
                            time={formatTime(nextIntervals[RATE_GOOD])}
                            color="bg-blue-500"
                            onClick={() => onRate(RATE_GOOD)}
                        />
                        <RateButton
                            label="Easy"
                            time={formatTime(nextIntervals[RATE_EASY])}
                            color="bg-green-500"
                            onClick={() => onRate(RATE_EASY)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function RateButton({ label, time, color, onClick }) {
    return (
        <button
            onClick={onClick}
            className={clsx(color, "flex flex-col items-center justify-center py-3 rounded-xl shadow-md active:scale-95 transition-transform text-white h-full")}
        >
            <span className="font-bold text-sm">{label}</span>
            <span className="text-[10px] opacity-80">{time}</span>
        </button>
    )
}

function formatTime(minutes) {
    if (minutes < 1) return '<1m';
    if (minutes < 60) return Math.round(minutes) + 'm';
    if (minutes < 1440) return Math.round(minutes / 60) + 'h';
    return Math.round(minutes / 1440) + 'd';
}
