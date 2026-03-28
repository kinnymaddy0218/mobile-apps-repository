import fs from 'fs';

async function fetchAll() {
    try {
        console.log('Fetching all mutual funds from mfapi.in...');
        const res = await fetch('https://api.mfapi.in/mf');
        if (!res.ok) throw new Error('API down');
        const data = await res.json();
        console.log(`Successfully fetched ${data.length} funds.`);
        fs.writeFileSync('lib/funds-full.json', JSON.stringify(data));
        console.log('Saved to lib/funds-full.json');
    } catch (e) {
        console.error('Fetch failed:', e.message);
    }
}

fetchAll();
