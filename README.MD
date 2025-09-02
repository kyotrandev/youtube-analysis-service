# YouTube Analysis Service - Technical Test

A Node.js service that analyzes YouTube videos by capturing screenshots, extracting audio, transcribing content with ElevenLabs Scribe, and analyzing AI probability with GPTZero.

## Overview

This service provides an end-to-end pipeline for analyzing YouTube video content:

1. **Video Capture**: Loads YouTube videos in a headless browser and takes screenshots
2. **Audio Extraction**: Downloads and processes audio tracks
3. **Transcription**: Converts speech to text with speaker diarization
4. **AI Detection**: Analyzes each sentence for AI-generated content probability
5. **Result Storage**: Saves all analysis data for retrieval via API

## Setup Instructions

### Prerequisites

- Node.js 18+
- Docker Desktop
- MongoDB (included in Docker setup)
- API Keys:
  - ElevenLabs API Key (required for transcription)
  - GPTZero API Key (optional - mock implementation available)

### Environment Variables

Create a `.env` file in the project root with the following variables:

```
# Required API Keys
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Optional API Keys (mock implementation used if not provided)
GPTZERO_API_KEY=your_gptzero_api_key_here

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/youtube-analysis

# Server Configuration
PORT=8080
```

## Docker Development

1. Ensure Docker Desktop are installed and running

2. Create `.env` file with required environment variables

3. Build and start containers

   ```bash
   docker compose up -d
   ```

4. Access the web interface at http://localhost:8080

## API Documentation

### POST /analyze

Submit a YouTube URL for analysis.

**Request:**

```json
{
  "url": "https://youtu.be/D06r0d6HexQ"
}
```

**Response(example):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "processing"
}
```

### GET /result/:id

Retrieve analysis results by ID.

**Response:**

- Example in `sample/sample-result.json`

## Design Decisions

### Architecture

The service is structured in simple modules for build fast and ship smart solution:

1. **Express.js API Layer**: Handles HTTP requests and responses
2. **Processing Pipeline**:
   - Video capture with Puppeteer
   - Audio extraction with youtube-dl-exec
   - Audio processing with FFmpeg
   - Transcription with ElevenLabs API
   - AI detection with GPTZero API
3. **Data Persistence**: MongoDB for storing analysis results
4. **File Storage**: Local filesystem for audio, screenshots, and transcripts

## Project Structure

```
/
├── data/                  # Data storage
│   ├── audio/             # Downloaded audio files
│   ├── screenshots/       # Captured screenshots
│   ├── results/           # JSON analysis results
│   └── transcripts/       # Transcription files
├── public/                # Static web files
│   └── index.html         # Web interface
├── sample/                # Sample output files
├── src/                   # Source code
│   ├── analyze.js         # Main analysis pipeline
│   ├── audio.js           # Audio processing utilities
│   ├── db.js              # Database connection
│   ├── elevenlabs.js      # ElevenLabs API integration
│   ├── gptzero.js         # GPTZero API integration
│   ├── gptzero-mock.js    # Mock implementation
│   ├── index.js           # API server
│   ├── models/            # Mongoose models
│   ├── puppeteer.js       # Browser automation
│   └── storage.js         # Result storage/retrieval
├── .env                   # Environment variables
├── Dockerfile             # Container definition
├── docker-compose.yml     # Container orchestration
└── package.json           # Project dependencies
```

## Testing

To test the services:

1. Start the service using Docker

   ```bash
   docker compose up
   ```

2. Submit a YouTube URL via the web interface or API

   ```bash
   curl -X POST http://localhost:8080/analyze \
     -H "Content-Type: application/json" \
     -d '{"url":"https://youtu.be/D06r0d6HexQ"}'
   ```

3. Check the analysis status and retrieve results using the returned ID
   ```bash
   curl http://localhost:8080/result/{id}
   ```
