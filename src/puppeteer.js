import puppeteer from "puppeteer";

/**
 * Browser launch configuration
 */
const BROWSER_CONFIG = {
    headless: true,
    executablePath: "/usr/bin/chromium",
    args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-zygote"
    ]
};

/**
 * Default viewport settings
 */
const DEFAULT_VIEWPORT = { width: 1280, height: 720 };

/**
 * Extract YouTube video ID from URL
 * @param {string} url - YouTube URL
 * @returns {string|null} - Video ID or null if not found
 */
function extractYouTubeVideoId(url) {
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
        return null;
    }

    try {
        const urlObj = new URL(url);
        
        if (url.includes('youtube.com')) {
            return urlObj.searchParams.get('v');
        } else if (url.includes('youtu.be')) {
            return urlObj.pathname.substring(1);
        }
    } catch (e) {
        console.warn("Error parsing YouTube URL:", e.message);
    }
    
    return null;
}

/**
 * Capture YouTube thumbnail by video ID
 * @param {string} videoId - YouTube video ID
 * @param {string} outPath - Path to save the screenshot
 * @returns {boolean} - True if successful, false otherwise
 */
async function captureYouTubeThumbnail(videoId, outPath) {
    console.log(`Capturing thumbnail for YouTube video ID: ${videoId}`);
    
    const browser = await puppeteer.launch(BROWSER_CONFIG);
    const page = await browser.newPage();
    
    try {
        // Try highest quality thumbnail first
        const maxresUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        console.log(`Trying maxresdefault: ${maxresUrl}`);
        
        await page.goto(maxresUrl, { waitUntil: "networkidle2", timeout: 30000 });
        
        // Verify image quality
        const imageSize = await page.evaluate(() => {
            const img = document.querySelector('img');
            if (img) {
                return {
                    width: img.naturalWidth,
                    height: img.naturalHeight
                };
            }
            return null;
        });
        
        // Fall back to hqdefault if maxresdefault is not available or too small
        if (!imageSize || imageSize.width < 100 || imageSize.height < 100) {
            console.log("Falling back to hqdefault thumbnail");
            const hqUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
            await page.goto(hqUrl, { waitUntil: "networkidle2", timeout: 30000 });
        }
        
        await page.screenshot({ path: outPath });
        return true;
    } catch (err) {
        console.warn("Error capturing YouTube thumbnail:", err.message);
        return false;
    } finally {
        await browser.close();
    }
}

/**
 * Capture generic webpage screenshot
 * @param {string} url - URL to capture
 * @param {string} outPath - Path to save the screenshot
 */
async function captureWebpageScreenshot(url, outPath) {
    console.log(`Capturing webpage screenshot: ${url}`);
    
    const browser = await puppeteer.launch(BROWSER_CONFIG);
    const page = await browser.newPage();
    
    try {
        await page.setViewport(DEFAULT_VIEWPORT);
        await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
        
        // Allow time for dynamic content to load
        await new Promise(r => setTimeout(r, 3000));
        
        await page.screenshot({ path: outPath });
    } catch (err) {
        console.warn("Error capturing webpage screenshot:", err.message);
    } finally {
        await browser.close();
    }
}

/**
 * Take a screenshot of a URL, with special handling for YouTube videos
 * @param {string} url - URL to capture
 * @param {string} outPath - Path to save the screenshot
 */
export async function takeScreenshot(url, outPath) {
    // Try to handle as YouTube video first
    const videoId = extractYouTubeVideoId(url);
    
    if (videoId) {
        const success = await captureYouTubeThumbnail(videoId, outPath);
        if (success) {
            return;
        }
    }
    
    // Fall back to regular webpage screenshot
    await captureWebpageScreenshot(url, outPath);
}
