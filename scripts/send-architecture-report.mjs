/**
 * Intelligence Engine Architecture Report Dispatcher
 * Sends the formalized refresh plan to kinnymaddy0218@gmail.com
 */
import { sendRefreshNotification } from '../lib/notifications.js';

async function sendReport() {
    console.log('Dispatching Architecture Report...');

    const reportContent = `
        <h3 style="color: #0070f3;">Intelligence Engine Architecture Report</h3>
        <table border="1" cellpadding="10" style="border-collapse: collapse; width: 100%; font-family: sans-serif;">
            <tr style="background-color: #f8fafc;">
                <th>Data Point</th>
                <th>Frequency</th>
                <th>Source</th>
            </tr>
            <tr>
                <td><strong>NAV & Returns</strong></td>
                <td>Every 2 Hours</td>
                <td>api.mfapi.in</td>
            </tr>
            <tr>
                <td><strong>Risk Metrics</strong></td>
                <td>Every 2 Hours</td>
                <td>Derived (MFAPI)</td>
            </tr>
            <tr>
                <td><strong>PE/PB Ratios</strong></td>
                <td>Every 4 Hours</td>
                <td>RupeeVest Scraper</td>
            </tr>
            <tr>
                <td><strong>Holdings (Top 20)</strong></td>
                <td>Every 4 Hours</td>
                <td>RupeeVest Scraper</td>
            </tr>
            <tr>
                <td><strong>Sector Allocation</strong></td>
                <td>Every 4 Hours</td>
                <td>RupeeVest Scraper</td>
            </tr>
        </table>
        
        <div style="margin-top: 20px; padding: 15px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px;">
            <p><strong>Performance Cron (2h)</strong>: 1 Category per run. 100% Universe Refreshed every 36h.</p>
            <p><strong>Pulse Cron (4h)</strong>: 10 Stalest Funds per run. ~60 Funds per day.</p>
        </div>
    `;

    try {
        await sendRefreshNotification({
            type: 'pulse',
            success: true,
            message: 'Architecture Stabilization Complete',
            fundsProcessed: 'Universe',
            message: reportContent
        });
        console.log('Report dispatched successfully.');
    } catch (err) {
        console.error('Failed to send report:', err);
    }
}

sendReport();
