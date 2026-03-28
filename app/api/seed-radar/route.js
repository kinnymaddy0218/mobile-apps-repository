
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export async function GET() {
    if (!db) {
        return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    try {
        const radarRef = doc(db, 'market_radar', 'small-cap-mock');
        await setDoc(radarRef, {
            categoryName: 'Small Cap',
            lastUpdated: serverTimestamp(),
            updates: [
                {
                    type: 'new_high',
                    schemeCode: 118778, // Corrected from 120828
                    schemeName: 'Nippon India Small Cap Fund',
                    category: 'Small Cap',
                    message: 'is trading near its all-time high!',
                    evidence: 'NAV: 154.22 (Peak: 154.50)',
                    severity: 'info',
                    timestamp: Date.now()
                },
                {
                    type: 'top_gainer',
                    schemeCode: 120828, // Corrected mapping
                    schemeName: 'Quant Small Cap Fund',
                    category: 'Small Cap',
                    message: 'is showing strong momentum!',
                    evidence: 'Gain: +2.45%',
                    severity: 'success',
                    timestamp: Date.now()
                }
            ]
        });

        return NextResponse.json({ success: true, message: 'Radar data seeded correctly' });
    } catch (error) {
        console.error('Seeding error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
