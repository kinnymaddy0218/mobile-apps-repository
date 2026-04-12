import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getCountFromServer, query, where } from 'firebase/firestore';

export async function GET() {
    try {
        if (!db) {
            return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
        }

        const factsheetColl = collection(db, 'fund_factsheets_cache');
        const snapshot = await getCountFromServer(factsheetColl);
        const totalFactsheets = snapshot.data().count;

        // Count "Global Index" funds (if you have a metadata collection)
        // For now, we'll use the factsheet count as the primary indicator of protected funds.
        
        return NextResponse.json({
            status: 'Operational',
            shieldedFunds: totalFactsheets,
            mode: 'Local-First (Persistence Shield)',
            lastAudit: new Date().toISOString(),
            billingPlan: 'Blaze (Pay-as-you-go)'
        });
    } catch (error) {
        console.error('[System Stats API] Failure:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
