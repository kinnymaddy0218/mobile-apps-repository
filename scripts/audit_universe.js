
import { db } from './lib/firebase.js';
import { collection, getDocs, query, where } from 'firebase/firestore';

async function auditUniverse() {
    console.log("🔍 Starting Institutional Universe Audit...");
    
    // 1. Total Scanned
    const allSnap = await getDocs(collection(db, 'fund_factsheets'));
    const totalScanned = allSnap.size;
    
    // 2. Successful Holdings
    const holdingsSnap = await getDocs(query(collection(db, 'fund_factsheets'), where('holdings', '!=', [])));
    const successful = holdingsSnap.size;
    
    // 3. Needs Discovery (Failures)
    const failedSnap = await getDocs(query(collection(db, 'fund_factsheets'), where('needsDiscovery', '==', true)));
    const failed = failedSnap.size;

    console.log("-----------------------------------------");
    console.log(`📈 Total Funds Scanned: ${totalScanned}`);
    console.log(`✅ Success (Holdings Secured): ${successful}`);
    console.log(`⚠️ Discovery Queue (Pending/Failed): ${failed}`);
    console.log(`📊 Universe Coverage: ${((successful / 4000) * 100).toFixed(2)}%`);
    console.log("-----------------------------------------");
    
    process.exit(0);
}

auditUniverse();
