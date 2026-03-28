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

    try {
        const allFundsRes = await fetch(`${MFAPI_BASE}/mf`);
        const allFunds = await allFundsRes.json();
        if (!Array.isArray(allFunds)) throw new Error('Failed to fetch master list');

        const updatedCategories = [];

        if (forceCategory) {
            const catDef = CATEGORIES.find(c => c.key === forceCategory);
            if (catDef) {
                const res = await processCategory(catDef, allFunds, startTime);
                updatedCategories.push(res);
            }
        } else {
            // Sort categories by staleness
            const categoriesWithTime = await Promise.all(CATEGORIES.map(async (cat) => {
                const data = await getCategoryRankings(cat.key);
                const updatedTime = data?.lastUpdated?.toMillis ? data.lastUpdated.toMillis() : (data?.lastUpdated ? new Date(data.lastUpdated).getTime() : 0);
                return { cat, updatedTime };
            }));

            const sortedCategories = categoriesWithTime.sort((a, b) => a.updatedTime - b.updatedTime);

            for (const { cat } of sortedCategories) {
                // If we've already spent more than 10 seconds, stop to avoid Vercel timeout
                if (Date.now() - startTime > 10000) {
                    console.log(`Stopping cron due to time limit. Processed ${updatedCategories.length} categories.`);
                    break;
                }

                console.log(`Processing category: ${cat.label}`);
                const res = await processCategory(cat, allFunds, startTime);
                updatedCategories.push(res);
            }
        }

        const summary = updatedCategories.map(c => `${c.category} (${c.count} funds)`).join(', ');

        // Send a single summary email
        const { sendRefreshNotification } = await import('@/lib/notifications');
        await sendRefreshNotification({
            category: updatedCategories.length === 1 ? updatedCategories[0].category : "Multiple Categories",
            fundsProcessed: updatedCategories.reduce((sum, c) => sum + c.count, 0),
            success: true,
            message: `Updated: ${summary}`
        });

        return NextResponse.json({
            success: true,
            updated: updatedCategories,
            timeElapsed: `${Date.now() - startTime}ms`
        });

    } catch (error) {
        console.error('Cron job error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
