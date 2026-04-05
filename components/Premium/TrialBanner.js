'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LayoutGrid, Zap, Sparkles, X, ChevronRight, Crown } from 'lucide-react';
import Link from 'next/link';

export default function TrialBanner() {
  const { user, loading } = useAuth();
  const [isVisible, setIsVisible] = useState(true);
  
  if (loading || !user || !isVisible) return null;

  const isPremium = user.profile?.isPremium;
  const isFoundingMember = user.profile?.isFoundingMember;
  const isTrialActive = user.profile?.isTrialActive;
  const trialDaysLeft = user.profile?.trialDaysLeft;

  // Case 1: Founding Member (The Admin)
  if (isFoundingMember) {
    return (
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-900 to-indigo-700 h-10 flex items-center justify-center relative overflow-hidden group">
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity animate-pulse"></div>
        <div className="flex items-center gap-3 px-4 text-white">
          <Crown className="text-amber-400 group-hover:rotate-12 transition-transform" size={16} />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">Lifetime Intelligence Node Active</span>
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></div>
        </div>
      </div>
    );
  }

  // Case 2: Premium User
  if (isPremium) return null;

  // Case 3: Trial User
  if (isTrialActive) {
    return (
      <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 h-12 flex items-center justify-between px-4 md:px-8 relative shadow-2xl shrink-0">
        <div className="flex items-center gap-4">
          <div className="hidden md:flex p-1.5 bg-white/10 rounded-lg">
            <Sparkles className="text-white" size={16} />
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
             <span className="text-[11px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                Trial Access Mode
                <span className="px-2 py-0.5 bg-white/20 rounded-full text-[9px]">{trialDaysLeft} Days Left</span>
             </span>
             <span className="text-[9px] text-indigo-100 font-medium hidden lg:block opacity-80 uppercase tracking-tighter">Institutional Risk Metrics & Sector Engineering Unlocked</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link 
            href="/portfolio/upgrade" 
            className="flex items-center gap-2 px-4 py-1.5 bg-white text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-slate-50 transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
          >
            Upgrade Now
            <ChevronRight size={14} />
          </Link>
          <button 
            onClick={() => setIsVisible(false)}
            className="p-1 text-white/30 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  // Case 4: Trial Ended
  return (
    <div className="bg-[#0f172a] border-b border-white/5 h-12 flex items-center justify-between px-4 md:px-8 shrink-0">
        <div className="flex items-center gap-4">
          <div className="hidden md:flex p-1.5 bg-amber-500/10 rounded-lg">
            <Zap className="text-amber-500" size={16} />
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
             <span className="text-[11px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2">
                Intelligence Offline
                <span className="px-2 py-0.5 bg-amber-500/20 rounded-full text-[9px]">Trial Ended</span>
             </span>
             <span className="text-[9px] text-slate-500 font-medium hidden lg:block uppercase tracking-tighter">Your access to premium research data has expired.</span>
          </div>
        </div>

        <Link 
          href="/portfolio/upgrade" 
          className="flex items-center gap-2 px-4 py-1.5 bg-amber-500 text-[#020617] text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-amber-400 transition-all shadow-xl shadow-amber-500/10 active:scale-95"
        >
          Secure Premium Access
          <ChevronRight size={14} />
        </Link>
    </div>
  );
}
