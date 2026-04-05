'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Check, Zap, Crown, ShieldCheck, ArrowRight, Loader } from 'lucide-react';

const TIERS = [
  {
    id: 'monthly',
    name: 'Growth Pulse',
    price: '$9.99',
    period: 'monthly',
    description: 'Perfect for exploring specific investment strategies.',
    features: [
      'Full Portfolio X-Ray',
      'Daily NAV Refresh',
      'Advanced Risk Metrics',
      'Market Discovery Pulse',
      'Institutional Data Network'
    ],
    cta: 'Start Monthly'
  },
  {
    id: 'yearly',
    name: 'Institutional Pro',
    price: '$79.99',
    period: 'yearly',
    description: 'The preferred choice for long-term intelligence engineering.',
    features: [
      'Everything in Pulse',
      'Priority Research Node',
      'Custom Risk Scenarios',
      'Early Access Features',
      '25% Savings vs Monthly'
    ],
    cta: 'Go Pro Yearly',
    highlight: true
  }
];

export default function SubscriptionManager() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const isPremium = user?.profile?.isPremium;
  const isFoundingMember = user?.profile?.isFoundingMember;

  const handleSubscribe = async (tierId) => {
    setLoading(true);
    // Placeholder for Native IAP (Apple/Google)
    console.log(`Initiating IAP for: ${tierId}`);
    
    // In a real app, this would call:
    // await window.IAP.buy(tierId);
    
    setTimeout(() => {
      alert('In-App Purchase flow would trigger here on the Mobile App Store.');
      setLoading(false);
    }, 1500);
  };

  if (isFoundingMember) {
    return (
      <div className="p-8 bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20 rounded-[2.5rem] border border-indigo-500/30 text-center">
        <div className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/50">
          <Crown className="text-white" size={32} />
        </div>
        <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter italic">Founding Member Status</h2>
        <p className="text-indigo-200/70 text-sm max-w-md mx-auto mb-6">
          Your account is verified as a cornerstone of the platform. You have permanent, unrestricted access to all Institutional Intelligence features.
        </p>
        <div className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-500/10 rounded-full w-fit mx-auto border border-indigo-500/20">
          <ShieldCheck className="text-indigo-400" size={16} />
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">LIFETIME ALPHA SECURED</span>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto p-4">
      {TIERS.map((tier) => (
        <div 
          key={tier.id}
          className={`relative flex flex-col p-8 rounded-[3rem] border transition-all duration-500 ${
            tier.highlight 
              ? 'bg-[#0f172a] border-indigo-500/50 shadow-2xl shadow-indigo-500/20 scale-[1.02]' 
              : 'bg-[#0f172a]/50 border-white/5 hover:border-white/10'
          }`}
        >
          {tier.highlight && (
            <div className="absolute -top-4 right-8 bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-4 py-1.5 rounded-full text-[10px] font-black text-white uppercase tracking-widest shadow-lg">
              Most Popular
            </div>
          )}

          <div className="mb-8">
            <h3 className="text-xl font-black text-white uppercase tracking-tighter italic mb-1">{tier.name}</h3>
            <p className="text-slate-400 text-xs leading-relaxed">{tier.description}</p>
          </div>

          <div className="mb-8 flex items-baseline gap-1">
            <span className="text-4xl font-black text-white tracking-tighter">{tier.price}</span>
            <span className="text-slate-500 text-sm">/{tier.period}</span>
          </div>

          <div className="space-y-4 mb-10 flex-1">
            {tier.features.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="p-1 bg-emerald-500/10 rounded-full">
                  <Check className="text-emerald-400" size={14} />
                </div>
                <span className="text-slate-300 text-sm font-medium">{feature}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => handleSubscribe(tier.id)}
            disabled={loading || isPremium}
            className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${
              tier.highlight
                ? 'bg-indigo-500 text-white shadow-xl shadow-indigo-500/30 hover:bg-indigo-400'
                : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
            }`}
          >
            {loading ? <Loader className="animate-spin" size={18} /> : <Zap size={18} className={tier.highlight ? 'fill-white' : 'fill-indigo-400'} />}
            {isPremium ? 'Active Plan' : tier.cta}
          </button>
        </div>
      ))}
    </div>
  );
}
