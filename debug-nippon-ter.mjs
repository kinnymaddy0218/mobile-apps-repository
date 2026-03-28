
import fs from 'fs';

const text = fs.readFileSync('c:/Users/maddy/OneDrive/Documents/Antigravity/mf-research/nippon_full_dump.txt', 'utf8');

function findFund(name) {
    console.log(`\n--- Searching for ${name} ---`);
    const regex = new RegExp(name, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
        const idx = match.index;
        const snippet = text.substring(idx, idx + 15000);
        
        // Check if this is the dedicated fund page
        const isSuitabilityFound = /product\s+is\s+suitable\s+for\s+investors/i.test(snippet);
        const hasPortfolio = /PORTFOLIO|EQUITY|Holdings/i.test(snippet);
        
        if (isSuitabilityFound && hasPortfolio) {
            console.log(`FOUND dedicated page at index ${idx}`);
            const terMatch = snippet.match(/Total Expense Ratio\^?\s*[\s\S]{0,100}Direct(\d\.\d{2})/i);
            const regMatch = snippet.match(/Total Expense Ratio\^?\s*[\s\S]{0,100}Regular[^0-9]{0,50}(\d\.\d{2})/i);
            
            console.log(`  Direct: ${terMatch ? terMatch[1] : 'NOT FOUND'}`);
            console.log(`  Regular: ${regMatch ? regMatch[1] : 'NOT FOUND'}`);
            
            // Show snippet around TER
            const terIdx = snippet.search(/Total Expense Ratio/i);
            if (terIdx !== -1) {
                console.log(`  Context: ${snippet.substring(terIdx, terIdx + 150).replace(/\n/g, ' ')}`);
            }
            break;
        }
    }
}

findFund('Nippon India Small Cap');
findFund('Nippon India Growth'); 
findFund('Growth Fund');
