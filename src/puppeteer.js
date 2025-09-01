import puppeteer from "puppeteer";

export async function takeScreenshot(url, outPath) {
    const browser = await puppeteer.launch({
        headless: true,
        executablePath: "/usr/bin/chromium",
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--no-zygote"
        ]
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

    // Thử play video
    try {
        await page.evaluate(() => {
            const video = document.querySelector("video");
            if (video) video.play();
        });
        await new Promise(r => setTimeout(r, 2000));
    } catch (err) {
        console.warn("Video playback not verified:", err.message);
    }

    await page.screenshot({ path: outPath });
    await browser.close();
}
