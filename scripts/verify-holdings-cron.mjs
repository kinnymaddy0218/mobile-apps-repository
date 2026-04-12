/**
 * Verification Script: Holdings Pulse Refresh Logic
 * This script tests the stalest-first batching and notification logic 
 * by simulating the refresh-holdings cron job locally.
 */
import { db } from '../lib/firebase.js';
import scraper from '../lib/scraper.js';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { sendRefreshNotification } from '../lib/notifications.js';

async function runVerification() {
    console.log('--- Phase 1: Portfolio Discovery ---');
    const portfolioSnap = await getDocs(collection(db, 'user_portfolios'));
    const fundMap = new Map();
    
    portfolioSnap.forEach(snap => {
        const data = snap.data();
        if (data.funds) {
            data.funds.forEach(f => {
                if (f.schemeName) fundMap.set(f.schemeName, f.schemeCode);
            });
        }
    });

    const uniqueFunds = Array.from(fundMap.entries()).map(([name, code]) => ({ name, code }));
    console.log(`Found ${uniqueFunds.length} unique funds across portfolios.`);

    console.log('\n--- Phase 2: Staleness Analysis ---');
    const fundsWithAge = await Promise.all(uniqueFunds.map(async (fund) => {
        try {
            const schemeId = await scraper.findSchemeCode(fund.name);
            if (!schemeId) return { ...fund, lastChecked: 0 };
            
            const cacheRef = doc(db, 'fund_factsheets', schemeId.toString());
            const cacheSnap = await getDoc(cacheRef);
            
            if (!cacheSnap.exists()) return { ...fund, schemeId, lastChecked: 0 };
            
            const data = cacheSnap.data();
            const lastCheckedStr = data.lastChecked || '0';
            const lastChecked = new Date(lastCheckedStr).getTime();
            return { ...fund, schemeId, lastChecked, lastCheckedStr };
        } catch (e) {
            return { ...fund, lastChecked: 0 };
        }
    }));

    const stalest = fundsWithAge
        .sort((a, b) => a.lastChecked - b.lastChecked)
        .slice(0, 3); // Test with 3

    console.log('Top 3 Stalest Funds:');
    stalest.forEach(f => {
        console.log(`- ${f.name} (Last Checked: ${f.lastCheckedStr || 'Never'})`);
    });

    console.log('\n--- Phase 3: Notification Dry-Run ---');
    if (!process.env.RESEND_API_KEY) {
        console.log('RESEND_API_KEY missing - Simulation only.');
    } else {
        await sendRefreshNotification({
            type: 'pulse',
            fundsProcessed: stalest.length,
            success: true,
            message: `TEST: Refreshed holdings for ${stalest.map(f => f.name).join(', ')}`
        });
        console.log('Notification sent successfully.');
    }

    console.log('\n--- Verification Complete ---');
    process.exit(0);
}

runVerification().catch(err => {
    console.error('Verification failed:', err);
    process.exit(1);
});
