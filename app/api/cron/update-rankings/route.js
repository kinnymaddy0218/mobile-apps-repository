import { NextResponse } from 'next/server';
import { CATEGORIES } from '@/lib/categories';
import { computeFundMetrics } from '@/lib/calculations';
import { updateCategoryRankingsBatch, getAllCategoryRankings } from '@/lib/db/rankings';
import { sendRefreshNotification } from '@/lib/notifications';
import pLimit from 'p-limit';
import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const MFAPI_BASE = 'https://api.mfapi.in';

async function fetchFundNavs(schemeCode, retries = 1) {
    noStore();
    for (let i = 0; i <= retries; i++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout per fund
        try {
            const res = await fetch(`${MFAPI_BASE}/mf/${schemeCode}`, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (!res.ok) throw new Error("Not OK");
            const data = await res.json();
            if (!data || data.status === 'ERROR') throw new Error("MFAPI Error");
            return data.data || [];
        } catch (e) {
            clearTimeout(timeoutId);
            if (i === retries) return null;
            await new Promise(r => setTimeout(r, 200));
        }
    }
    return null;
}

export async function GET(request) {
    const startTime = Date.now();
    const { searchParams } = new URL(request.url);
    const authHeader = request.headers.get('authorization');

    // Security check
    if (process.env.CRON_SECRET) {
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && searchParams.get('secret') !== process.env.CRON_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    try {
        console.log('[Rankings Cron] Fetching master list & current rankings state...');
        const [allFundsRes, existingRankings] = await Promise.all([
            fetch(`${MFAPI_BASE}/mf`),
            getAllCategoryRankings()
        ]);
        
        const allFundsMaster = await allFundsRes.json();
        if (!Array.isArray(allFundsMaster)) throw new Error('Invalid master list');

        // Map existing data to find stalest funds
        const fundMetaMap = new Map();
        existingRankings.forEach(cat => {
            const lastUpdated = cat.lastUpdated?.toMillis ? cat.lastUpdated.toMillis() : (cat.lastUpdated ? new Date(cat.lastUpdated).getTime() : 0);
            (cat.funds || []).forEach(f => {
                fundMetaMap.set(f.schemeCode.toString(), { lastUpdated, categoryId: cat.id });
            });
        });

        // Filter and Flatten all target funds across all categories
        const targetFunds = [];
        CATEGORIES.forEach(catDef => {
            const catFunds = allFundsMaster.filter(f => {
                const name = (f.schemeName || '').toLowerCase();
                if (!name.includes('direct') || !name.includes('growth')) return false;
                const isIndex = name.includes('index') || name.includes('etf') || name.includes('nifty') || name.includes('sensex');
                if (catDef.key === 'index') return isIndex;
                if (isIndex) return false;
                return catDef.keywords.some(kw => name.includes(kw));
            });

            catFunds.forEach(f => {
                const meta = fundMetaMap.get(f.schemeCode.toString());
                targetFunds.push({
                    ...f,
                    categoryId: catDef.key,
                    categoryLabel: catDef.label,
                    lastUpdated: meta ? meta.lastUpdated : 0
                });
            });
        });

        // Sort by staleness (oldest first)
        const staleFunds = targetFunds.sort((a, b) => a.lastUpdated - b.lastUpdated).slice(0, 25);
        console.log(`[Rankings Cron] Processing batch of ${staleFunds.length} stale funds.`);

        const limit = pLimit(8); // Higher concurrency for small batch
        const processedBatch = await Promise.all(staleFunds.map(fund => 
            limit(async () => {
                // Safeguard for 10s total limit
                if (Date.now() - startTime > 8500) return null;

                const navs = await fetchFundNavs(fund.schemeCode);
                if (!navs || navs.length < 2) return null;
                const metrics = computeFundMetrics(navs);
                if (!metrics || metrics.cagr['1yr'] === undefined) return null;

                let dailyChange = 0;
                let dailyChangePercent = 0;
                const todayNav = parseFloat(navs[0].nav);
                const yesterdayNav = parseFloat(navs[1].nav);
                if (yesterdayNav > 0) {
                    dailyChange = todayNav - yesterdayNav;
                    dailyChangePercent = (dailyChange / yesterdayNav) * 100;
                }

                return {
                    schemeCode: fund.schemeCode,
                    schemeName: fund.schemeName,
                    categoryId: fund.categoryId,
                    categoryLabel: fund.categoryLabel,
                    latestNav: todayNav,
                    cagr: metrics.cagr,
                    risk: metrics.risk,
                    dailyChange,
                    dailyChangePercent
                };
            })
        ));

        const validFunds = processedBatch.filter(Boolean);
        
        // Group by category for saving
        const byCategory = {};
        validFunds.forEach(f => {
            if (!byCategory[f.categoryId]) byCategory[f.categoryId] = [];
            byCategory[f.categoryId].push(f);
        });

        // Batch update Firestore - Optimized with pre-fetched data & Change Detection
        const saveResults = await Promise.all(Object.entries(byCategory).map(([catId, funds]) => {
            const existingCat = existingRankings.find(c => c.id === catId);
            const existingCatFunds = existingCat ? (existingCat.funds || []) : [];
            
            // Critical Quota Mitigation: Check if any fund in this batch actually represents a change
            const hasChanges = funds.some(newFund => {
                const existing = existingCatFunds.find(ef => ef.schemeCode === newFund.schemeCode);
                if (!existing) return true;
                // Only write if NAV or performance has shifted
                return existing.latestNav !== newFund.latestNav || 
                       JSON.stringify(existing.cagr) !== JSON.stringify(newFund.cagr);
            });

            if (!hasChanges) {
                console.log(`[Rankings Cron] Skipping ${catId} update - no data drift detected.`);
                return Promise.resolve(true);
            }

            return updateCategoryRankingsBatch(catId, funds, existingCatFunds);
        }));

        // Optional: Update radar for significant movers in this batch
        try {
            const { saveRadarUpdates } = await import('@/lib/db/radar');
            const moverRadar = validFunds
                .filter(f => f.dailyChangePercent >= 1.5 || (f.risk?.peakNav && f.latestNav >= f.risk.peakNav * 0.995))
                .map(f => ({
                    type: f.dailyChangePercent >= 1.5 ? 'top_gainer' : 'new_high',
                    schemeCode: f.schemeCode,
                    schemeName: f.schemeName,
                    category: f.categoryLabel,
                    message: f.dailyChangePercent >= 1.5 ? `jumped significantly!` : `near all-time high!`,
                    evidence: f.dailyChangePercent >= 1.5 ? `Gain: ${f.dailyChangePercent.toFixed(2)}%` : `NAV: ${f.latestNav.toFixed(2)}`,
                    severity: 'info',
                    timestamp: startTime
                }));
            if (moverRadar.length > 0) {
                await saveRadarUpdates('batch_movers', moverRadar.slice(0, 10));
            }
        } catch (radarErr) {
            console.warn('Radar update skipped in batch:', radarErr.message);
        }

        // ✉️ Email Notification: Rankings + NAV + Risk Update
        try {
            const topMovers = validFunds
                .filter(f => Math.abs(f.dailyChangePercent) >= 1.0)
                .sort((a, b) => Math.abs(b.dailyChangePercent) - Math.abs(a.dailyChangePercent))
                .slice(0, 5);

            const batchHighlights = topMovers.map(f => ({
                name: f.schemeName,
                stocks: `${f.dailyChangePercent >= 0 ? '+' : ''}${f.dailyChangePercent.toFixed(2)}% today`,
                priority: f.dailyChangePercent >= 1.5 ? 'ALPHA' : 'DEPTH'
            }));

            await sendRefreshNotification({
                type: 'rankings',
                fundsProcessed: validFunds.length,
                success: true,
                batchHighlights,
                message: `Processed ${validFunds.length} funds across ${Object.keys(byCategory).length} categories. NAV, CAGR & risk-adjusted returns updated. Duration: ${Date.now() - startTime}ms`
            });
        } catch (notifErr) {
            console.warn('[Rankings Cron] Notification failed:', notifErr.message);
        }

        return NextResponse.json({
            success: true,
            fundsProcessed: validFunds.length,
            categoriesAffected: Object.keys(byCategory).length,
            timeElapsed: `${Date.now() - startTime}ms`
        });

    } catch (error) {
        console.error('Batch Cron Error:', error);
        try {
            await sendRefreshNotification({
                type: 'rankings',
                success: false,
                error: error.message,
                message: 'Category rankings cron failed. Immediate attention required.'
            });
        } catch (notifErr) {
            console.warn('[Rankings Cron] Error notification also failed:', notifErr.message);
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
