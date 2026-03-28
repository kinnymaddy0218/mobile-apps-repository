import { useState, useRef, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { getProposalWeights } from '@/lib/calculations';

export default function ProfileSettings({ user, sharedBenchmarks }) {
    const [updating, setUpdating] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const profile = user?.profile || {};
    
    // Local state for immediate feedback
    const [horizon, setHorizon] = useState(profile.investmentHorizon || 5);
    const benchmarks = sharedBenchmarks;

    const GOALS = [
        { id: 'Wealth Creation', label: 'Wealth Creation', icon: '💰' },
        { id: 'Retirement', label: 'Retirement Planning', icon: '🏖️' },
        { id: 'Tax Saving', label: 'Tax Saving (ELSS)', icon: '📑' },
        { id: 'Emergency Fund', label: 'Emergency Fund', icon: '🛡️' },
        { id: 'Child Education', label: 'Child Education', icon: '🎓' }
    ];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Sync local horizon with profile changes
    useEffect(() => {
        if (profile.investmentHorizon) {
            setHorizon(profile.investmentHorizon);
        }
    }, [profile.investmentHorizon]);

    const calculateProposal = () => {
        const risk = profile.riskAppetite || 'Moderate';
        const years = horizon;
        
        const { equity, debt, gold, strategy } = getProposalWeights(risk, years);
        let returns = 0;

        // Data-driven return calculation
        if (benchmarks) {
            const periodKey = years >= 10 ? '10yr' : (years >= 5 ? '5yr' : (years >= 3 ? '3yr' : '1yr'));
            const equityRet = benchmarks.equity[periodKey] || benchmarks.equity['5yr'] || 12;
            const debtRet = benchmarks.debt[periodKey] || benchmarks.debt['1yr'] || 6;
            const goldRet = benchmarks.gold[periodKey] || benchmarks.gold['1yr'] || 8;

            returns = (equity * equityRet + debt * debtRet + gold * goldRet) / 100;
        } else {
            // Fallback to conservative estimates if benchmark API fails
            returns = years < 3 ? 7.5 : (years < 7 ? 11.0 : 13.5);
        }

        return { equity, debt, gold, returns, strategy };
    };

    const proposal = calculateProposal();

    const updateProfile = async (field, value) => {
        if (!user) return;
        setUpdating(true);
        try {
            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, {
                [field]: value,
                lastUpdated: new Date().toISOString()
            });
        } catch (err) {
            console.error('Error updating profile:', err);
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="card card-glass overflow-visible">
            <h2 className="text-xl font-semibold mb-6 flex gap-sm items-center">
                <span>👤</span> Personalized Profile
            </h2>

            <div className="flex-col gap-lg" style={{ display: 'flex' }}>
                <div>
                    <label className="form-label uppercase tracking-widest" style={{ fontSize: '0.65rem', color: 'var(--accent-primary)', opacity: 0.8 }}>
                        Risk Appetite
                    </label>
                    <div className="grid grid-3 gap-sm w-full">
                        {['Conservative', 'Moderate', 'Aggressive'].map((level) => (
                            <button
                                key={level}
                                onClick={() => updateProfile('riskAppetite', level)}
                                disabled={updating}
                                className={`btn btn-sm ${profile.riskAppetite === level
                                    ? 'btn-primary'
                                    : 'btn-outline'
                                    }`}
                                style={{
                                    fontSize: '0.65rem',
                                    padding: '8px 4px',
                                    borderRadius: 'var(--radius-md)'
                                }}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="relative" ref={dropdownRef}>
                    <label className="form-label uppercase tracking-widest" style={{ fontSize: '0.65rem', color: 'var(--accent-primary)', opacity: 0.8 }}>
                        Main Investment Goal
                    </label>

                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        disabled={updating}
                        className="btn btn-outline w-full flex-between"
                        style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)' }}
                    >
                        <div className="flex items-center gap-sm">
                            <span style={{ fontSize: '1.2rem' }}>{GOALS.find(g => g.id === (profile.goal || 'Wealth Creation'))?.icon || '💰'}</span>
                            <span style={{ fontWeight: '600' }}>{profile.goal || 'Wealth Creation'}</span>
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
                    </button>

                    {isDropdownOpen && (
                        <div className="magic-results absolute w-full" style={{ top: '100%', left: 0, marginTop: '8px', zIndex: 1000 }}>
                            {GOALS.map((goal) => (
                                <button
                                    key={goal.id}
                                    onClick={() => {
                                        updateProfile('goal', goal.id);
                                        setIsDropdownOpen(false);
                                    }}
                                    className="magic-result-item w-full flex items-center gap-md"
                                    style={{
                                        padding: '12px 16px',
                                        textAlign: 'left',
                                        background: profile.goal === goal.id ? 'var(--accent-primary-soft)' : 'transparent',
                                        color: profile.goal === goal.id ? 'var(--accent-primary)' : 'var(--text-primary)'
                                    }}
                                >
                                    <span style={{ fontSize: '1.2rem' }}>{goal.icon}</span>
                                    <span style={{ fontWeight: '500' }}>{goal.label}</span>
                                    {profile.goal === goal.id && (
                                        <span style={{ marginLeft: 'auto', fontSize: '0.8rem' }}>✓</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div>
                    <div className="flex-between mb-2">
                        <label className="form-label uppercase tracking-widest" style={{ margin: 0, fontSize: '0.65rem', color: 'var(--accent-primary)', opacity: 0.8 }}>
                            Investment Horizon
                        </label>
                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{horizon} Years</span>
                    </div>
                    <input 
                        type="range"
                        min="1"
                        max="30"
                        value={horizon}
                        onChange={(e) => setHorizon(parseInt(e.target.value))}
                        onMouseUp={() => updateProfile('investmentHorizon', horizon)}
                        className="w-full"
                        style={{ accentColor: 'var(--accent-primary)', height: '4px', cursor: 'pointer' }}
                    />
                    <div className="flex-between mt-1" style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                        <span>1 yr</span>
                        <span>30 yrs</span>
                    </div>
                </div>

                <div className="card-flat" style={{ padding: '16px', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--accent-primary-soft)', background: 'rgba(99, 102, 241, 0.03)' }}>
                    <div className="flex items-center gap-sm mb-3">
                        <span style={{ fontSize: '1.1rem' }}>🎯</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Proposed Strategy</span>
                    </div>
                    
                    <div className="flex-between mb-4">
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--accent-primary)' }}>{proposal.returns.toFixed(1)}%</span>
                            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Est. Annual Return</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)' }}>{proposal.strategy}</span>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>MATCHED TO YOUR HORIZON</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px' }}>
                        <div style={{ width: `${proposal.equity}%`, background: 'var(--accent-primary)', transition: 'width 0.4s ease' }} title={`Equity: ${proposal.equity}%`}></div>
                        <div style={{ width: `${proposal.debt}%`, background: 'var(--accent-secondary)', transition: 'width 0.4s ease' }} title={`Debt: ${proposal.debt}%`}></div>
                        <div style={{ width: `${proposal.gold}%`, background: '#f59e0b', transition: 'width 0.4s ease' }} title={`Gold: ${proposal.gold}%`}></div>
                    </div>

                    <div className="grid grid-3 gap-xs">
                        <div className="flex items-center gap-xs">
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-primary)' }}></div>
                            <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Equity {proposal.equity}%</span>
                        </div>
                        <div className="flex items-center gap-xs">
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-secondary)' }}></div>
                            <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Debt {proposal.debt}%</span>
                        </div>
                        <div className="flex items-center gap-xs">
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></div>
                            <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Gold {proposal.gold}%</span>
                        </div>
                    </div>
                </div>

                <div style={{ paddingTop: '1.5rem', borderTop: '1px solid var(--border-primary)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="flex-between card-flat" style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <label className="form-label" style={{ margin: 0, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                Tier
                            </label>
                            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--accent-primary)' }}>ADMIN SIMULATOR</span>
                        </div>
                        <button
                            onClick={() => updateProfile('subscriptionTier', profile.subscriptionTier === 'Pro' ? 'Free' : 'Pro')}
                            className="btn btn-sm btn-outline"
                            style={{ padding: '4px 10px', fontSize: '0.65rem' }}
                        >
                            {profile.subscriptionTier === 'Pro' ? 'DISABLE PRO' : 'ENABLE PRO'}
                        </button>
                    </div>

                    <div className="card-flat" style={{ padding: '12px', borderRadius: 'var(--radius-lg)', position: 'relative', border: '1px solid var(--accent-primary-soft)' }}>
                        <div className="flex items-center gap-sm mb-2">
                            <div className="animate-pulse" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-primary)' }}></div>
                            <span style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>AI STATUS</span>
                            <span className="badge badge-accent" style={{ marginLeft: 'auto', fontSize: '0.6rem' }}>
                                {profile.subscriptionTier || 'Free'}
                            </span>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
                            {profile.subscriptionTier === 'Pro'
                                ? "Pro Unlocked! AlphaEngine is now prioritizing high-alpha opportunities and downside protection alerts."
                                : `Your ${profile.riskAppetite || 'Moderate'} profile is training our AI. Enable Pro to unlock real-time rebalancing alerts.`}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
