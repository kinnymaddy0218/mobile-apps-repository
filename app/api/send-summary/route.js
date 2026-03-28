import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request) {
    try {
        if (!process.env.RESEND_API_KEY) {
            return NextResponse.json({ error: 'RESEND_API_KEY not configured in Vercel' }, { status: 500 });
        }

        const body = await request.json();
        const { phaseName, description, bulletPoints, statusLabel, envStatus } = body;

        if (!phaseName || !bulletPoints || !Array.isArray(bulletPoints)) {
            return NextResponse.json({ error: 'Missing required fields: phaseName, bulletPoints' }, { status: 400 });
        }

        const resend = new Resend(process.env.RESEND_API_KEY);
        const TO_EMAIL = 'kinnymaddy0218@gmail.com';

        const html = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff; color: #333;">
                <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #6366f1;">
                    <h1 style="color: #6366f1; margin: 0;">MF Research Platform</h1>
                    <p style="font-size: 1.1rem; color: #666;">${phaseName}</p>
                </div>
                
                <div style="padding: 20px 0;">
                    <p>Hello,</p>
                    <p>${description || "Here are the latest updates to your MF Research platform:"}</p>
                    
                    <h3 style="color: #6366f1;">🚀 Key Updates</h3>
                    <ul style="background-color: #f8fafc; padding: 15px 15px 15px 40px; border-radius: 8px; border: 1px solid #e2e8f0;">
                        ${bulletPoints.map(point => `<li style="margin-bottom: 8px;">${point}</li>`).join('')}
                    </ul>

                    <div style="background-color: #f0f7ff; padding: 15px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #6366f1;">
                        <p style="margin: 0;"><strong>Status:</strong> ${statusLabel || 'UPDATED'}</p>
                        <p style="margin: 0; font-size: 0.9rem;">Deployment: ${envStatus || 'Vercel Production Sync'}</p>
                    </div>
                </div>

                <div style="text-align: center; padding-top: 20px; border-top: 1px solid #eee; font-size: 0.8rem; color: #999;">
                    <p>This is a custom update triggered by your recent development session.</p>
                    <a href="https://mf-research.vercel.app" style="color: #6366f1; text-decoration: none; font-weight: bold;">Experience The Changes</a>
                </div>
            </div>
        `;

        const data = await resend.emails.send({
            from: 'MF Research <onboarding@resend.dev>',
            to: TO_EMAIL,
            subject: `📋 MF Research: ${phaseName} Update`,
            html: html,
        });

        if (data.error) {
            return NextResponse.json({ error: data.error }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Dynamic summary email sent successfully',
            id: data.data.id
        });
    } catch (error) {
        console.error('Summary email error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
