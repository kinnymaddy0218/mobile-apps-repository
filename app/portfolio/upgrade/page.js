'use client';

import React from 'react';
import SubscriptionManager from '@/components/Premium/SubscriptionManager';
import { ArrowLeft, Sparkles, BarChart, Globe, Cpu } from 'lucide-react';
import Link from 'next/link';

export default function UpgradePage() {
  return (
    <div className="min-h-screen bg-[#020617] p-6 md:p-12 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-fuchsia-600/10 rounded-full blur-[120px]" />

      <div className="max-w-6xl mx-auto relative z-10">
        <header className="mb-12 flex items-center justify-between">
          <Link 
            href="/portfolio" 
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
          >
            <div className="p-2 bg-white/5 rounded-full border border-white/5 group-hover:border-white/10">
              <ArrowLeft size={16} />
            </div>
            <span className="text-xs font-black uppercase tracking-widest">Return to Dashboard</span>
          </Link>

          <div className="flex items-center gap-3">
             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
             <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Secure Alpha Connection</span>
          </div>
        </header>

        <main className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 rounded-full border border-indigo-500/20 mb-8">
            <Sparkles className="text-indigo-400" size={14} />
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Institutional Grade Intelligence</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 uppercase tracking-[-0.04em] italic leading-tight">
            Secure Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-fuchsia-400">Competitive Edge</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-16 leading-relaxed">
            Eliminate guesswork. Deploy high-fidelity risk engineering and institutional-grade data modeling to stay ahead of the mutual fund universe.
          </p>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20 max-w-4xl mx-auto">
            <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
              <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <BarChart className="text-indigo-400" size={20} />
              </div>
              <h4 className="text-white font-bold text-sm mb-2">Deep X-Ray</h4>
              <p className="text-slate-500 text-[10px] uppercase tracking-wider leading-relaxed">Total portfolio overlap and sector concentration analysis.</p>
            </div>
            <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
              <div className="w-10 h-10 bg-fuchsia-500/20 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Globe className="text-fuchsia-400" size={20} />
              </div>
              <h4 className="text-white font-bold text-sm mb-2">Global Sync</h4>
              <p className="text-slate-500 text-[10px] uppercase tracking-wider leading-relaxed">Real-time NAV synchronization across 2,500+ mutual fund schemes.</p>
            </div>
            <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Cpu className="text-emerald-400" size={20} />
              </div>
              <h4 className="text-white font-bold text-sm mb-2">Risk Pulse</h4>
              <p className="text-slate-500 text-[10px] uppercase tracking-wider leading-relaxed">Institutional metrics including Sharpe, Alpha, and Portfolio Stress.</p>
            </div>
          </div>

          <SubscriptionManager />
        </main>

        <footer className="py-12 border-t border-white/5 text-center">
          <p className="text-slate-500 text-[9px] uppercase tracking-[0.3em] font-medium max-w-xl mx-auto leading-relaxed">
            Research and education only. We do not require KYC or bank account connection. Your data remains locked in your local instance and synchronized across your secure personal cloud.
          </p>
        </footer>
      </div>
    </div>
  );
}
