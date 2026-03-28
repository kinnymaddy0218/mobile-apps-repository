// app/api/factsheets/amcs/route.js
import { NextResponse } from 'next/server';
import { AMC_CONFIG } from '@/lib/amc-config';

export async function GET() {
    try {
        const amcs = Object.entries(AMC_CONFIG).map(([name, config]) => {
            return {
                name,
                url: config.directUrl || (config.localFile ? `/factsheets/${config.localFile}` : null),
                hasDirectLink: !!config.directUrl || !!config.localFile
            };
        });
        
        // Sort by AMCs that have links first
        amcs.sort((a, b) => {
            if (a.hasDirectLink === b.hasDirectLink) return a.name.localeCompare(b.name);
            return a.hasDirectLink ? -1 : 1;
        });

        return NextResponse.json(amcs);
    } catch (error) {
        console.error('[Factsheet AMCs API] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch AMC factsheets' }, { status: 500 });
    }
}
