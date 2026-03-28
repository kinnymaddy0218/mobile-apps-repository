'use client';

import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';

Chart.register(...registerables);

export default function CrashTimeline({ funds, fundData, weights, scenario }) {
    const canvasRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        if (!canvasRef.current || funds.length === 0) return;

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const start = new Date(scenario.startDate);
        const end = new Date(scenario.endDate);

        // Helper to parse DD-MM-YYYY
        const parseDate = (d) => {
            const parts = d.split('-');
            return new Date(parts[2], parts[1] - 1, parts[0]);
        };

        // 1. Prepare portfolio time series
        const dateMap = new Map(); // Date string -> Map of Code -> NAV
        const benchmarkCode = '120716'; // UTI Nifty 50 Index (Proxy for TRI)

        // Helper to fetch benchmark if needed
        const ensureBenchmarkData = async () => {
            if (!fundData[benchmarkCode]) {
                try {
                    const res = await fetch(`https://api.mfapi.in/mf/${benchmarkCode}`);
                    const data = await res.json();
                    return data;
                } catch (e) { return null; }
            }
            return fundData[benchmarkCode];
        };

        const renderChart = (benchmarkInfo) => {
            funds.forEach(fund => {
                const history = fundData[fund.schemeCode]?.navHistory;
                if (!history) return;
                history.forEach(entry => {
                    const d = parseDate(entry.date);
                    if (d >= start && d <= end) {
                        if (!dateMap.has(entry.date)) dateMap.set(entry.date, new Map());
                        dateMap.get(entry.date).set(fund.schemeCode, parseFloat(entry.nav));
                    }
                });
            });

            // Add benchmark to dateMap
            if (benchmarkInfo?.data) {
                benchmarkInfo.data.forEach(entry => {
                    const d = parseDate(entry.date);
                    if (d >= start && d <= end) {
                        if (!dateMap.has(entry.date)) dateMap.set(entry.date, new Map());
                        dateMap.get(entry.date).set(benchmarkCode, parseFloat(entry.nav));
                    }
                });
            }

            // Sort dates
            const sortedDates = Array.from(dateMap.keys()).sort((a, b) => parseDate(a) - parseDate(b));
            if (sortedDates.length === 0) return;

            // Base values for normalization (indexed to 100 at start of period)
            const baseNavs = {};
            const allCodes = [...funds.map(f => f.schemeCode), benchmarkCode];
            
            allCodes.forEach(code => {
                for (const date of sortedDates) {
                    const nav = dateMap.get(date).get(code);
                    if (nav) {
                        baseNavs[code] = nav;
                        break;
                    }
                }
            });

            const portfolioData = sortedDates.map(date => {
                let weightedSum = 0;
                let totalWeightUsed = 0;

                funds.forEach(f => {
                    const nav = dateMap.get(date).get(f.schemeCode);
                    const weight = weights[f.schemeCode] || 0;
                    if (nav && baseNavs[f.schemeCode]) {
                        const normalized = (nav / baseNavs[f.schemeCode]) * 100;
                        weightedSum += normalized * (weight / 100);
                        totalWeightUsed += weight;
                    }
                });

                const finalVal = totalWeightUsed > 0 ? (weightedSum * (100 / totalWeightUsed)) : 100;
                return { x: parseDate(date), y: finalVal };
            });

            const benchmarkSeries = sortedDates.map(date => {
                const nav = dateMap.get(date).get(benchmarkCode);
                const normalized = (nav && baseNavs[benchmarkCode]) ? (nav / baseNavs[benchmarkCode]) * 100 : null;
                return { x: parseDate(date), y: normalized };
            }).filter(d => d.y !== null);

            // Calculate Metrics
            const values = portfolioData.map(d => d.y);
            const peakVal = Math.max(...values);
            const troughVal = Math.min(...values);
            const startVal = values[0];
            const endVal = values[values.length - 1];

            // True Max Drawdown calculation (Trough vs Peak)
            let maxDD = 0;
            let currentPeak = values[0];
            values.forEach(v => {
                if (v > currentPeak) currentPeak = v;
                const dd = ((v - currentPeak) / currentPeak) * 100;
                if (dd < maxDD) maxDD = dd;
            });

            const periodReturn = ((endVal - startVal) / startVal) * 100;

            const ddEl = document.getElementById('portfolio-max-dd');
            const retEl = document.getElementById('portfolio-recovery');
            if (ddEl) ddEl.innerText = `${maxDD.toFixed(2)}%`;
            if (retEl) retEl.innerText = `${periodReturn.toFixed(2)}%`;

            // Individual fund analysis
            funds.forEach(f => {
                const code = f.schemeCode;
                const fHistory = sortedDates.map(d => dateMap.get(d).get(code)).filter(Boolean);
                if (fHistory.length > 0) {
                    const fStart = fHistory[0];
                    const fEnd = fHistory[fHistory.length - 1];
                    const fMin = Math.min(...fHistory);
                    const fMax = Math.max(...fHistory);
                    const fRet = ((fEnd - fStart) / fStart) * 100;
                    const fDD = ((fMin - fMax) / fMax) * 100;

                    document.querySelectorAll(`.calc-period-return[data-code="${code}"]`).forEach(c => {
                        c.innerText = `${fRet.toFixed(2)}%`;
                        c.className = `calc-period-return ${fRet >= 0 ? 'color-positive' : 'color-negative'}`;
                    });
                    document.querySelectorAll(`.calc-period-dd[data-code="${code}"]`).forEach(c => {
                        c.innerText = `${fDD.toFixed(2)}%`;
                    });
                }
            });

            // Draw Chart
            const ctx = canvasRef.current.getContext('2d');
            if (chartInstance.current) chartInstance.current.destroy();

            chartInstance.current = new Chart(ctx, {
                type: 'line',
                data: {
                    datasets: [
                        {
                            label: 'Portfolio Value',
                            data: portfolioData,
                            borderColor: '#6366f1',
                            backgroundColor: 'rgba(99, 102, 241, 0.1)',
                            fill: true,
                            tension: 0.1,
                            pointRadius: 0,
                            borderWidth: 3,
                            zIndex: 2
                        },
                        {
                            label: 'Nifty 50 TRI (Benchmark)',
                            data: benchmarkSeries,
                            borderColor: isDark ? '#94a3b8' : '#64748b',
                            borderDash: [5, 5],
                            pointRadius: 0,
                            borderWidth: 2,
                            fill: false,
                            zIndex: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { 
                            display: true, 
                            position: 'top',
                            labels: {
                                color: isDark ? '#f8fafc' : '#1e293b',
                                usePointStyle: true,
                                padding: 20,
                                font: { weight: '600', size: 11 }
                            }
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            callbacks: {
                                label: (context) => `${context.dataset.label}: ${context.parsed.y.toFixed(2)}`
                            }
                        }
                    },
                    scales: {
                        x: {
                            type: 'time',
                            time: { unit: 'day', displayFormats: { month: 'MMM yyyy' } },
                            grid: { display: false },
                            ticks: { color: isDark ? '#94a3b8' : '#475569', maxRotation: 0 }
                        },
                        y: {
                            grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
                            ticks: { color: isDark ? '#94a3b8' : '#475569' }
                        }
                    }
                }
            });
        };

        ensureBenchmarkData().then(data => {
            if (canvasRef.current) renderChart(data);
        });

        return () => {
            if (chartInstance.current) chartInstance.current.destroy();
        };
    }, [funds, fundData, weights, scenario]);

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <canvas ref={canvasRef} />
            <style jsx>{`
                canvas {
                    filter: drop-shadow(0 4px 12px rgba(99, 102, 241, 0.15));
                }
            `}</style>
        </div>
    );
}
