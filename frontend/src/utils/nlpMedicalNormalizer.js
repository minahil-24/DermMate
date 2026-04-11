/**
 * nlpMedicalNormalizer.js
 * 
 * An offline, dependency-free NLP text correction layer for dermatology speech-to-text.
 * Uses exact phrase-matching for multi-word slang and Levenshtein distance grouping for single-word fuzzy corrections.
 */

// Core Dermatology Knowledge Base Dictionary
export const MEDICAL_DICTIONARY = [
    { correct: 'eczema', phonetics: ['exzema', 'axema', 'egzema', 'akzema', 'aikzema', 'eggzema'] },
    { correct: 'psoriasis', phonetics: ['soriasis', 'sore isis', 'siriasis', 'suriasis', 'so riasis'] },
    { correct: 'rosacea', phonetics: ['rosia', 'rosea', 'roseacea', 'rosasha', 'rozasha'] },
    { correct: 'alopecia', phonetics: ['alopesha', 'alapicia', 'alopicia', 'alapisha', 'alopecya'] },
    { correct: 'vitiligo', phonetics: ['vitilago', 'viteligo', 'vitiligo', 'viti ligo'] },
    { correct: 'dermatitis', phonetics: ['derma', 'dermato', 'dermatitus', 'dermetitis'] },
    { correct: 'melanoma', phonetics: ['milino', 'melanama', 'malinoma', 'melinoma'] },
    { correct: 'acne vulgaris', phonetics: ['acne', 'akney', 'acnee'] },
    { correct: 'erythema', phonetics: ['arethema', 'erathema'] },
    { correct: 'keratosis', phonetics: ['karatosis', 'keratosis', 'caretosis'] }
];

/**
 * Calculates the exact mathematical Levenshtein Distance between two strings.
 * Helps cleanly figure out typos or mismatched phonetics.
 */
const getLevenshteinDistance = (a, b) => {
    if (!a.length) return b.length;
    if (!b.length) return a.length;

    const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
    
    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            if (a[i - 1] === b[j - 1]) {
                matrix[i][j] = matrix[i - 1][j - 1]; // no operation required
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }
    return matrix[a.length][b.length];
};

/**
 * Core NLP Pipeline Function
 * Takes raw Whisper Speech-to-Text output and returns normalized, medically accurate text.
 * @param {string} rawText 
 * @returns {string} correctedText
 */
export const normalizeMedicalText = (rawText) => {
    if (!rawText) return "";
    let processedText = rawText.toLowerCase();

    // LAYER 1: Multi-word Exact Phrase Matching
    // Because fuzzy matchers struggle with spaced-out words (e.g. "sore isis" or "viti ligo"),
    // We execute these replacements first using RegExp boundaries.
    MEDICAL_DICTIONARY.forEach(({ correct, phonetics }) => {
        phonetics.forEach(phonetic => {
            if (phonetic.includes(' ')) {
                const regex = new RegExp(`\\b${phonetic}\\b`, 'gi');
                processedText = processedText.replace(regex, correct);
            }
        });
    });

    // LAYER 2: Tokenized Single-Word Fuzzy Evaluation
    // This allows dynamically fixing unknown typos or transcription stutters without explicitly listing them.
    const punctuationRegex = /([.,!?])/g;
    // Temporarily detatch punctuation to isolate words properly
    const textWithoutPunctuation = processedText.replace(punctuationRegex, ' $1 ');
    const tokens = textWithoutPunctuation.split(/\s+/);

    const correctedTokens = tokens.map(token => {
        // Leave short words, numbers, or syntax characters untouched
        if (token.length <= 3 || /[.,!?0-9]/.test(token)) {
            return token;
        }

        let bestMatch = token;
        let minDistance = Infinity;

        // Loop over the dictionary dictionary
        MEDICAL_DICTIONARY.forEach(({ correct, phonetics }) => {
            const candidates = [correct, ...phonetics.filter(p => !p.includes(' '))];
            
            candidates.forEach(candidate => {
                // Pre-prune matches with high length discrepancies to save complex ops
                if (Math.abs(candidate.length - token.length) > 3) return;
                
                const dist = getLevenshteinDistance(token, candidate);
                
                // Adaptive Thresholding logic
                // Very short words allow max 1 letter change. Longer words allow up to 2 changes.
                const threshold = candidate.length <= 5 ? 1 : 2;
                
                if (dist <= threshold && dist < minDistance) {
                    minDistance = dist;
                    bestMatch = correct;
                }
            });
        });

        return bestMatch;
    });

    // LAYER 3: Reconstruct Text
    const rebuiltString = correctedTokens.join(' ').replace(/\s+([.,!?])/g, '$1');
    return rebuiltString.trim();
};
