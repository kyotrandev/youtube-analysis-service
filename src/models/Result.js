import mongoose from 'mongoose';

// Define a schema for sentences in the transcript
const SentenceSchema = new mongoose.Schema({
  text: String,
  start_time: Number,
  end_time: Number,
  speaker: String,
  ai_probability: Number,
  words: [mongoose.Schema.Types.Mixed]
}, { _id: false });

// Define a schema for words in the transcript
const WordSchema = new mongoose.Schema({
  text: String,
  start_time: Number,
  end_time: Number,
  speaker: String,
  confidence: Number
}, { _id: false });

// Define a schema for the transcript
const TranscriptSchema = new mongoose.Schema({
  text: String,
  words: [WordSchema],
  sentences: [SentenceSchema]
}, { _id: false });

// Define the main schema for analysis results
const ResultSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // Use the UUID as the MongoDB _id
  url: { type: String, required: true },
  screenshot_path: String,
  audio_path: String,
  transcript_path: String,
  transcript: TranscriptSchema,
  using_mock_gptzero: Boolean,
  error: String,
  created_at: { type: Date, default: Date.now }
}, {
  timestamps: true,
  versionKey: false
});

// Create a model from the schema
const Result = mongoose.model('Result', ResultSchema);

export default Result;
