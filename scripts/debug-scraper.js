const scraper = require('../lib/scraper');

async function testIndex() {
    try {
        const index = await scraper.fetchIndex();
        
        const targets = ["Nippon India Growth", "HDFC Mid Cap"];
        targets.forEach(t => {
            console.log(`\nSearching RupeeVest for "${t}":`);
            const results = index.filter(f => f.s_name.toLowerCase().includes(t.toLowerCase()));
            results.forEach(r => console.log(` - ${r.s_name} (ID: ${r.schemecode})`));
        });

        const testName = "Nippon India Growth Mid Cap Fund - Direct Plan Growth Plan - Growth Option";
        console.log(`\nTesting matching for: "${testName}"`);
        const id = await scraper.findSchemeCode(testName);
        console.log(`Matched ID: ${id}`);

    } catch (e) {
        console.error(e);
    }
}

testIndex();
