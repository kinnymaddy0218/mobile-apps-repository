export async function sendRefreshNotification({ 
    type = 'rankings', 
    category, 
    fundsProcessed, 
    success, 
    error, 
    message,
    coveragePct = 0,
    batchHighlights = []
}) {
    if (!process.env.RESEND_API_KEY) {
        console.warn('RESEND_API_KEY not found. Skipping email notification.');
        return;
    }

    try {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        const TO_EMAIL = process.env.NOTIFICATION_EMAIL || 'kinnymaddy0218@gmail.com';

        if (!TO_EMAIL) {
            console.error('No NOTIFICATION_EMAIL provided.');
            return;
        }

        const isPulse = type === 'pulse';
        const isDiscovery = type === 'discovery';
        const isSync = type === 'sync';
        const isRankings = type === 'rankings';
        const subjectPrefix = success ? '✅' : '❌';
        
        let subjectTitle = category ? `MF Category Refresh: ${category}` : 'System Refresh';
        if (isPulse) subjectTitle = 'Portfolio Pulse Refresh';
        if (isDiscovery) subjectTitle = 'Market Discovery Pulse';
        if (isSync) subjectTitle = 'Global Intelligence Sync';
        if (isRankings) subjectTitle = `Rankings Pulse: ${category || 'All'}`;
        
        const subject = `${subjectPrefix} ${subjectTitle}`;

        const html = `
            <div style="font-family: 'Inter', sans-serif; padding: 24px; border: 1px solid #1e293b; border-radius: 12px; max-width: 600px; background: #020617; color: #f8fafc;">
                <h2 style="color: #38bdf8; margin-top: 0; font-size: 20px; font-weight: 700;">${subjectTitle}</h2>
                
                ${isDiscovery && coveragePct > 0 ? `
                    <div style="margin: 20px 0; padding: 16px; background: #0f172a; border-radius: 8px; border: 1px solid #1e293b;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span style="font-size: 13px; color: #94a3b8;">Mutual Fund Universe Discovery Profile</span>
                            <span style="font-size: 13px; color: #38bdf8; font-weight: 600;">${coveragePct.toFixed(1)}%</span>
                        </div>
                        <div style="width: 100%; height: 6px; background: #1e293b; border-radius: 3px; overflow: hidden;">
                            <div style="width: ${coveragePct}%; height: 100%; background: linear-gradient(90deg, #38bdf8, #818cf8); border-radius: 3px;"></div>
                        </div>
                    </div>
                ` : ''}

                <div style="background: #0f172a; padding: 16px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #1e293b;">
                    <p style="margin: 8px 0; font-size: 14px;"><strong style="color: #94a3b8;">Status:</strong> <span style="color: ${success ? '#22c55e' : '#ef4444'}">${success ? 'Institutional Success' : 'Maintenance Required'}</span></p>
                    ${category ? `<p style="margin: 8px 0; font-size: 14px;"><strong style="color: #94a3b8;">Scope:</strong> ${category}</p>` : ''}
                    ${fundsProcessed ? `<p style="margin: 8px 0; font-size: 14px;"><strong style="color: #94a3b8;">Funds Processed:</strong> ${fundsProcessed}</p>` : ''}
                    ${message ? `<p style="margin: 8px 0; font-size: 14px; line-height: 1.5; color: #cbd5e1;">${message}</p>` : ''}
                    ${error ? `<p style="color: #ef4444; margin: 12px 0; font-size: 14px;"><strong>Error:</strong> ${error}</p>` : ''}
                </div>

                ${batchHighlights.length > 0 ? `
                    <h3 style="font-size: 14px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">Top Intelligence Secured</h3>
                    <div style="display: grid; gap: 8px;">
                        ${batchHighlights.map(h => {
                            const isAlpha = h.priority === 'ALPHA' || h.priority === 'SHARPE';
                            const metricLabel = isAlpha ? h.stocks : `${h.stocks} stocks discovered`;
                            const borderCol = h.priority === 'ALPHA' ? '#fbbf24' : (h.priority === 'SHARPE' ? '#a78bfa' : '#38bdf8');
                            return `
                                <div style="padding: 12px; background: #0f172a; border-radius: 6px; border-left: 3px solid ${borderCol}; font-size: 13px; margin-bottom: 8px;">
                                    <div style="font-weight: 600; color: #f1f5f9;">${h.name}</div>
                                    <div style="color: #64748b; font-size: 12px; margin-top: 4px;">${metricLabel} • <span style="color: ${borderCol}; font-weight: 500;">${h.priority}</span> Intelligence</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                ` : ''}

                <hr style="border: 0; border-top: 1px solid #1e293b; margin: 24px 0;" />
                <p style="font-size: 11px; color: #475569; text-align: center;">Institutional Agent v4.2 • Autonomous Market Research Engine</p>
                <div style="margin-top: 24px; text-align: center;">
                    <a href="https://mf-research.vercel.app/portfolio/x-ray" style="display: inline-block; padding: 12px 24px; background: #38bdf8; color: #020617; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 14px;">View Analytical Hub</a>
                </div>
            </div>
        `;

        console.log(`[Notification Engine] Dispatching ${type} report to ${TO_EMAIL}...`);
        const { data, error } = await resend.emails.send({
            from: 'Portfolio Intelligence Engine <onboarding@resend.dev>',
            to: TO_EMAIL,
            reply_to: TO_EMAIL,
            subject: subject,
            html: html,
            headers: {
                'X-Entity-Ref-ID': Date.now().toString(),
            }
        });

        if (error) {
            console.error(`[Notification Engine] API Error:`, error.message, error);
        } else {
            console.log(`[Notification Engine] Delivery Success. ID: ${data?.id}`);
        }
    } catch (err) {
        console.error('Critical notification failure:', err.message || err);
    }
}
