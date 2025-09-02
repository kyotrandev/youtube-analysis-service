import express from "express";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import { analyze } from "./analyze.js";
import { loadResult } from "./storage.js";
import { connectToDatabase } from "./db.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();

// Connect to MongoDB
connectToDatabase().catch(err => {
    console.error('Failed to connect to MongoDB:', err);
});

// Middleware
app.use(bodyParser.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, "../public")));

// Serve data directory for accessing screenshots and other files
app.use("/data", express.static(path.join(__dirname, "../data")));

// API routes
app.post("/analyze", async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "Missing url" });

    try {
        console.log(`Received analysis request for URL: ${url}`);
        const id = await analyze(url);
        console.log(`Analysis started with ID: ${id}`);
        res.json({ id, status: "processing" });
    } catch (err) {
        console.error(`Error starting analysis:`, err);
        res.status(500).json({ error: err.message });
    }
});

app.get("/result/:id", async (req, res) => {
    try {
        const id = req.params.id;
        console.log(`Fetching result for ID: ${id}`);

        const data = await loadResult(id);
        if (!data) {
            console.log(`Result not found for ID: ${id}`);
            return res.status(404).json({ error: "Result not found" });
        }

        res.json(data);
    } catch (err) {
        console.error(`Error fetching result:`, err);
        res.status(500).json({ error: err.message });
    }
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
