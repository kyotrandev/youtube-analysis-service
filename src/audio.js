import youtubedl from "youtube-dl-exec";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import ffmpeg from "fluent-ffmpeg";

/**
 * Download audio from YouTube URL and convert to WAV (16 kHz, mono, 16-bit)
 * @param {string} url - YouTube URL
 * @param {string} outPath - Output file path
 * @returns {Promise<void>}
 */
export async function downloadToWav(url, outPath) {
    const tempPath = `${outPath}.temp.wav`;
    
    // Make sure directory exists
    const dir = path.dirname(outPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    
    try {
        // Step 1: Download audio using yt-dlp
        await downloadAudio(url, tempPath);
        
        // Step 2: Convert to required format (16 kHz, mono, 16-bit)
        await convertAudio(tempPath, outPath);
        
        // Step 3: Clean up temporary file
        if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
        }
        
        console.log(`Audio processed successfully: ${outPath}`);
    } catch (error) {
        console.error("Error processing audio:", error);
        
        // Clean up temporary file if it exists
        if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
        }
        
        throw error;
    }
}

/**
 * Download audio from YouTube URL
 * @param {string} url - YouTube URL
 * @param {string} outPath - Output file path
 * @returns {Promise<void>}
 */
function downloadAudio(url, outPath) {
    return new Promise((resolve, reject) => {
        console.log("Downloading audio from:", url);
        
        // Use spawn to properly handle stdout pipe
        const ytdlProcess = spawn('yt-dlp', [
            url,
            '-o', '-',
            '-f', 'bestaudio',
            '--extract-audio',
            '--audio-format', 'wav',
            '--audio-quality', '0',
            '--ffmpeg-location', 'ffmpeg'
        ]);
        
        // Create write stream
        const fileStream = fs.createWriteStream(outPath);
        
        // Pipe stdout to file
        ytdlProcess.stdout.pipe(fileStream);
        
        // Handle events
        ytdlProcess.stderr.on('data', (data) => {
            console.log(`yt-dlp stderr: ${data}`);
        });
        
        fileStream.on("finish", () => {
            console.log("Audio download completed:", outPath);
            resolve();
        });
        
        fileStream.on("error", (err) => {
            console.error("File write error:", err);
            reject(err);
        });
        
        ytdlProcess.on('error', (err) => {
            console.error("yt-dlp process error:", err);
            reject(err);
        });
        
        ytdlProcess.on('close', (code) => {
            if (code !== 0) {
                const error = new Error(`yt-dlp process exited with code ${code}`);
                console.error(error);
                reject(error);
            }
        });
    });
}

/**
 * Convert audio to required format (16 kHz, mono, 16-bit)
 * @param {string} inputPath - Input file path
 * @param {string} outputPath - Output file path
 * @returns {Promise<void>}
 */
function convertAudio(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        console.log(`Converting audio to 16 kHz, mono, 16-bit WAV: ${inputPath} -> ${outputPath}`);
        
        ffmpeg(inputPath)
            .audioFrequency(16000)
            .audioChannels(1)
            .audioBitrate(16)
            .format('wav')
            .on('error', (err) => {
                console.error('FFmpeg error:', err);
                reject(err);
            })
            .on('end', () => {
                console.log('Audio conversion completed');
                resolve();
            })
            .save(outputPath);
    });
}
