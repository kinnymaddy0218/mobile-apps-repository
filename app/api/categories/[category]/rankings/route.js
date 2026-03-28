import { NextResponse } from 'next/server';
import { getCategoryRankings } from '@/lib/db/rankings';
import { CATEGORIES } from '@/lib/categories';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
    try {
        const { category } = params;

        // Find matching category definition
        const categoryDef = CATEGORIES.find(
            c => c.label.toLowerCase() === decodeURIComponent(category).toLowerCase() || c.key.toLowerCase() === decodeURIComponent(category).toLowerCase()
        );

        if (!categoryDef) {
            return NextResponse.json({ error: 'Category not found' }, { status: 404 });
        }

        // Fetch pre-computed rankings from Firestore
        const rankings = await getCategoryRankings(categoryDef.key);

        if (!rankings || !rankings.funds) {
            return NextResponse.json({
                funds: [],
                lastUpdated: null,
                message: 'Rankings not yet calculated for this category.'
            });
        }

        // Staleness check (14 days)
        const now = Date.now();
        const lastUpdated = rankings.lastUpdated?.toDate ? rankings.lastUpdated.toDate() : (rankings.lastUpdated ? new Date(rankings.lastUpdated) : null);
        const daysSinceUpdate = lastUpdated ? (now - lastUpdated.getTime()) / (1000 * 60 * 60 * 24) : Infinity;

        if (daysSinceUpdate > 14) {
            return NextResponse.json({
                funds: [],
                lastUpdated: lastUpdated,
                message: 'Rankings for this category are stale and need Refresh.'
            });
        }

        return NextResponse.json({
            funds: rankings.funds,
            lastUpdated: rankings.lastUpdated?.toDate ? rankings.lastUpdated.toDate() : rankings.lastUpdated
        });
    } catch (error) {
        console.error('Error fetching category rankings:', error);
        return NextResponse.json({ error: 'Failed to fetch rankings' }, { status: 500 });
    }
}
