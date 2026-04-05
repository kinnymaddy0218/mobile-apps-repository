import { NextResponse } from 'next/server';
import { CATEGORIES } from '@/lib/categories';
import { computeFundMetrics } from '@/lib/calculations';
import { saveCategoryRankings, getCategoryRankings } from '@/lib/db/rankings';
import pLimit from 'p-limit';
import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const MFAPI_BASE = 'https://api.mfapi.in';

async function fetchFundNavs(schemeCode, retries = 2) {
    noStore();
    for (let i = 0; i <= retries; i++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
        try {
            const res = await fetch(`${MFAPI_BASE}/mf/${schemeCode}`, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (!res.ok) throw new Error("Not OK");
            const data = await res.json();
            if (!data || data.status === 'ERROR') throw new Error("MFAPI Error");
            return data.data || [];
        } catch (e) {
            clearTimeout(timeoutId);
            if (i === retries) return null; // Final failure
            // Wait 500ms before retrying
            await new Promise(r => setTimeout(r, 500));
        }
    }
    return null;
}

async function processCategory(categoryDef, allFunds, now) {
    const categoryFunds = allFunds.filter(f => {
        const name = (f.schemeName || '').toLowerCase();

        // Basic filters: Must be Direct and Growth (standard for performance tracking)
        if (!name.includes('direct')) return false;

        const isIndexPossible = name.includes('index') || name.includes('etf') || name.includes('nifty') || name.includes('sensex');

        // Growth purity
        if (!name.includes('growth') && !isIndexPossible) return false;

        const badWords = [
            'idcw', 'dividend', 'bonus', 'regular', 'income', 'payout', 
            'distribution', 'fund of funds', 'fof', 'discontinued', 
            'segregated', 'suspended', 'liquidated', 'defunct', 
            'merged', 'closed', 'matured', 'stopped', 'terminated'
        ];
        if (badWords.some(w => name.includes(w))) return false;

        // SEBI separation: Index funds should be in their own category
        if (categoryDef.key === 'index') {
            if (!isIndexPossible) return false;
        } else {
            // For other categories, exclude index funds to keep rankings meaningful
            if (isIndexPossible) return false;
        }

        // Category-specific keyword matching
        return categoryDef.keywords.some(kw => name.includes(kw));
    });

    if (categoryFunds.length === 0) return { category: categoryDef.label, count: 0 };

    const limit = pLimit(15);
    const fetchPromises = categoryFunds.map(fund =>
        limit(async () => {
            // Vercel Hobby Limit Safeguard: Stop processing if approaching 10s limit
            if (Date.now() - now > 8000) {
                console.warn(`[Cron] Approaching timeout. Skipping ${fund.schemeName}`);
                return null;
            }
            try {
                const navs = await fetchFundNavs(fund.schemeCode);
                if (!navs || navs.length < 2) return null;
                const metrics = computeFundMetrics(navs);
                if (!metrics || metrics.cagr['1yr'] === undefined) return null;

                // Stale NAV check: If no update in 14 days, consider it discontinued/inactive
                const lastNavDateParts = navs[0].date.split('-'); // DD-MM-YYYY
                const lastNavDate = new Date(lastNavDateParts[2], lastNavDateParts[1] - 1, lastNavDateParts[0]);
                const daysSinceUpdate = (now - lastNavDate.getTime()) / (1000 * 60 * 60 * 24);
                if (daysSinceUpdate > 14) return null;

                let dailyChange = 0;
                let dailyChangePercent = 0;
                if (navs.length >= 2) {
                    const todayNav = parseFloat(navs[0].nav);
                    const yesterdayNav = parseFloat(navs[1].nav);
                    if (yesterdayNav > 0) {
                        dailyChange = todayNav - yesterdayNav;
                        dailyChangePercent = (dailyChange / yesterdayNav) * 100;
                    }
                }

                return {
                    schemeCode: fund.schemeCode,
                    schemeName: fund.schemeName,
                    latestNav: parseFloat(navs[0].nav),
                    cagr: metrics.cagr,
                    risk: metrics.risk,
                    dailyChange,
                    dailyChangePercent
                };
            } catch (e) {
                return null;
            }
        })
    );

    let detailedFunds = await Promise.all(fetchPromises);
    detailedFunds = detailedFunds.filter(Boolean);

    await saveCategoryRankings(categoryDef.key, detailedFunds);

    try {
        const { saveRadarUpdates } = await import('@/lib/db/radar');
        const radarUpdates = [];
        detailedFunds.forEach(fund => {
            if (fund.risk && fund.risk.peakNav && fund.latestNav >= fund.risk.peakNav * 0.995) {
                radarUpdates.push({
                    type: 'new_high',
                    schemeCode: fund.schemeCode,
                    schemeName: fund.schemeName,
                    category: categoryDef.label,
                    message: `is trading near its all-time high!`,
                    evidence: `NAV: ${fund.latestNav.toFixed(2)} (Peak: ${fund.risk.peakNav.toFixed(2)})`,
                    severity: 'info',
                    timestamp: now
                });
            }
            if (fund.dailyChangePercent >= 2) {
                radarUpdates.push({
                    type: 'top_gainer',
                    schemeCode: fund.schemeCode,
                    schemeName: fund.schemeName,
                    category: categoryDef.label,
                    message: `jumped significantly today!`,
                    evidence: `Gain: ${fund.dailyChangePercent.toFixed(2)}%`,
                    severity: 'success',
                    timestamp: now
                });
            }
        });
        const limitedRadar = radarUpdates.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
        if (limitedRadar.length > 0) {
            await saveRadarUpdates(categoryDef.key, limitedRadar);
        }
    } catch (radarError) {
        console.error('Radar update failed:', radarError);
    }

    return { category: categoryDef.label, count: detailedFunds.length };
}

export async function GET(request) {
    const startTime = Date.now();
    const { searchParams } = new URL(request.url);
    const forceCategory = searchParams.get('category');
    const authHeader = request.headers.get('authorization');

    // Security check: Only allow authorized requests or Vercel's automated crons
    if (process.env.CRON_SECRET) {
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && searchParams.get('secret') !== process.env.CRON_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    try {
        console.log('[Rankings Cron] Starting master list fetch...');
        const allFundsRes = await fetch(`${MFAPI_BASE}/mf`);
        const allFunds = await allFundsRes.json();
        if (!Array.isArray(allFunds)) {
            console.error('[Rankings Cron] Master list format invalid:', allFunds);
            throw new Error('Failed to fetch master list: Format invalid');
        }
        console.log(`[Rankings Cron] Master list secured. Found ${allFunds.length} total schemes.`);

        const updatedCategories = [];

        if (forceCategory) {
            const catDef = CATEGORIES.find(c => c.key === forceCategory);
            if (catDef) {
                console.log(`Forcing refresh of category: ${catDef.label}`);
                const res = await processCategory(catDef, allFunds, startTime);
                updatedCategories.push(res);
            }
        } else {
            // Sort categories by staleness
            console.log('Fetching existing rankings to determine staleness...');
            const categoriesWithTime = await Promise.all(CATEGORIES.map(async (cat) => {
                try {
                    const data = await getCategoryRankings(cat.key);
                    const updatedTime = data?.lastUpdated?.toMillis ? data.lastUpdated.toMillis() : (data?.lastUpdated ? new Date(data.lastUpdated).getTime() : 0);
                    return { cat, updatedTime };
                } catch (e) {
                    return { cat, updatedTime: 0 };
                }
            }));

            const sortedCategories = categoriesWithTime.sort((a, b) => a.updatedTime - b.updatedTime);
            
            // On Hobby Plan (10s limit), we process ONLY ONE category per run to ensure reliability.
            // With a 2-hour schedule, all 18 categories will be refreshed every 36 hours.
            const stalest = sortedCategories[0];
            if (stalest) {
                console.log(`Stalest category identified: ${stalest.cat.label} (Last updated: ${new Date(stalest.updatedTime).toLocaleString()})`);
                const res = await processCategory(stalest.cat, allFunds, startTime);
                updatedCategories.push(res);
            }
        }

        const summary = updatedCategories.map(c => `${c.category} (${c.count} funds)`).join(', ');

        // Send a summary email even if we only did one category
        if (updatedCategories.length > 0) {
            const { sendRefreshNotification } = await import('@/lib/notifications');
            await sendRefreshNotification({
                type: 'rankings',
                category: updatedCategories.length === 1 ? updatedCategories[0].category : "Multiple Categories",
                fundsProcessed: updatedCategories.reduce((sum, c) => sum + c.count, 0),
                success: true,
                message: `Cron Success. ${summary}`
            });
        }

        return NextResponse.json({
            success: true,
            updated: updatedCategories,
            timeElapsed: `${Date.now() - startTime}ms`
        });

    } catch (error) {
        console.error('Cron job error:', error);
        
        // Notify of failure
        try {
            const { sendRefreshNotification } = await import('@/lib/notifications');
            await sendRefreshNotification({
                category: forceCategory || "Automated Refresh",
                success: false,
                error: error.message
            });
        } catch (emailErr) {
            console.error('Failed to send failure notification:', emailErr);
        }

        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
