// scripts/check-urls.mjs - checks all directUrl entries in amc-config.js
const URLS = {
    'SBI Mutual Fund': 'https://www.sbimf.com/docs/default-source/factsheets/all-sbimf-schemes-factsheet-february-2026.pdf',
    'Nippon India': 'https://mf.nipponindiaim.com/InvestorServices/FactSheets/Nippon-FS-Feb-2026.pdf',
    'ICICI Prudential': 'https://www.icicipruamc.com/blob/knowledgecentre/factsheet-complete/Complete.pdf',
    'Kotak': 'https://www.kotakmf.com/Downloads/Factsheets/Monthly/MonthlyFactsheetFeb2026.pdf',
    'Quant': 'https://quantmutual.com/downloads/factsheets/Quant_Factsheet_February_2026.pdf',
    'Axis': 'https://www.axismf.com/docs/default-source/monthly-factsheet/monthly-factsheet---february-2026.pdf',
    'Tata': 'https://www.tatamutualfund.com/Pdf/Factsheet/Tata_Mutual_Fund_Factsheet_Feb_2026.pdf',
    'ABSL': 'https://mutualfund.adityabirlacapital.com/-/media/Feature/ABSLMF/Factsheet/Latest/Factsheet_Feb_2026.pdf',
    'Motilal Oswal': 'https://www.motilaloswalmf.com/Pdf/Factsheet/Motilal-Oswal-Mutual-Fund-Factsheet-Feb_2026.pdf',
    'Invesco': 'https://invescomutualfund.com/docs/default-source/factsheet/invesco-mf-factsheet---february-2026.pdf',
    'Edelweiss': 'https://www.edelweissmf.com/investor-service/downloads/factsheets/Factsheet-February-2026.pdf',
    'Bandhan': 'https://bandhanmutual.com/download/factsheet/February_2026.pdf',
    'LIC': 'https://www.licmf.com/pdf/Factsheet/LIC_MF_Factsheet_February_2026.pdf',
};

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/pdf,*/*',
};

async function checkUrl(name, url) {
    try {
        const res = await fetch(url, { method: 'HEAD', headers: HEADERS, signal: AbortSignal.timeout(12000), redirect: 'follow' });
        const ct = res.headers.get('content-type') || '';
        const isPdf = ct.includes('pdf') || url.endsWith('.pdf');
        const status = res.status === 200 ? (isPdf ? '✅ 200 OK (PDF)' : `⚠️  200 OK (${ct.substring(0,30)})`) : `❌ ${res.status}`;
        console.log(`${name.padEnd(20)}: ${status}`);
    } catch (e) {
        console.log(`${name.padEnd(20)}: ❌ ERROR - ${e.message.substring(0, 60)}`);
    }
}

console.log('Checking all factsheet URLs...\n');
await Promise.all(Object.entries(URLS).map(([name, url]) => checkUrl(name, url)));
console.log('\nDone.');
