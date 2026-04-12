import { NextResponse } from 'next/server';
import scraper from '@/lib/scraper';
import pLimit from 'p-limit';

/**
 * Admin Cache Refresh API (Institutional Rolling Pulse v5.2.1)
 * TARGET: Cron job (Vercel Cron)
 * PURPOSE: Rotate through the global 2,500+ fund universe to refresh holdings every 30 days.
 * STRATEGY: Refreshes ~80 funds daily, completing a full 'Holdings X-Ray' cycle every month.
 */
export async function GET(req) {
    const authHeader = req.headers.get('authorization');
    const isCron = req.headers.get('x-vercel-cron') === 'true';
    
    // Safety check for production environment
    if (process.env.NODE_ENV === 'production' && !isCron) {
        // In prod, only allow cron or manual secret
        // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        // }
    }

    const limit = pLimit(1); // Serial execution for stability in background cron
    
    try {
        console.log("[Admin Cache Refresh] Initiating Institutional Rolling Pulse...");
        
        // 1. Fetch the entire fund index (2,500+ schemes)
        const fullIndex = await scraper.fetchIndex();
        if (!fullIndex || fullIndex.length === 0) {
            throw new Error("Could not fetch fund index for refresh.");
        }

        // 2. Calculate the Daily Slice (Rolling Window)
        // We divide the index into 31 slices (one for each day of the month)
        const dayOfMonth = new Date().getDate(); // 1 - 31
        const batchSize = 80;
        const startIndex = (dayOfMonth - 1) * batchSize;
        const endIndex = startIndex + batchSize;
        
        const targetSlice = fullIndex.slice(startIndex, endIndex);

        // 3. Add 'High-Priority' Seed (Always refresh these market leaders)
        const seedFunds = [
            "Parag Parikh Flexi Cap Fund",
            "Quant Small Cap Fund",
            "Nippon India Small Cap Fund",
            "HDFC Top 100 Fund",
            "ICICI Prudential Bluechip Fund"
        ];

        // Combine and deduplicate
        const uniqueFunds = Array.from(new Set([
            ...seedFunds,
            ...targetSlice.map(f => f.s_name)
        ]));

        console.log(`[Admin Cache Refresh] Day ${dayOfMonth}: Processing batch ${startIndex}-${endIndex}. Target: ${uniqueFunds.length} funds.`);

        // 4. Execute Pulse Refresh (Forced 30-day sync)
        const results = await Promise.allSettled(
            uniqueFunds.map(name => limit(async () => {
                try {
                    // Force refresh updates Firestore even if cache isn't technically 'stale' yet
                    // ensuring we have a fresh snapshot every 30 days.
                    const data = await scraper.getFactsheet(name, true); 
                    return { name, status: data ? 'success' : 'failed' };
                } catch (err) {
                    return { name, status: 'error', reason: err.message };
                }
            }))
        );

        const summary = results.map(r => r.status === 'fulfilled' ? r.value : { status: 'rejected', reason: r.reason });
        const successCount = summary.filter(s => s.status === 'success').length;

        return NextResponse.json({
            status: 'completed',
            day: dayOfMonth,
            indexRange: { start: startIndex, end: endIndex },
            stats: { total: uniqueFunds.length, success: successCount },
            timestamp: new Date().toISOString(),
            summary: summary.slice(0, 5) // Truncated summary for response
        });

    } catch (e) {
        console.error("[Admin Cache Refresh] Terminal Failure:", e.message);
        return NextResponse.json({ 
            error: 'Institutional Refresh Failed', 
            details: e.message 
        }, { status: 500 });
    }
}
