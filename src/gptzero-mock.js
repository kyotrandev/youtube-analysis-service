/**
 * Mock implementation of GPTZero API for demonstration purposes
 * This allows the application to run without requiring an actual GPTZero API key
 */

/**
 * Generate a random AI probability score based on the text content
 * @param {string} text - Text to analyze
 * @returns {number} - AI probability score between 0 and 1
 */
function generateMockAIProbability(text) {
    // For demo purposes, we'll generate a somewhat realistic-looking probability
    // based on the text characteristics

    // Simple heuristics for demonstration:
    // 1. Longer texts tend to have more varied AI probability
    // 2. Texts with certain keywords might have higher AI probability
    // 3. Add some randomness to make it look realistic

    // Base probability (low)
    let baseProbability = 0.05 + (Math.random() * 0.1);

    // Text length factor (longer texts might have slightly higher probability)
    const lengthFactor = Math.min(text.length / 1000, 0.2);

    // Keyword factor
    const aiKeywords = [
        'algorithm', 'neural', 'network', 'intelligence', 'artificial',
        'model', 'trained', 'generate', 'language', 'processing',
        'data', 'analysis', 'prediction', 'machine', 'learning'
    ];

    let keywordMatches = 0;
    const lowercaseText = text.toLowerCase();

    aiKeywords.forEach(keyword => {
        if (lowercaseText.includes(keyword)) {
            keywordMatches++;
        }
    });

    const keywordFactor = Math.min(keywordMatches * 0.05, 0.3);

    // Calculate final probability
    let probability = baseProbability + lengthFactor + keywordFactor;

    // Add some randomness
    probability += (Math.random() * 0.1) - 0.05;

    // Ensure probability is between 0 and 1
    probability = Math.max(0, Math.min(probability, 0.95));

    return probability;
}

/**
 * Mock version of the analyzeText function
 * @param {string} text - Text to analyze
 * @returns {Promise<number>} - AI probability score (0-1)
 */
export async function analyzeText(text) {
    // Simulate API delay for realism
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700));

    console.log(`[MOCK] Analyzing text with GPTZero (${text.length} chars)`);

    // Generate mock probability
    const aiProbability = generateMockAIProbability(text);

    console.log(`[MOCK] GPTZero analysis complete: AI probability ${aiProbability}`);
    return aiProbability;
}

/**
 * Process a transcript by analyzing each sentence with mock GPTZero
 * @param {Object} transcript - Transcript object from ElevenLabs Speech to Text
 * @returns {Promise<Object>} - Enhanced transcript with AI probabilities
 */
export async function processTranscript(transcript) {
    if (!transcript || !transcript.text) {
        throw new Error('Invalid transcript format');
    }

    console.log('[MOCK] Using GPTZero mock implementation for demo purposes');

    // Use the sentences that were already extracted in the ElevenLabs processing
    const sentences = transcript.sentences || [];

    if (sentences.length === 0) {
        console.warn('No sentences found in transcript, cannot analyze AI probability');
        return transcript;
    }

    // Process each sentence
    const enhancedSentences = [];
    for (const sentence of sentences) {
        try {
            const aiProbability = await analyzeText(sentence.text);
            enhancedSentences.push({
                ...sentence,
                ai_probability: aiProbability
            });
        } catch (error) {
            console.error(`Error processing sentence: "${sentence.text}"`, error);
            enhancedSentences.push({
                ...sentence,
                ai_probability: null,
                error: error.message
            });
        }
    }

    // Return enhanced transcript
    return {
        ...transcript,
        sentences: enhancedSentences
    };
}
