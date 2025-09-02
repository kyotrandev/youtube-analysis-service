import fs from "fs";
import path from "path";
import Result from './models/Result.js';


const dataDirs = ["data/results", "data/screenshots", "data/audio", "data/transcripts"];
for (const dir of dataDirs) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/**
 * Save analysis result to MongoDB
 * @param {string} id - Unique ID for the result
 * @param {Object} data - Result data to save
 * @returns {Promise<Object>} - Saved result document
 */
export async function saveResult(id, data) {
    try {
        // Save to MongoDB using Mongoose
        const result = new Result({
            _id: id,
            ...data
        });
        
        await result.save();
        console.log(`Result ${id} saved to MongoDB`);
        
        // Also save a local copy for backup
        const localPath = path.join("data/results", `${id}.json`);
        fs.writeFileSync(localPath, JSON.stringify(data, null, 2));
        
        return result;
    } catch (error) {
        console.error(`Error saving result ${id} to MongoDB:`, error);
        
        // Fallback to file system if MongoDB fails
        const localPath = path.join("data/results", `${id}.json`);
        fs.writeFileSync(localPath, JSON.stringify(data, null, 2));
        
        throw error;
    }
}

/**
 * Load analysis result from MongoDB
 * @param {string} id - Unique ID for the result
 * @returns {Promise<Object|null>} - Result document or null if not found
 */
export async function loadResult(id) {
    try {
        // Try to load from MongoDB
        const result = await Result.findById(id).lean();
        
        if (result) {
            console.log(`Result ${id} loaded from MongoDB`);
            return result;
        }
        
        // If not found in MongoDB, try local file as fallback
        const localPath = path.join("data/results", `${id}.json`);
        if (fs.existsSync(localPath)) {
            console.log(`Result ${id} loaded from local file (MongoDB fallback)`);
            return JSON.parse(fs.readFileSync(localPath, "utf-8"));
        }
        
        return null;
    } catch (error) {
        console.error(`Error loading result ${id} from MongoDB:`, error);
        
        // Try local file as fallback
        try {
            const localPath = path.join("data/results", `${id}.json`);
            if (fs.existsSync(localPath)) {
                console.log(`Result ${id} loaded from local file (MongoDB error fallback)`);
                return JSON.parse(fs.readFileSync(localPath, "utf-8"));
            }
        } catch (fsError) {
            console.error(`Error loading result ${id} from local file:`, fsError);
        }
        
        return null;
    }
}
