import Papa from 'papaparse';
// Using native crypto.randomUUID()

/**
 * Parses CSV content and generates 3 cards per row.
 * @param {string} csvContent 
 * @param {string} deckId
 * @returns {Promise<Array>} List of card objects
 */
export async function parseAndGenerateCards(csvContent, deckId) {
    return new Promise((resolve, reject) => {
        Papa.parse(csvContent, {
            header: true, // We assume headers based on user input
            delimiter: ";", // User specified semicolon
            skipEmptyLines: true,
            complete: (results) => {
                const cards = [];

                results.data.forEach((row, index) => {
                    // Normalize keys (trim spaces, lowercase for matching? No, sensitive)
                    // User Keys: Word;French Translation;English Definition;Example Sentence

                    // Let's find keys flexibly
                    const findKey = (query) => Object.keys(row).find(k => k.toLowerCase().includes(query.toLowerCase()));

                    const keyWord = findKey('Word') || findKey('mot');
                    const keyFrench = findKey('French') || findKey('traduction');
                    const keyDef = findKey('Definition');
                    const keyExample = findKey('Example') || findKey('phrase');

                    const word = row[keyWord]?.trim();
                    const french = row[keyFrench]?.trim();
                    const definition = row[keyDef]?.trim();
                    const example = row[keyExample]?.trim();

                    if (!word) return;

                    const baseInfo = {
                        deckId,
                        importedAt: new Date().toISOString(),
                        // Common fields stored for reference
                        term: word,
                        definition,
                        translation: french,
                        example,

                        // Scheduler init
                        interval: 0,
                        dueDate: new Date().toISOString(), // Due immediately
                        state: 'new',
                    };

                    // 1. CLOZE CARD (Best one)
                    if (example) {
                        // Create cloze by replacing word (case insensitive) with _______
                        // Escape regex chars in word
                        const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                        const clozeSentence = example.replace(new RegExp(escapedWord, 'gi'), '_______');
                        cards.push({
                            ...baseInfo,
                            id: crypto.randomUUID(),
                            type: 'cloze',
                            question: clozeSentence,
                            answer: word,
                            hint: definition || french // Hint if they are stuck
                        });
                    } else {
                        // Fallback if no example: just Definition -> Word
                        if (definition) {
                            cards.push({
                                ...baseInfo,
                                id: crypto.randomUUID(),
                                type: 'definition_fallback',
                                question: definition,
                                answer: word,
                                hint: french
                            });
                        }
                    }

                    // 2. DEFINITION CARD (English -> Word)
                    if (definition) {
                        cards.push({
                            ...baseInfo,
                            id: crypto.randomUUID(),
                            type: 'definition',
                            question: definition,
                            answer: word,
                            hint: french
                        });
                    }

                    // 3. TRANSLATION CARD (French -> Word)
                    if (french) {
                        cards.push({
                            ...baseInfo,
                            id: crypto.randomUUID(),
                            type: 'translation',
                            question: french,
                            answer: word,
                            hint: definition
                        });
                    }
                });

                resolve(cards);
            },
            error: (err) => {
                reject(err);
            }
        });
    });
}
