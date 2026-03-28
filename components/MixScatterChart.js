'use client';

import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export default function MixScatterChart({ mix, funds, fundData, weights, height = 400 }) {
    const canvasRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        if (!canvasRef.current || !mix || funds.length === 0) return;

        // Extract points
        // X = Risk (StdDev), Y = Return (3yr CAGR)
        // If 3yr CAGR is missing, use 1yr

        const getReturn = (data) => data?.cagr?.['3yr'] ?? data?.cagr?.['1yr'] ?? data?.cagr?.['Inception'] ?? 0;
        const getRisk = (data) => {
            // Prioritize Official Standard Deviation from AMC Factsheet
            const officialStdDev = data?.factsheet?.risk_ratios?.standard_deviation;
            if (officialStdDev && !isNaN(parseFloat(officialStdDev))) {
                return parseFloat(officialStdDev);
            }
            return data?.risk?.stdDev ?? 0;
        };

        const fundPoints = funds.map((f, i) => {
            const data = fundData[f.schemeCode];
            return {
                x: getRisk(data),
                y: getReturn(data),
                label: f.schemeName.split(' ').slice(0, 3).join(' ') + ` (${weights[f.schemeCode]}%)`,
                backgroundColor: `hsl(${(i * 360) / funds.length}, 70%, 50%)`,
                pointStyle: 'circle',
                radius: 8,
                hoverRadius: 10
            };
        });

        const mixPoint = {
            x: mix.risk.stdDev,
            y: mix.cagr['3yr'] ?? mix.cagr['1yr'] ?? 0,
            label: 'Your Mix',
            backgroundColor: '#06b6d4',
            borderColor: '#0891b2',
            pointStyle: 'star',
            radius: 14,
            hoverRadius: 16
        };

        const allPoints = [...fundPoints, mixPoint];

        const ctx = canvasRef.current.getContext('2d');

        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
        const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        const textColor = isDarkMode ? '#94a3b8' : '#475569';

        chartInstance.current = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: allPoints.map(p => ({
                    label: p.label,
                    data: [{ x: p.x, y: p.y }],
                    backgroundColor: p.backgroundColor,
                    borderColor: p.borderColor || p.backgroundColor,
                    pointStyle: p.pointStyle,
                    radius: p.radius,
                    hoverRadius: p.hoverRadius,
                    borderWidth: p.pointStyle === 'star' ? 2 : 1
                }))
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            color: textColor,
                            padding: 20,
                            font: { family: "'Inter', sans-serif" }
                        }
                    },
                    tooltip: {
                        backgroundColor: isDarkMode ? 'rgba(17, 24, 39, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                        titleColor: isDarkMode ? '#fff' : '#000',
                        bodyColor: isDarkMode ? '#cbd5e1' : '#475569',
                        borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                        borderWidth: 1,
                        padding: 12,
                        callbacks: {
                            label: (context) => {
                                return `Return: ${context.raw.y.toFixed(2)}%, Risk: ${context.raw.x.toFixed(2)}%`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: gridColor },
                        ticks: { color: textColor, callback: (v) => v + '%' },
                        title: { display: true, text: 'Risk (Std Deviation)', color: textColor, font: { weight: 'bold' } }
                    },
                    y: {
                        grid: { color: gridColor },
                        ticks: { color: textColor, callback: (v) => v + '%' },
                        title: { display: true, text: 'Return (3Y CAGR)', color: textColor, font: { weight: 'bold' } }
                    }
                }
            }
        });

        // Cleanup
        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
                chartInstance.current = null;
            }
        };
    }, [mix, funds, fundData, weights]);

    return (
        <div style={{ height: `${height}px`, width: '100%', position: 'relative' }}>
            <canvas ref={canvasRef} />
        </div>
    );
}
