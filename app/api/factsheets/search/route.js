import { NextResponse } from 'next/server';
import scraper from '@/lib/scraper';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 3) {
        return NextResponse.json([]);
    }

    try {
        const index = await scraper.fetchIndex();
        const tokens = query.toLowerCase().split(' ').filter(t => t.length > 0);
        
        const results = index
            .filter(f => {
                const name = (f.s_name || '').toLowerCase();
                return tokens.every(t => name.includes(t));
            })
            .slice(0, 10)
            .map(f => ({
                name: f.s_name,
                schemecode: f.schemecode,
                category: f.category
            }));

        return NextResponse.json(results);
    } catch (error) {
        console.error('[Factsheet Search API] Error:', error);
        return NextResponse.json({ error: 'Failed to search funds' }, { status: 500 });
    }
}
