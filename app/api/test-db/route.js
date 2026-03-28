import { NextResponse } from 'next/server';
import { getCategoryRankings } from '@/lib/db/rankings';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const rankings = await getCategoryRankings('large-cap');
        return NextResponse.json({
            found: !!rankings,
            fundsLength: rankings?.funds?.length || 0,
            lastUpdated: rankings?.lastUpdated || 'null',
            raw: rankings,
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'missing',
            hasApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY
        });
    } catch (e) {
        return NextResponse.json({ error: e.message });
    }
}
