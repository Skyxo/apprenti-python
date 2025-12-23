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
            header: true,
            delimiter: ";", // User specified semicolon
            skipEmptyLines: true,
            complete: (results) => {
                const cards = [];

                results.data.forEach((row, index) => {
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

                    // Create Master Card with variations
                    const baseCard = {
                        id: crypto.randomUUID(),
                        deckId,
                        importedAt: new Date().toISOString(),

                        // Core Content
                        term: word,
                        definition,
                        translation: french,
                        example,

                        // Scheduler
                        interval: 0,
                        dueDate: new Date().toISOString(),
                        state: 'new',

                        // VARIATIONS CONTAINER
                        variations: {}
                    };

                    // 1. CLOZE VARIATION
                    if (example) {
                        const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                        const clozeSentence = example.replace(new RegExp(escapedWord, 'gi'), '_______');
                        baseCard.variations.cloze = {
                            type: 'cloze',
                            question: clozeSentence,
                            answer: word
                        };
                    }

                    // 2. DEFINITION VARIATION
                    if (definition) {
                        baseCard.variations.definition = {
                            type: 'definition',
                            question: definition,
                            answer: word
                        };
                    }

                    // 3. TRANSLATION VARIATION
                    if (french) {
                        baseCard.variations.translation = {
                            type: 'translation',
                            question: french,
                            answer: word
                        };
                    }

                    // Only add if at least one variation exists
                    if (Object.keys(baseCard.variations).length > 0) {
                        cards.push(baseCard);
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
