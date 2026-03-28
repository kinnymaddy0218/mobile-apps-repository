const scraper = require('../lib/scraper');
const cheerio = require('cheerio');

async function debugExpenseRatio() {
    const schemeId = '1492';
    const url = `https://www.rupeevest.com/Mutual-Funds-India/${schemeId}`;
    const res = await fetch(url, { headers: { 'User-Agent': scraper.userAgent } });
    const html = await res.text();
    const $ = cheerio.load(html);
    
    console.log("Checking all list items in fund-details-list:");
    $('.fund-details-list li').each((i, el) => {
        console.log(`- ${$(el).text().trim()}`);
    });
}
debugExpenseRatio();
