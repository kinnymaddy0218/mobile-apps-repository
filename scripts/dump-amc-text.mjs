// scripts/dump-amc-text.mjs
import fs from 'fs';
import pdf from 'pdf-parse';
import fetch from 'node-fetch';

const AMCS = [
    { name: 'UTI', url: 'https://www.utimf.com/-/media/uti-mutual-fund/forms-and-downloads/statutory-disclosures/monthly-factsheet/uti-mf-monthly-factsheet-february-2026.pdf' },
    { name: 'ABSL', url: 'https://mutualfund.adityabirlacapital.com/-/media/bsl/files/resources/factsheets/2026/abslmf-empower_feb26.pdf' },
    { name: 'Axis', url: 'Axis Fund Factsheet February 2026.pdf' }
];

async function dump() {
    for (const amc of AMCS) {
        console.log(`Dumping ${amc.name}...`);
        try {
            let buffer;
            if (amc.url.startsWith('http')) {
                const res = await fetch(amc.url, {
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                });
                buffer = await res.arrayBuffer();
            } else {
                buffer = fs.readFileSync(amc.url);
            }
            
            const data = await pdf(Buffer.from(buffer));
            fs.writeFileSync(`${amc.name}_dump.txt`, data.text);
            console.log(`Saved to ${amc.name}_dump.txt (Length: ${data.text.length})`);
        } catch (err) {
            console.error(`Failed ${amc.name}: ${err.message}`);
        }
    }
}

dump();
