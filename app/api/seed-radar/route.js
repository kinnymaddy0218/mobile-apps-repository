
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET() {
    try {
        const radarRef = adminDb.collection('market_radar').doc('small-cap-mock');
        await radarRef.set({
            categoryName: 'Small Cap',
            lastUpdated: FieldValue.serverTimestamp(),
            updates: [
                {
                    type: 'new_high',
                    schemeCode: 118778,
                    schemeName: 'Nippon India Small Cap Fund',
                    category: 'Small Cap',
                    message: 'is trading near its all-time high!',
                    evidence: 'NAV: 154.22 (Peak: 154.50)',
                    severity: 'info',
                    timestamp: Date.now()
                },
                {
                    type: 'top_gainer',
                    schemeCode: 120828,
                    schemeName: 'Quant Small Cap Fund',
                    category: 'Small Cap',
                    message: 'is showing strong momentum!',
                    evidence: 'Gain: +2.45%',
                    severity: 'success',
                    timestamp: Date.now()
                }
            ]
        });

        return NextResponse.json({ success: true, message: 'Radar data seeded correctly via Admin SDK' });
    } catch (error) {
        console.error('Seeding error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
