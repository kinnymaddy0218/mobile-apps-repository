import scraper from './lib/scraper.js';

async function debug() {
    try {
        console.log("🔍 Debugging Scraper...");
        const data = await scraper.getFactsheet("HDFC Top 100 Fund");
        console.log("✅ Success!", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("❌ FAILED:", e);
    }
}

debug();
