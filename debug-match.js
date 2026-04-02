import scraper from './lib/scraper.js';

async function testMatch() {
    try {
        console.log("🔍 Testing name matching...");
        const names = [
            "Nippon India Growth Mid Cap Fund - Direct Plan Growth Plan - Growth Option",
             "HDFC Mid Cap Fund - Growth Option - Direct Plan"
        ];
        
        for (const name of names) {
            const id = await scraper.findSchemeCode(name);
            console.log(` - "${name}" => ID: ${id}`);
        }
    } catch (e) {
        console.error("❌ FAILED:", e);
    }
}

testMatch();
