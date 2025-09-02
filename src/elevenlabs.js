import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';
import dotenv from 'dotenv';

dotenv.config();

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const SPEECH_TO_TEXT_API_URL = 'https://api.elevenlabs.io/v1/speech-to-text';

/**
 * Transcribe audio file using ElevenLabs Speech to Text API
 * @param {string} audioFilePath - Path to the audio file
 * @returns {Promise<Object>} - Transcription with word-level timestamps and speaker diarization
 */
export async function transcribeAudio(audioFilePath) {
    if (!ELEVENLABS_API_KEY) {
        throw new Error('ELEVENLABS_API_KEY environment variable is not set');
    }

    if (!fs.existsSync(audioFilePath)) {
        throw new Error(`Audio file not found at path: ${audioFilePath}`);
    }

    try {
        console.log(`Transcribing audio file: ${audioFilePath}`);

        const formData = new FormData();
        formData.append('file', fs.createReadStream(audioFilePath));
        formData.append('model_id', 'scribe_v1'); // Currently only 'scribe_v1' is available
        formData.append('diarize', 'true'); // Enable speaker diarization
        formData.append('num_speakers', '10'); // Maximum number of speakers (1-32)
        formData.append('language_code', 'en'); // Optional: language of the audio
        formData.append('timestamps_granularity', 'word'); // word-level timestamps

        const response = await axios.post(SPEECH_TO_TEXT_API_URL, formData, {
            headers: {
                ...formData.getHeaders(),
                'xi-api-key': ELEVENLABS_API_KEY,
            },
            maxBodyLength: Infinity,
        });

        console.log('Transcription completed successfully');

        // Process the response to match the expected format in our application
        const processedResponse = processTranscriptionResponse(response.data);
        return processedResponse;
    } catch (error) {
        console.error('Error transcribing audio with ElevenLabs Speech to Text:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Response status:', error.response.status);
        }
        throw new Error(`ElevenLabs Speech to Text transcription failed: ${error.message}`);
    }
}

/**
 * Process the ElevenLabs Speech to Text API response to match our application's expected format
 * @param {Object} apiResponse - The raw API response
 * @returns {Object} - Processed response with our application's expected format
 */
function processTranscriptionResponse(apiResponse) {
    // Extract the full text
    const text = apiResponse.text || '';

    // Process words to ensure they have the expected format
    const words = (apiResponse.words || []).map(word => {
        // Only include actual words, not spacing
        if (word.type === 'word') {
            return {
                text: word.text,
                start_time: word.start,
                end_time: word.end,
                speaker: word.speaker_id || 'unknown'
            };
        }
        return null;
    }).filter(Boolean); // Remove null entries

    // Group words by speaker and sentence
    const sentences = extractSentences(apiResponse);

    return {
        text,
        words,
        sentences
    };
}

/**
 * Extract sentences from the transcription response
 * @param {Object} apiResponse - The raw API response
 * @returns {Array} - Array of sentence objects
 */
function extractSentences(apiResponse) {
    const text = apiResponse.text || '';
    const words = apiResponse.words || [];

    // Simple sentence extraction based on punctuation
    const sentenceTexts = text.match(/[^.!?]+[.!?]+/g) || [text];
    const sentences = [];

    let currentSentenceWords = [];
    let currentSpeaker = null;
    let sentenceIndex = 0;

    // Group words into sentences
    for (const word of words) {
        if (word.type !== 'word') continue;

        // Set initial speaker for the sentence
        if (currentSentenceWords.length === 0) {
            currentSpeaker = word.speaker_id || 'unknown';
        }

        currentSentenceWords.push(word);

        // Check if we've reached the end of a sentence
        const wordWithPunctuation = word.text.match(/[.!?]$/);
        if (wordWithPunctuation) {
            if (currentSentenceWords.length > 0) {
                const sentenceText = currentSentenceWords.map(w => w.text).join('');
                sentences.push({
                    text: sentenceText,
                    start_time: currentSentenceWords[0].start,
                    end_time: currentSentenceWords[currentSentenceWords.length - 1].end,
                    speaker: currentSpeaker,
                    words: [...currentSentenceWords]
                });

                currentSentenceWords = [];
                sentenceIndex++;
            }
        }
    }

    // Add any remaining words as a sentence
    if (currentSentenceWords.length > 0) {
        const sentenceText = currentSentenceWords.map(w => w.text).join('');
        sentences.push({
            text: sentenceText,
            start_time: currentSentenceWords[0].start,
            end_time: currentSentenceWords[currentSentenceWords.length - 1].end,
            speaker: currentSpeaker,
            words: [...currentSentenceWords]
        });
    }

    return sentences;
}
