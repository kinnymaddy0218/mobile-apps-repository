import { db } from './lib/firebase.js';
import { collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

async function dumpFunds() {
    try {
        console.log('Fetching funds from Firestore...');
        const snapshot = await getDocs(collection(db, 'category_rankings'));
        const allFunds = [];
        const seen = new Set();

        snapshot.forEach(doc => {
            const data = doc.data();
            const funds = data.funds || [];
            funds.forEach(f => {
                if (!seen.has(f.schemeCode)) {
                    seen.add(f.schemeCode);
                    allFunds.push({
                        schemeCode: f.schemeCode,
                        schemeName: f.schemeName
                    });
                }
            });
        });

        console.log(`Extracted ${allFunds.length} unique funds.`);
        fs.writeFileSync('lib/funds-full.json', JSON.stringify(allFunds));
        console.log('Saved to lib/funds-full.json');
        process.exit(0);
    } catch (e) {
        console.error('Firestore dump failed:', e);
        process.exit(1);
    }
}

dumpFunds();
