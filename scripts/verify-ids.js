const https = require('https');

const CODES = [
    '120503', '118825', '119063', '120593', '119598', '120417', // Large
    '120505', '119062', '120153', '118668', '151524', // Mid
    '125354', '125497', '118777', '118966', '120164', '120849', // Small
    '122639', '118955', '120148', '151532', // Flexi
    '148961', '118651', '148972', // Multi
    '120468', '120843', '120166', // ELSS
    '130498', '120141', '120714'  // Large & Mid
];

async function getMeta(code) {
    return new Promise((resolve) => {
        https.get(`https://api.mfapi.in/mf/${code}`, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve({ code, name: json.meta.scheme_name, category: json.meta.scheme_category });
                } catch (e) {
                    resolve({ code, error: 'Parse error' });
                }
            });
        }).on('error', () => resolve({ code, error: 'Network error' }));
    });
}

async function run() {
    for (const code of CODES) {
        const meta = await getMeta(code);
        console.log(`${meta.code} | ${meta.name} | ${meta.category}`);
        await new Promise(r => setTimeout(r, 100));
    }
}

run();
