import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import scraper from '@/lib/scraper';
import pLimit from 'p-limit';
import { sendRefreshNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req) {
    const startTime = Date.now();
    const authHeader = req.headers.get('authorization');
    const { searchParams } = new URL(req.url);
    const cronSecret = process.env.CRON_SECRET;

    // Security check
    if (process.env.NODE_ENV === 'production' && cronSecret) {
        if (authHeader !== `Bearer ${cronSecret}` && searchParams.get('secret') !== cronSecret) {
            return new Response('Unauthorized', { status: 401 });
        }
    }

    try {
        console.log('[Cron] Initiating Portfolio Intelligence Refresh...');
        
        // 1. Fetch Priority Discovery Funds (Needs deep data)
        const discoverySnap = await adminDb.collection('fund_factsheets')
            .where('needsDiscovery', '==', true)
            .limit(10)
            .get();
        
        const priorityFunds = [];
        discoverySnap.forEach(snap => {
            const data = snap.data();
            priorityFunds.push({ 
                name: data.fundName, 
                schemeId: snap.id, 
                isDiscovery: true,
                lastChecked: 0 
            });
        });

        console.log(`[Cron] Found ${priorityFunds.length} priority discovery funds.`);

        // 2. Extract unique funds from user portfolios (for regular staleness check)
        const portfolioSnap = await adminDb.collection('user_portfolios').get();
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
        
        // 3. Determine staleness for portfolio funds (only if we have space left in the 10-batch)
        let stalestFunds = [...priorityFunds];
        
        if (stalestFunds.length < 10) {
            const fundsWithAge = await Promise.all(uniqueFunds.map(async (fund) => {
                try {
                    const schemeId = await scraper.findSchemeCode(fund.name);
                    if (!schemeId) return null;
                    
                    // Skip if already in priority list
                    if (priorityFunds.some(pf => pf.schemeId === schemeId.toString())) return null;

                    const cacheSnap = await adminDb.collection('fund_factsheets').doc(schemeId.toString()).get();
                    
                    if (!cacheSnap.exists) return { ...fund, schemeId, lastChecked: 0 };
                    
                    const data = cacheSnap.data();
                    const lastChecked = data.lastChecked ? new Date(data.lastChecked).getTime() : 0;
                    return { ...fund, schemeId, lastChecked };
                } catch (e) {
                    return null;
                }
            }));

            const filteredAndSorted = fundsWithAge
                .filter(Boolean)
                .sort((a, b) => a.lastChecked - b.lastChecked);
            
            stalestFunds = [...stalestFunds, ...filteredAndSorted].slice(0, 10);
        }

        console.log(`[Cron] Selected ${stalestFunds.length} funds for refresh (Priority: ${priorityFunds.length}).`);

        // 4. Execute Refreshes
        const limit = pLimit(2);
        const results = await Promise.all(stalestFunds.map(fund => limit(async () => {
            try {
                // pLimit(2) + 1s delay ensures we don't slam the source
                await new Promise(r => setTimeout(r, 1000));
                const factsheet = await scraper.getFactsheet(fund.name, true); // Force refresh
                return { name: fund.name, success: !!factsheet };
            } catch (e) {
                return { name: fund.name, success: false, error: e.message };
            }
        })));

        const successNames = results.filter(r => r.success).map(r => r.name);
        const summary = successNames.length > 0 
            ? `Refreshed: ${successNames.join(', ')}`
            : "No funds required refresh or all failed.";

        // 5. Send Notification
        await sendRefreshNotification({
            type: 'pulse',
            fundsProcessed: results.length,
            success: true,
            message: summary
        });

        return NextResponse.json({
            status: 'success',
            processed: results.length,
            refreshed: successNames,
            time: `${Date.now() - startTime}ms`
        });

    } catch (error) {
        console.error('[Cron] Critical failure:', error);
        
        await sendRefreshNotification({
            type: 'pulse',
            success: false,
            error: error.message
        });

        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
