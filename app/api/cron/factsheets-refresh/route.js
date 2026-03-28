import { NextResponse } from 'next/server';
import { AMC_CONFIG } from '@/lib/amc-config';
import scraper from '@/lib/scraper';
import { saveFactsheetToCache } from '@/lib/db/factsheets';
import pLimit from 'p-limit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Monthly Cron Job to refresh Factsheet Intelligence for all AMCs.
 * Triggers a scrape for representative funds to keep the cache and PDF hub fresh.
 */
export async function GET(request) {
    const startTime = Date.now();
    const limit = pLimit(3); // Scrape 3 AMCs at a time to avoid rate limits
    
    try {
        console.log("[Factsheet Cron] Starting monthly refresh...");
        
        // 1. Fetch Master List to find a fund for each AMC
        const mfapiRes = await fetch('https://api.mfapi.in/mf');
        const allFunds = await mfapiRes.json();
        
        if (!Array.isArray(allFunds)) throw new Error("Failed to fetch MFAPI master list");

        const amcList = Object.keys(AMC_CONFIG);
        const results = [];

        const processPromises = amcList.map(amcName => limit(async () => {
            try {
                // Find a flagship fund for this AMC (Direct Growth is best)
                const amcKeywords = amcName.split(' ')[0].toLowerCase();
                const repFund = allFunds.find(f => 
                    f.schemeName.toLowerCase().includes(amcKeywords) && 
                    f.schemeName.toLowerCase().includes('direct') && 
                    f.schemeName.toLowerCase().includes('growth')
                );

                if (!repFund) {
                    console.warn(`[Factsheet Cron] No representative fund found for ${amcName}`);
                    return { amc: amcName, status: 'no_fund_found' };
                }

                console.log(`[Factsheet Cron] Refreshing ${amcName} via fund: ${repFund.schemeName} (${repFund.schemeCode})`);
                
                // Scrape & Cache
                const data = await scraper.getFactsheet(repFund.schemeName);
                if (data) {
                    await saveFactsheetToCache(repFund.schemeCode, data);
                    return { amc: amcName, fund: repFund.schemeName, status: 'refreshed' };
                }
                
                return { amc: amcName, fund: repFund.schemeName, status: 'scrape_failed' };
            } catch (err) {
                console.error(`[Factsheet Cron] Error for ${amcName}:`, err.message);
                return { amc: amcName, status: 'error', message: err.message };
            }
        }));

        const processResults = await Promise.all(processPromises);
        
        // 2. Notifications
        try {
            const { sendRefreshNotification } = await import('@/lib/notifications');
            await sendRefreshNotification({
                category: "Monthly Factsheet Hub Refresh",
                fundsProcessed: processResults.filter(r => r.status === 'refreshed').length,
                success: true,
                message: `Processed ${processResults.length} AMCs. Refreshed: ${processResults.filter(r => r.status === 'refreshed').map(r => r.amc).join(', ')}`
            });
        } catch (notifierError) {
            console.warn("[Factsheet Cron] Notification failed:", notifierError.message);
        }

        return NextResponse.json({
            success: true,
            amcsProcessed: processResults.length,
            results: processResults,
            timeElapsed: `${Date.now() - startTime}ms`
        });

    } catch (error) {
        console.error("[Factsheet Cron] Global failure:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
