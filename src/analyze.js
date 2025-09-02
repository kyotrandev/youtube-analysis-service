import { v4 as uuidv4 } from "uuid";
import { takeScreenshot } from "./puppeteer.js";
import { downloadToWav } from "./audio.js";
import { saveResult } from "./storage.js";
import { transcribeAudio } from "./elevenlabs.js";
import { processTranscript, isUsingMock } from "./gptzero-wrapper.js";
import fs from "fs";
import path from "path";

export async function analyze(url) {
    const id = uuidv4();
    const screenshotPath = `data/screenshots/${id}.png`;
    const audioPath = `data/audio/${id}.wav`;
    const transcriptPath = `data/transcripts/${id}.json`;

    const dirs = [
        path.dirname(screenshotPath),
        path.dirname(audioPath),
        path.dirname(transcriptPath)
    ];

    for (const dir of dirs) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    try {
        // 1. Take screenshot
        console.log(`Taking screenshot of ${url}`);
        await takeScreenshot(url, screenshotPath);

        // 2. Download & convert audio to WAV (16 kHz, mono, 16-bit)
        console.log(`Downloading audio from ${url}`);
        await downloadToWav(url, audioPath);

        // 3. Transcribe audio with ElevenLabs Scribe
        console.log(`Transcribing audio with ElevenLabs Scribe`);
        const transcription = await transcribeAudio(audioPath);

        // 4. Process transcript with GPTZero for AI probability
        console.log(`Analyzing transcript with ${isUsingMock ? 'MOCK ' : ''}GPTZero`);
        const enhancedTranscript = await processTranscript(transcription);

        // 5. Save transcript to file
        fs.writeFileSync(transcriptPath, JSON.stringify(enhancedTranscript, null, 2));

        // 6. Save JSON result
        const result = {
            id,
            url,
            screenshot_path: screenshotPath,
            audio_path: audioPath,
            transcript_path: transcriptPath,
            transcript: enhancedTranscript,
            using_mock_gptzero: isUsingMock,
            created_at: new Date().toISOString()
        };
        await saveResult(id, result);

        return id;
    } catch (error) {
        console.error(`Error analyzing ${url}:`, error);

        // Create error result
        const result = {
            id,
            url,
            error: error.message,
            created_at: new Date().toISOString()
        };

        // Add any partial results that were successfully generated
        if (fs.existsSync(screenshotPath)) {
            result.screenshot_path = screenshotPath;
        }

        if (fs.existsSync(audioPath)) {
            result.audio_path = audioPath;
        }

        await saveResult(id, result);
        throw error;
    }
}
