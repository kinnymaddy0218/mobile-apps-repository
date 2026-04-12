import { NextResponse } from 'next/server';
import scraper from '@/lib/scraper';
import { sendRefreshNotification } from '@/lib/notifications';
import { db } from '@/lib/firebase';
import { collection, getCountFromServer } from 'firebase/firestore';

/**
 * 🛰️ Institutional Discovery Engine: Processing fund universe in rolling batches.
 * Security: Requires CRON_SECRET header for execution.
 */
export async function GET(request) {
    const authHeader = request.headers.get('Authorization');
    const secret = process.env.CRON_SECRET;

    // 🛡️ Security Guard
    if (secret && authHeader !== `Bearer ${secret}`) {
        console.warn("[Cron] Unauthorized attempt to trigger Discovery Engine.");
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const startTime = Date.now();
    console.log("[Cron] Starting Global Discovery Pulse (Institutional v4.2)...");

    try {
        // A. Institutional Market Coverage Stats
        const allFunds = await scraper.fetchIndex();
        const totalIndex = allFunds?.length || 4000;
        const countSnap = await getCountFromServer(collection(db, 'fund_factsheets'));
        const totalCached = countSnap.data().count;
        const coveragePct = (totalCached / totalIndex) * 100;

        // 1. Institutional Dynamic Batching: Accelerating during Night Hours (IST)
        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istDate = new Date(now.getTime() + istOffset);
        const istHour = istDate.getHours();
        
        // 🛡️ Night Window (IST 18:00 to 08:59): Targeting 40 funds/batch for rapid 10-day coverage
        // ☀️ Day Window (IST 09:00 to 17:59): Targeting 15 funds/batch for stealth & stability
        const isNight = istHour >= 18 || istHour < 9;
        
        // Allow manual override via query param for troubleshooting
        const urlBatch = request.nextUrl?.searchParams?.get('batchSize');
        const batchSize = Number(urlBatch) || (isNight ? 40 : 15);
        
        console.log(`[Cron] Discovery Pulse Context: IST Hour ${istHour}, isNight: ${isNight}, Target Batch: ${batchSize}`);
        const queue = await scraper.getDiscoveryQueue(batchSize);

        if (!queue || queue.length === 0) {
            console.log("[Cron] Discovery Queue is empty. Market coverage is currently 100%.");
            return NextResponse.json({ 
                status: 'idle', 
                message: 'No funds need discovery' 
            });
        }

        console.log(`[Cron] Processing batch of ${queue.length} funds...`);

        // 2. Parallel Processing with Institutional Resilience
        const results = await Promise.all(queue.map(async (fund) => {
            try {
                // We use 'force=true' to ensure we get a fresh scrape, 
                // but scraper.getFactsheet is smart enough to use dbOnly if we want.
                // For Cron, we WANT a fresh scrape to update the cache.
                const factsheet = await scraper.getFactsheet(fund.fundName, true, false, false, fund.instId);
                
                return {
                    id: fund.instId,
                    name: fund.fundName,
                    priority: fund.priority,
                    success: !!factsheet?.holdings?.length,
                    stocks: factsheet?.holdings?.length || 0,
                    data: factsheet
                };
            } catch (err) {
                return {
                    id: fund.instId,
                    name: fund.fundName,
                    priority: fund.priority,
                    success: false,
                    error: err.message
                };
            }
        }));

        const summary = {
            total: results.length,
            success: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            duration: `${((Date.now() - startTime) / 1000).toFixed(1)}s`,
            coveragePct
        };

        // B. Identify Batch Highlights (Top Intelligence)
        const batchSorted = results
            .filter(r => r.success && r.data)
            .map(r => r.data);

        const batchHighlights = [];
        
        // 1. Stock Depth Leader
        const depthLeader = [...batchSorted].sort((a, b) => (b.holdings?.length || 0) - (a.holdings?.length || 0))[0];
        if (depthLeader) batchHighlights.push({ 
            name: depthLeader.fundName, 
            stocks: depthLeader.holdings?.length || 0, 
            priority: 'DEPTH' 
        });

        // 2. Performance Leader (3yr CAGR)
        const perfLeader = [...batchSorted].sort((a, b) => (b.performance?.cagr_3yr || 0) - (a.performance?.cagr_3yr || 0))[0];
        if (perfLeader && perfLeader.performance?.cagr_3yr > 0) batchHighlights.push({
            name: perfLeader.fundName,
            stocks: `${perfLeader.performance.cagr_3yr.toFixed(1)}% CAGR`,
            priority: 'ALPHA'
        });

        // 3. Risk Efficiency Leader (Sharpe)
        const riskLeader = [...batchSorted].sort((a, b) => (b.performance?.sharpe || 0) - (a.performance?.sharpe || 0))[0];
        if (riskLeader && riskLeader.performance?.sharpe > 0) batchHighlights.push({
            name: riskLeader.fundName,
            stocks: `Sharpe: ${riskLeader.performance.sharpe.toFixed(2)}`,
            priority: 'SHARPE'
        });

        console.log(`[Cron] Discovery Pulse Complete: ${summary.success}/${summary.total} successful. Market Coverage: ${coveragePct.toFixed(1)}%`);

        // 3. ✉️ Enriched Institutional Notification
        await sendRefreshNotification({
            type: 'discovery',
            fundsProcessed: summary.total,
            success: summary.success > 0,
            coveragePct: coveragePct,
            batchHighlights: batchHighlights,
            message: `Discovery cycle complete across ${summary.total} funds. Universe integrity has reached ${coveragePct.toFixed(1)}%.`
        });

        return NextResponse.json({
            status: 'completed',
            summary,
            results
        });

    } catch (error) {
        console.error("[Cron] Critical Discovery Failure:", error.message);
        return NextResponse.json({ 
            status: 'error', 
            error: error.message 
        }, { status: 500 });
    }
}
