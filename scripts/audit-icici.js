const scraper = require('../lib/scraper');

async function auditICICI() {
    const index = await scraper.fetchIndex();
    const ICICIMatches = index.filter(f => 
        f.s_name.toLowerCase().includes("icici") && 
        f.s_name.toLowerCase().includes("value")
    );
    console.log("ICICI Value Matches:");
    ICICIMatches.forEach(m => console.log(`- ${m.s_name} (ID: ${m.schemecode})`));
}
auditICICI();
