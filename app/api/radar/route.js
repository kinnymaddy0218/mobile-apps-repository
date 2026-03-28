import { NextResponse } from 'next/server';
import { getAllRadarUpdates } from '@/lib/db/radar';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const updates = await getAllRadarUpdates();
        return NextResponse.json(updates);
    } catch (error) {
        console.error('Radar API error:', error);
        return NextResponse.json({ error: 'Failed to fetch radar updates' }, { status: 500 });
    }
}
