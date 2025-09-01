import dotenv from 'dotenv';
import * as gptzeroReal from './gptzero.js';
import * as gptzeroMock from './gptzero-mock.js';

dotenv.config();

// Check if GPTZero API key is available
const GPTZERO_API_KEY = process.env.GPTZERO_API_KEY;
const useRealAPI = GPTZERO_API_KEY && GPTZERO_API_KEY.trim() !== '' && 
                  !GPTZERO_API_KEY.includes('your_gptzero_api_key_here');

// Export the appropriate functions based on API key availability
export const analyzeText = useRealAPI ? gptzeroReal.analyzeText : gptzeroMock.analyzeText;
export const processTranscript = useRealAPI ? gptzeroReal.processTranscript : gptzeroMock.processTranscript;

// Log which implementation is being used
console.log(`Using ${useRealAPI ? 'REAL' : 'MOCK'} GPTZero implementation`);

// Export a flag indicating which implementation is being used
export const isUsingMock = !useRealAPI;
