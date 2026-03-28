const admin = require('firebase-admin');

// Use the service account if available, otherwise assume emulator or default
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'mf-research-india-b9c14'
    });
}

const db = admin.firestore();

async function checkRankings() {
    console.log('--- Checking Category Rankings for Gainers/Losers ---');
    const snapshot = await db.collection('category_rankings').get();

    let allFunds = [];
    snapshot.forEach(doc => {
        const data = doc.data();
        if (data.funds) {
            allFunds.push(...data.funds);
        }
    });

    console.log(`Total funds found: ${allFunds.length}`);

    const gainers = allFunds
        .filter(f => f.dailyChangePercent > 0)
        .sort((a, b) => b.dailyChangePercent - a.dailyChangePercent)
        .slice(0, 5);

    const losers = allFunds
        .filter(f => f.dailyChangePercent < 0)
        .sort((a, b) => a.dailyChangePercent - b.dailyChangePercent)
        .slice(0, 5);

    console.log('\nTop Gainers (Daily):');
    gainers.forEach(f => console.log(`${f.schemeName}: ${f.dailyChangePercent?.toFixed(2)}%`));

    console.log('\nTop Losers (Daily):');
    losers.forEach(f => console.log(`${f.schemeName}: ${f.dailyChangePercent?.toFixed(2)}%`));

    // Also check for huge outliers mentioned by user (300%+)
    const outliers = allFunds.filter(f => Math.abs(f.dailyChangePercent) > 50);
    if (outliers.length > 0) {
        console.log('\n⚠️ Potential Data Outliers (>50% move):');
        outliers.forEach(f => console.log(`${f.schemeName}: ${f.dailyChangePercent?.toFixed(2)}%`));
    } else {
        console.log('\nNo daily outliers (>50%) found.');
    }
}

checkRankings().catch(console.error);
