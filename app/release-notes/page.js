'use client';

import React from 'react';
import { History, Zap, Shield, Rocket, Database, Layers, CheckCircle2 } from 'lucide-react';

export default function ReleaseNotesPage() {
    const releases = [
        {
            version: 'v5.3.0',
            date: 'May 2026',
            title: 'Global Expansion & Alerts',
            status: 'UPCOMING',
            highlights: [
                { icon: <Shield size={16} />, text: 'Forensic SMS/Push Alerts: Get notified on major fund manager exits in real-time.' },
                { icon: <Layers size={16} />, text: 'Cross-Portfolio Overlap v2: Deep-dive correlation matrix for multi-asset classes.' },
                { icon: <Rocket size={16} />, text: 'Global Asset Support: Initial phase of US Equity and Crypto forensic integration.' }
            ]
        },
        {
            version: 'v5.2.0',
            date: 'March 31, 2026',
            title: 'Super App Transformation',
            status: 'LATEST',
            highlights: [
                { icon: <Layers size={16} />, text: 'Institutional Highlight Cards: Real-time manager forensics and allocation change alerts deployed.' },
                { icon: <Shield size={16} />, text: 'Terminal Alpha Radar: Upgraded market feeds with sentiment indicators and high-fidelity design.' },
                { icon: <Rocket size={16} />, text: 'The Science of Investing: Launched the high-impact institutional sales pitch and about portal.' },
                { icon: <Zap size={16} />, text: 'Portfolio X-Ray v2: Deep Slate indentation and premium glassmorphism for pro analytics.' }
            ]
        },
        {
            version: 'v5.1.5',
            date: 'March 25, 2026',
            title: 'Reliability Hardening',
            status: 'STABLE',
            highlights: [
                { icon: <CheckCircle2 size={16} />, text: 'Verified 30-day holdings maintenance cron logic (Auto-Refresher).' },
                { icon: <Database size={16} />, text: 'Cleaned AMFI registry sync failures and restored historical NAV data paths.' }
            ]
        }
    ];

    return (
        <div className="animate-fade-in p-6 lg:p-12 max-w-6xl mx-auto space-y-20 selection:bg-indigo-500/30">
            {/* Header */}
            <div>
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-1 bg-indigo-500 rounded-full"></div>
                    <span className="text-[10px] font-black tracking-[0.5em] text-indigo-400 uppercase">Product Evolution</span>
                </div>
                <h1 className="text-6xl lg:text-8xl font-black text-[var(--text-primary)] tracking-tighter leading-none italic">
                    Log <span className="text-indigo-500">History.</span>
                </h1>
                <p className="text-[var(--text-muted)] mt-6 font-bold text-lg max-w-2xl leading-relaxed">
                    Iterating at the speed of the market. Our commitment to institutional transparency through code.
                </p>
            </div>

            {/* Release Timeline */}
            <div className="space-y-16">
                {releases.map((release, idx) => (
                    <div key={idx} className="relative pl-12 border-l-2 border-[var(--border-primary)] py-4 group">
                        <div className={`absolute -left-[9px] top-10 w-4 h-4 rounded-full transition-all duration-700 shadow-xl ${
                            release.status === 'LATEST' ? 'bg-indigo-500 shadow-indigo-500/50 scale-125' : 
                            release.status === 'UPCOMING' ? 'bg-amber-500 shadow-amber-500/40 animate-pulse' : 'bg-[var(--border-primary)]'
                        }`}></div>
                        
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                            <div className="space-y-2">
                                <div className="flex items-center gap-4">
                                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black tracking-[0.2em] uppercase border ${
                                        release.status === 'LATEST' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' :
                                        release.status === 'UPCOMING' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-[var(--bg-tertiary)] border-[var(--border-primary)] text-[var(--text-muted)]'
                                    }`}>
                                        {release.status}
                                    </span>
                                    <span className="text-[10px] font-black text-[var(--text-muted)] opacity-50 uppercase tracking-widest">{release.date}</span>
                                </div>
                                <h2 className="text-4xl font-black text-[var(--text-primary)] tracking-tighter italic uppercase">{release.version}</h2>
                                <h3 className="text-xl font-medium text-indigo-400/80">{release.title}</h3>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {release.highlights.map((h, i) => (
                                <div key={i} className="flex gap-6 p-8 rounded-[2rem] bg-[var(--bg-card)] border border-[var(--border-primary)] hover:border-indigo-500/20 transition-all group/card shadow-sm hover:shadow-2xl">
                                    <div className="p-4 rounded-2xl bg-indigo-500/5 text-indigo-400 group-hover/card:scale-110 transition-transform h-fit">
                                        {h.icon}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-[var(--text-primary)] leading-loose opacity-80 group-hover/card:opacity-100">{h.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="pt-20 border-t border-[var(--border-primary)] flex flex-col md:flex-row items-center justify-between gap-8 opacity-40">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em]">Antigravity Intelligence Hub v5.2.0</p>
                <div className="flex gap-8">
                    <span className="text-[10px] font-black uppercase tracking-widest">Public Ledger</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">Verified Build</span>
                </div>
            </div>
        </div>
    );
}

