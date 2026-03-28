// app/api/factsheets/summary/route.js
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const filePath = path.join(process.cwd(), 'results_utf8.json');
        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ error: 'Summary results not found' }, { status: 404 });
        }

        const rawData = fs.readFileSync(filePath, 'utf8');
        
        // Clean up the mixed log/json format of results_utf8.json
        // The file contains lines like [PROCESS] or [OK] followed by a JSON block after --- FINAL_RESULTS_START ---
        const markers = rawData.split('--- FINAL_RESULTS_START ---');
        if (markers.length < 2) {
            return NextResponse.json({ error: 'Final results marker not found in file' }, { status: 500 });
        }

        // Also split by the end marker if it exists
        const jsonPart = markers[1].split('--- FINAL_RESULTS_END ---')[0].trim();
        const data = JSON.parse(jsonPart);

        return NextResponse.json(data);
    } catch (error) {
        console.error('[Factsheet Summary API] Error:', error);
        return NextResponse.json({ error: 'Failed to read factsheet summary' }, { status: 500 });
    }
}
