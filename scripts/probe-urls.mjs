import fetch from 'node-fetch';

const urls = [
    'https://www.kotakmf.com/Downloads/Factsheets/Monthly/MonthlyFactsheetFeb2026.pdf',
    'https://www.kotakmf.com/Downloads/Factsheets/Monthly/MonthlyFactsheetFebruary2026.pdf',
    'https://www.kotakmf.com/Downloads/Factsheets/Monthly/MonthlyFactsheetFeb_2026.pdf',
    'https://www.kotakmf.com/Downloads/Factsheets/Monthly/MonthlyFactsheet_Feb_2026.pdf',
    'https://mutualfund.adityabirlacapital.com/-/media/Feature/ABSLMF/Factsheet/Latest/Factsheet_Feb_2026.pdf',
    'https://mutualfund.adityabirlacapital.com/-/media/Feature/ABSLMF/Factsheet/Monthly/Factsheet_Feb_2026.pdf',
    'https://mutualfund.adityabirlacapital.com/-/media/Feature/ABSLMF/Factsheet/Latest/Factsheet_February_2026.pdf'
];

async function probe() {
    for (const url of urls) {
        try {
            const res = await fetch(url, { method: 'HEAD', timeout: 5000 });
            console.log(`${res.status} - ${url}`);
        } catch (e) {
            console.log(`ERROR - ${url}: ${e.message}`);
        }
    }
}

probe();
