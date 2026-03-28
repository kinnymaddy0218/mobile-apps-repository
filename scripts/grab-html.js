const scraper = require('../lib/scraper');
const fs = require('fs');

async function grabHtml() {
    const schemeId = '1492';
    const url = `https://www.rupeevest.com/Mutual-Funds-India/${schemeId}`;
    const res = await fetch(url, { headers: { 'User-Agent': scraper.userAgent } });
    const html = await res.text();
    fs.writeFileSync('rv_sample.html', html);
    console.log("Saved rv_sample.html. Grepping for 'Expense Ratio'...");
}
grabHtml();
