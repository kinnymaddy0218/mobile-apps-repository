'use client';

import React from 'react';
import { Target, Globe, Microscope } from 'lucide-react';

export default function AboutAppPage() {
    return (
        <div className="animate-fade-in p-6 lg:p-20 max-w-7xl mx-auto space-y-32 bg-[var(--bg-primary)] selection:bg-indigo-500/30">
            {/* Hero Section */}
            <header className="relative text-center py-32 overflow-hidden bg-gradient-to-br from-indigo-500/10 via-transparent to-violet-500/10 rounded-[5rem] border border-[var(--border-primary)] shadow-2xl">
                <div className="absolute inset-0 bg-[var(--xray-bg-glow)] opacity-30 pointer-events-none"></div>
                <div className="relative z-10 space-y-8 px-6">
                    <div className="inline-flex items-center gap-3 px-6 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-4">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                        <span className="text-[10px] font-black tracking-[0.5em] text-indigo-400 uppercase">Institutional Alpha Hub</span>
                    </div>
                    <h1 className="text-6xl lg:text-9xl font-black text-[var(--text-primary)] tracking-tighter leading-none italic">
                        The <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-fuchsia-500">Science</span> of Investing.
                    </h1>
                    <p className="text-xl lg:text-2xl font-bold text-[var(--text-secondary)] opacity-80 tracking-tight max-w-3xl mx-auto leading-relaxed">
                        Retail platforms show you the surface. We show you the <span className="text-indigo-400">Forensics</span>. 
                        A high-fidelity intelligence suite designed to deconstruct mutual fund DNA and expose structural vulnerabilities.
                    </p>
                    <div className="flex flex-wrap justify-center gap-6 pt-8">
                        <div className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:scale-105 transition-all cursor-pointer">Start Analysis</div>
                        <div className="px-8 py-4 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-primary)] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[var(--bg-card)] transition-all cursor-pointer">View Dossier</div>
                    </div>
                </div>
            </header>

            {/* Core Value Proposition */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                <div className="space-y-10">
                    <div className="space-y-4">
                        <h2 className="text-5xl lg:text-7xl font-black text-[var(--text-primary)] tracking-tighter leading-[0.85]">
                            What makes <br/><span className="text-indigo-500 italic">this Magic</span> possible?
                        </h2>
                        <p className="text-lg font-bold text-[var(--text-muted)] leading-relaxed">
                            Traditional aggregators rely on stale PDFs and lagging data. Our engine orchestrates real-time 
                            high-fidelity scraping through the same factual endpoints used by institutional desks.
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-6">
                        {[
                            { title: 'Genetic Overlap Analysis', desc: 'Identify 100% of stock redundancies between your schemes to eliminate alpha-cannibalization.', color: 'text-indigo-400' },
                            { title: 'Instant Forensic Audits', desc: 'Real-time extraction of PE/PB ratios, expense slippage, and manager concentration risks.', color: 'text-emerald-400' },
                            { title: 'Deep Factsheet Synthesis', desc: 'Our Hub refreshes holdings every 30 days, ensuring your X-Ray is always biologically accurate.', color: 'text-fuchsia-400' }
                        ].map((item, i) => (
                            <div key={i} className="group flex gap-6 p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-primary)] shadow-sm hover:border-indigo-500/30 transition-all">
                                <div className={`p-4 bg-white/5 rounded-2xl h-fit group-hover:scale-110 transition-transform ${item.color}`}>
                                    <Target size={24} />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-lg font-black text-[var(--text-primary)] uppercase tracking-tight">{item.title}</h4>
                                    <p className="text-sm font-medium text-[var(--text-muted)] leading-loose">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Column */}
                <div className="relative group">
                    <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-[4rem] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                    <div className="space-y-8 relative z-10">
                        <div className="relative aspect-square md:aspect-auto md:min-h-[400px] bg-[var(--bg-card)] rounded-[4rem] border border-[var(--border-primary)] p-12 overflow-hidden flex flex-col justify-between shadow-2xl">
                            <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12">
                                <Microscope size={300} />
                            </div>
                            
                            <div className="space-y-6 relative z-10">
                                <div className="w-16 h-1 bg-indigo-500 rounded-full"></div>
                                <h3 className="text-4xl font-black text-white tracking-tighter leading-tight italic">
                                    "The difference <br/>between gambling <br/>and investing <br/>is <span className="text-indigo-400">Information.</span>"
                                </h3>
                            </div>

                            <div className="space-y-8 relative z-10">
                                <div className="p-6 bg-black/40 backdrop-blur-3xl rounded-[2rem] border border-white/10 flex items-center gap-6">
                                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/20">IQ</div>
                                    <div>
                                        <p className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em] mb-1">Intelligence Quotient</p>
                                        <p className="text-[10px] font-bold text-white/60 leading-tight">Our proprietary score for total portfolio structural efficiency.</p>
                                    </div>
                                </div>
                                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.5em] text-center opacity-40">Verified Institutional Architecture</p>
                            </div>
                        </div>

                        {[{ title: 'Market Radar Intelligence', desc: 'Algorithmic monitoring of scheme NAVs and sector rotation alerts delivered daily to your dashboard.', icon: <Globe className="text-blue-400" /> }
                        ].map((d, i) => (
                            <div key={i} className="group space-y-6 p-10 rounded-[2.5rem] bg-[var(--bg-tertiary)] border border-[var(--border-primary)] hover:border-indigo-500/30 transition-all hover:bg-[var(--bg-card)] shadow-inner">
                                <div className="p-4 w-fit bg-white/5 rounded-2xl group-hover:scale-110 transition-transform">{d.icon}</div>
                                <h4 className="text-2xl font-black text-[var(--text-primary)] tracking-tight uppercase italic">{d.title}</h4>
                                <p className="text-sm font-medium text-[var(--text-muted)] leading-loose">{d.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            
            <footer className="text-center py-32 border-t border-[var(--border-primary)]/50">
                <div className="mb-8 flex justify-center gap-6 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
                    <div className="w-12 h-12 bg-white rounded-full"></div>
                    <div className="w-12 h-12 bg-white rounded-full"></div>
                    <div className="w-12 h-12 bg-white rounded-full"></div>
                </div>
                <p className="text-[10px] font-black text-indigo-400/60 uppercase tracking-[0.5em] mb-4">Science of Investing • Institutional Platform</p>
                <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-40">© 2026 Antigravity Engineering Lab • London • Bangalore</p>
            </footer>
        </div>
    );
}
