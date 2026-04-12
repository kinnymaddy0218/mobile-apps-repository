'use client';

import { useAuth } from '@/context/AuthContext';
import { Crown, Zap, Clock, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import PricingModal from '../Portfolio/PricingModal';

export default function SubscriptionBanner() {
    const { user, loading } = useAuth();
    const [showPricing, setShowPricing] = useState(false);

    if (loading || !user) return null;

    const profile = user.profile || {};
    const { isPremium, isTrialActive, trialDaysLeft, isFoundingMember } = profile;

    // View states
    const isFreeExpired = !isPremium && !isTrialActive;
    const isTrial = !isPremium && isTrialActive;

    return (
        <>
            <div className="px-4 py-6 mt-auto">
                <div 
                    onClick={() => setShowPricing(true)}
                    className={`relative p-4 rounded-2xl cursor-pointer transition-all duration-500 overflow-hidden group 
                    ${isPremium 
                        ? 'bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/30' 
                        : isTrial 
                            ? 'bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/30'
                            : 'bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50'
                    }`}
                >
                    {/* Animated Glow Background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />

                    <div className="flex items-center gap-3 relative z-10">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center 
                            ${isPremium ? 'bg-indigo-500/20 text-indigo-400' : isTrial ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700/50 text-slate-500'}`}
                        >
                            {isPremium ? <Crown size={20} /> : <Zap size={20} />}
                        </div>
                        
                        <div className="flex-1">
                            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--text-primary)] mb-0.5">
                                {isFoundingMember ? 'Founding Member' : isPremium ? 'Premium Intel' : isTrial ? 'Institutional Trial' : 'Free Tier'}
                            </h4>
                            <p className="text-[10px] text-[var(--text-secondary)] font-medium">
                                {isPremium 
                                    ? 'Unlimited Pulse Active' 
                                    : isTrial 
                                        ? `${trialDaysLeft} Days Remaining` 
                                        : 'Upgrade to Unlock Pulse'}
                            </p>
                        </div>
                        
                        <ChevronRight size={14} className="text-[var(--text-muted)] opacity-50 group-hover:translate-x-1 transition-transform" />
                    </div>

                    {isTrial && (
                        <div className="mt-3 relative z-10">
                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-1000"
                                    style={{ width: `${(trialDaysLeft / 7) * 100}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <PricingModal 
                isOpen={showPricing} 
                onClose={() => setShowPricing(false)} 
            />
        </>
    );
}
