import scraper from '../lib/scraper.js';
import pLimit from 'p-limit';

/**
 * Global Cache Refresher
 * Use this to warm up the Firestore DB with all fund holdings.
 * Usage: node scripts/refresh-cache.js [--force]
 */
async function refreshAll() {
    const force = process.argv.includes('--force');
    const limit = pLimit(2); // Keep it slow to be safe
    
    try {
        console.log("🚀 Starting Fund Cache Refresh...");
        const index = await scraper.fetchIndex();
        console.log(`📊 Found ${index.length} funds in global index.`);

        const tasks = index.map((fund, i) => limit(async () => {
            const name = fund.s_name;
            const rvId = fund.schemecode;

            try {
                // If not force, getFromCache already checks TTL
                if (!force) {
                    const existing = await scraper.getFromCache(rvId);
                    if (existing) {
                        // console.log(`[${i+1}/${index.length}] Skipping fresh fund: ${name}`);
                        return;
                    }
                }

                console.log(`[${i+1}/${index.length}] Refreshing: ${name}...`);
                await scraper.getFactsheet(name); // This will trigger a live scrape and save
                
                // Add a small jitter to avoid detection/rate-limit
                await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));
            } catch (err) {
                console.error(`❌ Failed to refresh ${name}:`, err.message);
            }
        }));

        await Promise.all(tasks);
        console.log("✅ Cache Refresh Complete!");
        process.exit(0);
    } catch (error) {
        console.error("💥 Critical Failure during refresh:", error);
        process.exit(1);
    }
}

refreshAll();
