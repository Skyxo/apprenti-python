import { useState, useEffect, useCallback } from 'react';

export const useTTS = () => {
    const [voices, setVoices] = useState([]);
    const [speaking, setSpeaking] = useState(false);

    useEffect(() => {
        const loadVoices = () => {
            setVoices(window.speechSynthesis.getVoices());
        };

        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;

        return () => {
            window.speechSynthesis.onvoiceschanged = null;
        };
    }, []);

    const speak = useCallback((text, lang = 'en-US') => {
        if (!text) return;

        // Cancel previous speech
        window.speechSynthesis.cancel();
        setSpeaking(true);

        const utterance = new SpeechSynthesisUtterance(text);

        // Find best voice
        const voice = voices.find(v => v.lang.includes(lang) && !v.name.includes("Google"))
            || voices.find(v => v.lang.includes(lang));

        if (voice) {
            utterance.voice = voice;
        }

        utterance.lang = lang;
        utterance.rate = 0.9; // Slightly slower for clarity

        utterance.onend = () => setSpeaking(false);
        utterance.onerror = () => setSpeaking(false);

        window.speechSynthesis.speak(utterance);
    }, [voices]);

    const stop = useCallback(() => {
        window.speechSynthesis.cancel();
        setSpeaking(false);
    }, []);

    return { speak, stop, speaking };
};
