import { NextResponse } from 'next/server';
import { getCached, setCache } from '@/lib/cache';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export async function GET() {
    try {
        const cacheKey = 'funds:top:global_v1';
        let result = getCached(cacheKey);

        if (!result) {
            if (!db) {
                return NextResponse.json({ error: 'Firebase not initialized' }, { status: 500 });
            }

            // Fetch all category rankings directly from our pre-calculated Firestore database
            const snapshot = await getDocs(collection(db, 'category_rankings'));

            let allFunds = [];
            const categoryPerformers = {};

            // 14 days limit for staleness
            const daysLimit = 14;
            const now = Date.now();

            snapshot.forEach(doc => {
                const categoryData = doc.data();
                
                // 1. Category-level staleness check
                const lastUpdated = categoryData.lastUpdated?.toMillis ? categoryData.lastUpdated.toMillis() : (categoryData.lastUpdated ? new Date(categoryData.lastUpdated).getTime() : 0);
                const daysSinceUpdate = (now - lastUpdated) / (1000 * 60 * 60 * 24);
                if (daysSinceUpdate > daysLimit) return; // Skip entirely stale categories

                const categoryFunds = categoryData.funds || [];
                const badWords = ['segregated', 'discontinued', 'suspended', 'liquidated', 'defunct', 'merged', 'closed', 'matured', 'stopped', 'terminated'];

                // Add to global pool for pure mathematical gainers/losers
                allFunds.push(...categoryFunds);

                // Extract the #1 1-Year CAGR performer for this specific category
                if (categoryFunds.length > 0) {
                    const top1YrFund = [...categoryFunds]
                        .filter(f => {
                            const name = (f.schemeName || '').toLowerCase();
                            return !badWords.some(word => name.includes(word));
                        })
                        .sort((a, b) => {
                            const aRet = a.cagr && a.cagr['1yr'] !== undefined ? a.cagr['1yr'] : -Infinity;
                            const bRet = b.cagr && b.cagr['1yr'] !== undefined ? b.cagr['1yr'] : -Infinity;
                            return bRet - aRet;
                        })[0];

                    if (top1YrFund && top1YrFund.cagr && top1YrFund.cagr['1yr'] !== undefined) {
                        categoryPerformers[categoryData.name || doc.id] = {
                            schemeCode: top1YrFund.schemeCode,
                            schemeName: top1YrFund.schemeName,
                            nav: top1YrFund.latestNav,
                            return1yr: top1YrFund.cagr['1yr']
                        };
                    }
                }
            });

            // Deduplicate across categories (e.g. index funds might overlap)
            const uniqueFundsMap = new Map();
            allFunds.forEach(f => {
                if (!uniqueFundsMap.has(f.schemeCode)) {
                    uniqueFundsMap.set(f.schemeCode, f);
                }
            });
            const uniqueFunds = Array.from(uniqueFundsMap.values());

            // Global Top 10 Gainers (Requires standard dailyChangePercent > 0)
            const gainers = [...uniqueFunds]
                .filter(f => f.dailyChangePercent !== undefined && f.dailyChangePercent > 0)
                .filter(f => {
                    const name = (f.schemeName || '').toLowerCase();
                    const badWords = ['segregated', 'discontinued', 'suspended', 'liquidated', 'defunct', 'merged', 'closed', 'matured', 'stopped', 'terminated'];
                    return !badWords.some(word => name.includes(word)) && f.dailyChangePercent < 50;
                })
                .sort((a, b) => b.dailyChangePercent - a.dailyChangePercent)
                .slice(0, 10);

            // Global Top 10 Losers (Requires standard dailyChangePercent < 0)
            const losers = [...uniqueFunds]
                .filter(f => f.dailyChangePercent !== undefined && f.dailyChangePercent < 0)
                .filter(f => {
                    const name = (f.schemeName || '').toLowerCase();
                    const badWords = ['segregated', 'discontinued', 'suspended', 'liquidated', 'defunct', 'merged', 'closed', 'matured', 'stopped', 'terminated'];
                    return !badWords.some(word => name.includes(word)) && f.dailyChangePercent > -50;
                })
                .sort((a, b) => a.dailyChangePercent - b.dailyChangePercent)
                .slice(0, 10);

            result = {
                gainers,
                losers,
                categoryPerformers,
                totalTracked: uniqueFunds.length,
                totalCategories: snapshot.size,
                lastUpdated: snapshot.docs[0]?.data()?.lastUpdated
            };

            setCache(cacheKey, result, CACHE_TTL);
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('Top funds error:', error);
        return NextResponse.json({ error: 'Failed to fetch top funds' }, { status: 500 });
    }
}
