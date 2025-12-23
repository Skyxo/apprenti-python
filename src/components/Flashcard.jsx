import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, useAnimation, AnimatePresence } from 'framer-motion';
import { Lightbulb, RotateCcw, Volume2, Star } from 'lucide-react';
import { RATE_AGAIN, RATE_GOOD } from '../utils/scheduler';
import { useTTS } from '../hooks/useTTS';

export default function Flashcard({ card, onRate }) {
    const [isFlipped, setIsFlipped] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const { speak, stop } = useTTS();

    // Safety check just in case card is null briefly
    if (!card) return <div className="p-8 text-center text-gray-500">No more cards due!</div>;

    return (
        <div className="flex flex-col h-full items-center justify-center p-4 max-w-md mx-auto w-full relative overflow-hidden">
            {/* SWIPE AREA */}
            <div className="relative w-full aspect-[3/4] max-h-[600px] flex items-center justify-center">
                <AnimatePresence>
                    {/* We use a key based on card ID to force re-mount on new card */}
                    <SwipeableCard
                        key={card.id || card.question}
                        card={card}
                        onRate={onRate}
                        isFlipped={isFlipped}
                        setIsFlipped={setIsFlipped}
                        showHint={showHint}
                        setShowHint={setShowHint}
                        speak={speak}
                        stop={stop}
                    />
                </AnimatePresence>
            </div>

            {/* Helper Text Removed */}
        </div>
    );
}

function SwipeableCard({ card, onRate, isFlipped, setIsFlipped, showHint, setShowHint, speak, stop }) {
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-25, 25]);
    const opacityRight = useTransform(x, [50, 150], [0, 1]);
    const opacityLeft = useTransform(x, [-50, -150], [0, 1]);
    const controls = useAnimation();
    const cardRef = useRef(null);

    // Auto-read question
    useEffect(() => {
        setIsFlipped(false);
        setShowHint(false);
        stop();

        const timer = setTimeout(() => {
            const safeAnswer = card.answer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const safeText = card.question.replace(new RegExp(safeAnswer, 'gi'), '...').replace(/_______/g, '...');
            speak(safeText, 'en-US');
        }, 500);
        return () => clearTimeout(timer);
    }, [card, speak, stop, setIsFlipped, setShowHint]);

    // Handle Answer Speech
    useEffect(() => {
        if (isFlipped) {
            speak(card.answer, 'en-US');
        }
    }, [isFlipped, speak, card]);

    const handleDragEnd = async (event, info) => {
        const offset = info.offset.x;
        const velocity = info.velocity.x;

        if (offset > 100 || velocity > 500) {
            // SWIPE RIGHT (GOOD)
            await controls.start({ x: 500, opacity: 0, transition: { duration: 0.2 } });
            onRate(RATE_GOOD);
        } else if (offset < -100 || velocity < -500) {
            // SWIPE LEFT (AGAIN)
            await controls.start({ x: -500, opacity: 0, transition: { duration: 0.2 } });
            onRate(RATE_AGAIN);
        } else {
            // RESET
            controls.start({ x: 0, transition: { type: "spring", stiffness: 300, damping: 20 } });
        }
    };

    const handleFlip = () => {
        if (Math.abs(x.get()) < 5) { // Only flip if not dragging
            setIsFlipped(!isFlipped);
        }
    };

    // Calculate mastery level roughly based on interval
    // This is purely visual mapping
    const getMasteryLevel = () => {
        if (!card.interval || card.interval < 10) return 0;
        if (card.interval < 60) return 1;
        if (card.interval < 24 * 60) return 2;
        return 3;
    };

    const mastery = getMasteryLevel();

    return (
        <motion.div
            ref={cardRef}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            style={{ x, rotate, zIndex: 10 }}
            animate={controls}
            onDragEnd={handleDragEnd}
            className="absolute w-full h-full cursor-grab active:cursor-grabbing perspective-1000"
            whileTap={{ scale: 1.02 }}
            initial={{ scale: 0.9, opacity: 0, y: 50 }}
            exit={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
            {/* SWIPE OVERLAYS */}
            <motion.div style={{ opacity: opacityRight }} className="absolute inset-0 z-20 bg-green-500 rounded-3xl flex items-center justify-center pointer-events-none border-4 border-green-600/50">
                <div className="transform rotate-[-15deg] border-4 border-white text-white font-black text-6xl uppercase px-4 py-2 rounded-lg tracking-widest">
                    LIKE
                </div>
            </motion.div>
            <motion.div style={{ opacity: opacityLeft }} className="absolute inset-0 z-20 bg-red-500 rounded-3xl flex items-center justify-center pointer-events-none border-4 border-red-600/50">
                <div className="transform rotate-[15deg] border-4 border-white text-white font-black text-6xl uppercase px-4 py-2 rounded-lg tracking-widest">
                    NOPE
                </div>
            </motion.div>

            {/* CARD CONTENT */}
            <motion.div
                className="w-full h-full relative preserve-3d shadow-2xl rounded-3xl bg-white"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                onClick={handleFlip}
            >
                {/* FRONT */}
                <div className="absolute inset-0 backface-hidden bg-white rounded-3xl flex flex-col items-center p-6 text-center border border-slate-200">
                    {/* MASTERY INDICATOR */}
                    <div className="absolute top-4 left-4 flex gap-1">
                        {[0, 1, 2].map(i => (
                            <Star
                                key={i}
                                size={16}
                                className={i < mastery ? "fill-amber-400 text-amber-400" : "text-slate-200"}
                            />
                        ))}
                    </div>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            const safeAnswer = card.answer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                            const safeText = card.question.replace(new RegExp(safeAnswer, 'gi'), '...').replace(/_______/g, '...');
                            speak(safeText, 'en-US');
                        }}
                        className="absolute top-4 right-4 text-slate-400 hover:text-blue-500 transition-colors z-30"
                    >
                        <Volume2 size={24} />
                    </button>

                    <div className="flex-1 flex flex-col items-center justify-center w-full">
                        <h2 className="text-3xl font-serif text-slate-800 leading-relaxed font-medium select-none">
                            {card.question}
                        </h2>
                    </div>

                    {/* HINT SECTION */}
                    <div className="mt-auto w-full" onClick={(e) => e.stopPropagation()}>
                        {!showHint ? (
                            <button
                                onClick={() => setShowHint(true)}
                                className="flex items-center justify-center gap-2 mx-auto px-4 py-2 bg-yellow-50 text-yellow-600 rounded-full text-sm font-bold border border-yellow-100 hover:bg-yellow-100 transition-colors"
                            >
                                <Lightbulb size={16} /> Show Hint
                            </button>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-left w-full"
                            >
                                {card.definition && <p className="mb-1"><span className="font-bold text-slate-400">Def:</span> {card.definition}</p>}

                                {/* Show Example/Context for Translation AND Definition modes */}
                                {card.example && (
                                    <p className="italic text-slate-500 mt-2">
                                        "{card.example.replace(new RegExp(card.answer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '_______')}"
                                    </p>
                                )}
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* BACK */}
                <div className="absolute inset-0 backface-hidden rotate-y-180 bg-slate-900 rounded-3xl flex flex-col items-center justify-center p-6 text-center text-white">
                    <span className="absolute top-6 right-6 text-slate-500">
                        <RotateCcw size={24} />
                    </span>

                    <h2 className="text-4xl font-bold mb-4 text-green-400 select-none">{card.answer}</h2>
                    <div className="text-slate-300 text-base mt-2 space-y-2">
                        {card.definition && <p>{card.definition}</p>}
                        {card.translation && <p className="italic text-slate-400">{card.translation}</p>}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
