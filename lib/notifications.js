// Dynamic import and instantiation handled inside sendRefreshNotification to support missing API keys

export async function sendRefreshNotification({ category, fundsProcessed, success, error }) {
    if (!process.env.RESEND_API_KEY) {
        console.warn('RESEND_API_KEY not found. Skipping email notification.');
        return;
    }

    try {
        // Dynamic import to avoid build-time errors
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        const TO_EMAIL = process.env.NOTIFICATION_EMAIL || 'kinnymaddy0218@gmail.com';

        const subject = success
            ? `✅ MF Refresh Success: ${category}`
            : `❌ MF Refresh FAILED: ${category}`;

        const html = `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: ${success ? '#22c55e' : '#ef4444'}">${subject}</h2>
                <p><strong>Category:</strong> ${category}</p>
                <p><strong>Status:</strong> ${success ? 'Successful' : 'Failed'}</p>
                ${fundsProcessed ? `<p><strong>Funds Processed:</strong> ${fundsProcessed}</p>` : ''}
                ${error ? `<p style="color: #ef4444;"><strong>Error:</strong> ${error}</p>` : ''}
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 12px; color: #666;">This is an automated notification from your MF Research application.</p>
                <a href="https://mf-research.vercel.app/categories" style="display: inline-block; padding: 10px 20px; background: #0070f3; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 10px;">View Rankings</a>
            </div>
        `;

        const data = await resend.emails.send({
            from: 'MF Research <onboarding@resend.dev>',
            to: TO_EMAIL,
            subject: subject,
            html: html,
        });

        if (data.error) {
            console.error(`Resend API Error for ${category}:`, data.error);
        } else {
            console.log(`Notification email queued successfully for ${category} (ID: ${data.data?.id})`);
        }
    } catch (err) {
        console.error('Critical exception sending notification email:', err);
    }
}
