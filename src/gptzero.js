import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const GPTZERO_API_KEY = process.env.GPTZERO_API_KEY;
const GPTZERO_API_URL = 'https://api.gptzero.me/v2/predict/text';

/**
 * Analyze text with GPTZero to determine AI probability
 * @param {string} text - Text to analyze
 * @returns {Promise<number>} - AI probability score (0-1)
 */
export async function analyzeText(text) {
    if (!GPTZERO_API_KEY) {
        throw new Error('GPTZERO_API_KEY environment variable is not set');
    }

    try {
        console.log(`Analyzing text with GPTZero (${text.length} chars)`);
        
        const response = await axios.post(
            GPTZERO_API_URL,
            { document: text },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Api-Key': GPTZERO_API_KEY
                }
            }
        );

        // Extract the AI probability score from the response
        // Adjust this based on the actual GPTZero API response structure
        const aiProbability = response.data.documents?.[0]?.completely_generated_prob || 0;
        
        console.log(`GPTZero analysis complete: AI probability ${aiProbability}`);
        return aiProbability;
    } catch (error) {
        console.error('Error analyzing text with GPTZero:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Response status:', error.response.status);
        }
        throw new Error(`GPTZero analysis failed: ${error.message}`);
    }
}

/**
 * Process a transcript by analyzing each sentence with GPTZero
 * @param {Object} transcript - Transcript object from ElevenLabs Speech to Text
 * @returns {Promise<Object>} - Enhanced transcript with AI probabilities
 */
export async function processTranscript(transcript) {
    if (!transcript || !transcript.text) {
        throw new Error('Invalid transcript format');
    }

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
