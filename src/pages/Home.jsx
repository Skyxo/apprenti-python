import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDecks } from '../contexts/DeckContext';
import { parseAndGenerateCards } from '../utils/csvParser';
import { Upload, Trash2, Play, BookOpen, Shuffle, Puzzle, Languages, Search, X } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
    const navigate = useNavigate();
    const { decks, loading, createDeck, deleteDeck, addCardsToDeck } = useDecks();
    const fileInputRef = useRef(null);
    const [isImporting, setIsImporting] = useState(false);

    // Modal State
    const [selectedDeck, setSelectedDeck] = useState(null);

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsImporting(true);
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const content = e.target.result;
                const deckName = file.name.replace('.csv', '');

                // 1. Create Deck
                const newDeck = createDeck(deckName);

                // 2. Parse & Add Cards
                const cards = await parseAndGenerateCards(content, newDeck.id);
                addCardsToDeck(cards);

            } catch (err) {
                alert("Error parsing CSV: " + err.message);
            } finally {
                setIsImporting(false);
                if (fileInputRef.current) fileInputRef.current.value = "";
            }
        };
        reader.readAsText(file);
    };

    const handleDelete = (id, e) => {
        e.stopPropagation();
        if (confirm("Delete this deck?")) {
            deleteDeck(id);
        }
    };

    const startSession = (mode) => {
        if (!selectedDeck) return;
        navigate(`/study/${selectedDeck.id}?mode=${mode}`);
        setSelectedDeck(null);
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 pb-24">
            <header className="mb-8 pt-4">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <BookOpen className="text-blue-600" /> FlashTOEFL
                </h1>
                <p className="text-slate-500 font-medium">Ready to cram for success?</p>
            </header>

            <div className="space-y-4 max-w-lg mx-auto">
                {decks.map(deck => (
                    <div
                        key={deck.id}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col gap-4 active:scale-[0.99] transition-transform cursor-pointer"
                        onClick={() => setSelectedDeck(deck)}
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">{deck.name}</h2>
                                <div className="text-sm text-slate-500 mt-1 font-medium">
                                    {deck.stats.total} cards total
                                </div>
                            </div>
                            <button onClick={(e) => handleDelete(deck.id, e)} className="text-slate-300 hover:text-red-500 p-2 transition-colors">
                                <Trash2 size={18} />
                            </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold text-white">
                            <div className="bg-blue-500/90 rounded-lg py-1.5 px-2 shadow-sm shadow-blue-200">
                                {deck.stats.new} NEW
                            </div>
                            <div className="bg-orange-500/90 rounded-lg py-1.5 px-2 shadow-sm shadow-orange-200">
                                {deck.stats.learning} LRN
                            </div>
                            <div className="bg-green-500/90 rounded-lg py-1.5 px-2 shadow-sm shadow-green-200">
                                {deck.stats.due} DUE
                            </div>
                        </div>
                    </div>
                ))}

                {decks.length === 0 && !loading && !isImporting && (
                    <div className="text-center py-20 text-slate-400">
                        <p className="mb-4">No decks yet.</p>
                        <p>Import a CSV to start your journey!</p>
                    </div>
                )}

                {isImporting && (
                    <div className="text-center py-20 text-blue-500 animate-pulse">
                        Importing your vocabulary...
                    </div>
                )}
            </div>

            {/* FAB - Add Deck */}
            <div className="fixed bottom-8 right-6">
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full shadow-xl shadow-blue-300 hover:bg-blue-700 text-white transition-all active:scale-90"
                >
                    {isImporting ? (
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Upload size={28} />
                    )}
                </button>
            </div>

            <input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
            />

            {/* MODE SELECTION MODAL */}
            <AnimatePresence>
                {selectedDeck && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                            onClick={() => setSelectedDeck(null)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 overflow-hidden"
                        >
                            <button
                                onClick={() => setSelectedDeck(null)}
                                className="absolute top-4 right-4 text-slate-300 hover:text-slate-600 p-1"
                            >
                                <X size={24} />
                            </button>

                            <h3 className="text-xl font-bold text-slate-800 mb-1">Study Mode</h3>
                            <p className="text-slate-500 text-sm mb-6">Choose how you want to learn {selectedDeck.name}</p>

                            <div className="grid grid-cols-1 gap-3">
                                <ModeButton
                                    icon={<Shuffle className="text-purple-500" />}
                                    title="Mixed Review"
                                    subtitle="Random selection of all types (Best)"
                                    onClick={() => startSession('mixed')}
                                    recommended
                                />
                                <ModeButton
                                    icon={<Puzzle className="text-blue-500" />}
                                    title="Cloze Deletion"
                                    subtitle="Complete the sentence"
                                    onClick={() => startSession('cloze')}
                                />
                                <ModeButton
                                    icon={<Languages className="text-green-500" />}
                                    title="French → English"
                                    subtitle="Translate the word"
                                    onClick={() => startSession('translation')}
                                />
                                <ModeButton
                                    icon={<Search className="text-orange-500" />}
                                    title="Def → English"
                                    subtitle="Find word from definition"
                                    onClick={() => startSession('definition')}
                                />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function ModeButton({ icon, title, subtitle, onClick, recommended }) {
    return (
        <button
            onClick={onClick}
            className={clsx(
                "flex items-center gap-4 w-full p-4 rounded-xl border text-left transition-all active:scale-[0.98]",
                recommended
                    ? "bg-slate-50 border-blue-200 ring-1 ring-blue-100 shadow-sm" // Highlight recommended
                    : "bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-200"
            )}
        >
            <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100">
                {icon}
            </div>
            <div>
                <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-800 text-sm">{title}</h4>
                    {recommended && (
                        <span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">RECOMMENDED</span>
                    )}
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">{subtitle}</p>
            </div>
        </button>
    )
}
