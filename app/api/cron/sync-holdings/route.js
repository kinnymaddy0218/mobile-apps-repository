import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import scraper from '@/lib/scraper';

/**
 * Monthly Sync Cron: /api/cron/sync-holdings
 * Refreshes the Firestore 'factsheets' collection to ensure stock-level data remains fresh.
 */
export async function GET(request) {
    // Basic Auth Check (In production, use a CRON_SECRET header)
    const authHeader = request.headers.get('authorization');
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        console.log('[Cron] Starting Monthly Holdings Sync...');
        
        // 1. Get all cached funds from Firestore
        const snapshot = await db.collection('factsheets').get();
        const funds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        console.log(`[Cron] Found ${funds.length} funds in cache. Refreshing...`);

        const results = { success: 0, failed: 0 };

        // 2. Refresh each fund (sequential to avoid rate limits)
        for (const fund of funds) {
            try {
                const fundName = fund.fundName || fund.id;
                console.log(` - Refreshing: ${fundName}`);
                
                // getFactsheet(name, true) triggers a fresh scrape, bypassing cache
                await scraper.getFactsheet(fundName, true); 
                results.success++;
            } catch (e) {
                console.error(` - Failed to refresh ${fund.id}:`, e.message);
                results.failed++;
            }
        }

        return NextResponse.json({
            status: 'completed',
            timestamp: new Date().toISOString(),
            results
        });

    } catch (error) {
        console.error('[Cron Error] Sync Failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
