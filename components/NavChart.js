'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';

Chart.register(...registerables);

export default function NavChart({ navData, additionalDatasets = [], height = 350 }) {
    const canvasRef = useRef(null);
    const chartInstance = useRef(null);

    // Determine the best default period based on data recency
    const { defaultPeriod, isDiscontinued, lastDataDate } = useMemo(() => {
        if (!navData || navData.length === 0 || !navData[0].date) {
            return { defaultPeriod: '1Y', isDiscontinued: false, lastDataDate: null };
        }

        try {
            const parts = navData[0].date.split('-');
            if (parts.length !== 3) throw new Error("Invalid date format");
            const latestDate = new Date(parts[2], parts[1] - 1, parts[0]);
            
            // Re-check if date is valid
            if (isNaN(latestDate.getTime())) throw new Error("Invalid date object");

            const now = new Date();
            const ageInDays = (now - latestDate) / (1000 * 60 * 60 * 24);

            // If latest data is older than 60 days, it's likely discontinued
            if (ageInDays > 60) {
                return { defaultPeriod: 'MAX', isDiscontinued: true, lastDataDate: latestDate };
            }

            return { defaultPeriod: '1Y', isDiscontinued: false, lastDataDate: latestDate };
        } catch (e) {
            console.warn("Date parsing failed for NavChart:", e);
            return { defaultPeriod: '1Y', isDiscontinued: false, lastDataDate: null };
        }
    }, [navData]);

    const [period, setPeriod] = useState(defaultPeriod);

    // Reset period when default changes (e.g., navigating between funds)
    useEffect(() => { setPeriod(defaultPeriod); }, [defaultPeriod]);

    // Filter data based on period
    const filteredData = useMemo(() => {
        if (!navData || navData.length === 0) return [];

        const now = isDiscontinued ? lastDataDate : new Date();
        let startDate;
        switch (period) {
            case '1M': startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()); break;
            case '3M': startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()); break;
            case '6M': startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()); break;
            case '1Y': startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()); break;
            case '3Y': startDate = new Date(now.getFullYear() - 3, now.getMonth(), now.getDate()); break;
            case '5Y': startDate = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate()); break;
            case 'MAX': startDate = new Date(0); break;
            default: startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        }

        const filtered = navData.filter(d => {
            if (!d.date) return false;
            const p = d.date.split('-');
            if (p.length !== 3) return false;
            const dObj = new Date(p[2], p[1] - 1, p[0]);
            return !isNaN(dObj.getTime()) && dObj >= startDate;
        }).reverse(); // oldest first

        // Downsample if too many points for rendering speed
        if (filtered.length > 500) {
            const step = Math.ceil(filtered.length / 500);
            return filtered.filter((_, i) => i % step === 0 || i === filtered.length - 1);
        }

        return filtered;
    }, [navData, period, isDiscontinued, lastDataDate]);

    useEffect(() => {
        if (!canvasRef.current || filteredData.length === 0) return;

        const validData = filteredData.filter(d => d.date && d.nav);
        if (validData.length === 0) return;

        const labels = validData.map(d => {
            const p = d.date.split('-');
            return new Date(p[2], p[1] - 1, p[0]);
        });
        const values = validData.map(d => parseFloat(d.nav));

        const ctx = canvasRef.current.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        const isPositive = values.length >= 2 && values[values.length - 1] >= values[0];

        gradient.addColorStop(0, isPositive ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)');
        gradient.addColorStop(1, isPositive ? 'rgba(16,185,129,0)' : 'rgba(239,68,68,0)');

        const datasets = [
            {
                label: 'NAV',
                data: values,
                borderColor: isPositive ? '#10b981' : '#ef4444',
                backgroundColor: gradient,
                borderWidth: 2,
                fill: true,
                tension: 0.3,
                pointRadius: 0,
                pointHoverRadius: 5,
                pointHoverBackgroundColor: isPositive ? '#10b981' : '#ef4444',
            },
            ...additionalDatasets,
        ];

        if (chartInstance.current) {
            chartInstance.current.destroy();
            chartInstance.current = null;
        }

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

        chartInstance.current = new Chart(ctx, {
            type: 'line',
            data: { labels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 300 },
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: {
                        display: additionalDatasets.length > 0,
                        labels: { color: isDark ? '#94a3b8' : '#475569', font: { family: "'Inter', sans-serif", size: 12 } },
                    },
                    tooltip: {
                        backgroundColor: isDark ? '#1a2035' : '#ffffff',
                        titleColor: isDark ? '#f0f4ff' : '#0f172a',
                        bodyColor: isDark ? '#94a3b8' : '#475569',
                        borderColor: isDark ? 'rgba(148,163,184,0.12)' : 'rgba(15,23,42,0.08)',
                        borderWidth: 1, cornerRadius: 10, padding: 12,
                        titleFont: { family: "'Inter', sans-serif", weight: '600' },
                        bodyFont: { family: "'JetBrains Mono', monospace", size: 12 },
                        callbacks: { label: (ctx) => `₹${ctx.parsed.y.toFixed(4)}` },
                    },
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: period === '1M' ? 'day' : period === '3M' || period === '6M' ? 'week' : 'month',
                            displayFormats: { day: 'dd MMM', week: 'dd MMM', month: 'MMM yy' },
                        },
                        grid: { display: false },
                        ticks: { color: isDark ? '#64748b' : '#94a3b8', font: { family: "'Inter', sans-serif", size: 11 }, maxRotation: 0, maxTicksLimit: 8 },
                    },
                    y: {
                        grid: { color: isDark ? 'rgba(148,163,184,0.06)' : 'rgba(15,23,42,0.04)' },
                        ticks: { color: isDark ? '#64748b' : '#94a3b8', font: { family: "'JetBrains Mono', monospace", size: 11 }, callback: (val) => `₹${val.toFixed(2)}`, maxTicksLimit: 6 },
                    },
                },
            },
        });

        return () => {
            if (chartInstance.current) { chartInstance.current.destroy(); chartInstance.current = null; }
        };
    }, [filteredData, additionalDatasets, height]);

    return (
        <div>
            {isDiscontinued && (
                <div style={{
                    padding: '8px 12px', marginBottom: '12px', fontSize: '0.8rem',
                    background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)',
                    borderRadius: 'var(--radius-sm)', color: 'var(--color-warning)',
                }}>
                    ⚠️ This fund's data ends on <strong>{navData?.[0]?.date}</strong>. It may have been merged or discontinued. Periods are relative to the last available date.
                </div>
            )}
            <div className="filter-chips" style={{ marginBottom: '12px', marginTop: 0 }}>
                {['1M', '3M', '6M', '1Y', '3Y', '5Y', 'MAX'].map(p => (
                    <button
                        key={p}
                        className={`chip ${period === p ? 'active' : ''}`}
                        onClick={() => setPeriod(p)}
                        style={{ padding: '4px 12px', fontSize: '0.78rem' }}
                    >
                        {p}
                    </button>
                ))}
            </div>
            {filteredData.length > 0 ? (
                <div style={{ position: 'relative', height: `${height}px`, width: '100%' }}>
                    <canvas ref={canvasRef} />
                </div>
            ) : (
                <div style={{
                    height: `${height}px`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-muted)', fontSize: '0.9rem', border: '1px dashed var(--border-primary)',
                    borderRadius: 'var(--radius-md)',
                }}>
                    No data available for this period. Try a longer timeframe.
                </div>
            )}
        </div>
    );
}
