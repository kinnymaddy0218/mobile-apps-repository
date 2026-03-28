import { getProposalWeights } from '@/lib/calculations';
import { normalizeCategory } from '@/lib/categories';

export default function FullReportModal({ isOpen, onClose, metrics }) {
    if (!isOpen) return null;

    const { alpha, beta, returns, funds, profile, benchmarks } = metrics;
    const riskAppetite = profile?.riskAppetite || 'Moderate';
    const horizon = profile?.investmentHorizon || 5;
    const periodKey = horizon >= 10 ? '10yr' : (horizon >= 5 ? '5yr' : (horizon >= 3 ? '3yr' : '1yr'));

    // Get Data-Driven Target Weights from Profile Strategy
    const targets = getProposalWeights(riskAppetite, horizon);

    // Group funds by category (Equity, Debt, Gold) using unified normalization
    const categorizedFunds = funds.map(f => {
        const normalized = normalizeCategory(f.category, f.schemeName).toLowerCase();
        
        let type = 'debt';
        if (normalized.startsWith('equity') || normalized.startsWith('hybrid')) {
            type = 'equity';
        } else if (normalized.startsWith('metals')) {
            type = 'gold';
        } else if (normalized.startsWith('debt')) {
            type = 'debt';
        }
        
        return { ...f, type };
    });

    const currentEquity = categorizedFunds.filter(f => f.type === 'equity').reduce((sum, f) => sum + f.weight, 0);
    const currentDebt = categorizedFunds.filter(f => f.type === 'debt').reduce((sum, f) => sum + f.weight, 0);
    const currentGold = categorizedFunds.filter(f => f.type === 'gold').reduce((sum, f) => sum + f.weight, 0);

    // Rebalancing Algorithm: 
    // 1. Calculate Target for each Fund Type
    // 2. Rank funds within each type
    // 3. If no funds, use Benchmark placeholder
    const rebalance = () => {
        const result = [];
        const types = ['equity', 'debt', 'gold'];

        types.forEach(type => {
            const typeTarget = targets[type];
            const typeFunds = categorizedFunds.filter(f => f.type === type);
            
            if (typeFunds.length === 0) {
                // Add Benchmark placeholder for unallocated asset class
                result.push({
                    schemeName: `Benchmark ${type.charAt(0).toUpperCase() + type.slice(1)} Index`,
                    weight: 0,
                    recommendedWeight: typeTarget,
                    type,
                    isBenchmark: true
                });
                return;
            }

            // Sort by Alpha (most factual market edge) if available, else CAGR
            const sorted = [...typeFunds].sort((a, b) => {
                const getRet = (f) => {
                    let r = 0;
                    if (horizon >= 10) r = f.tenYearReturn;
                    else if (horizon >= 5) r = f.fiveYearReturn;
                    else if (horizon >= 3) r = f.threeYearReturn;
                    else r = f.oneYearReturn;
                    
                    if (!r && benchmarks) {
                        if (f.type === 'equity') r = benchmarks.equity[periodKey] || 12;
                        else if (f.type === 'gold') r = benchmarks.gold[periodKey] || 8;
                        else r = benchmarks.debt[periodKey] || 6;
                    }
                    return r || 0;
                };

                const aRet = getRet(a);
                const bRet = getRet(b);
                return (b.alpha - a.alpha) || (bRet - aRet);
            });
            
            if (sorted.length === 1) {
                result.push({ ...sorted[0], recommendedWeight: typeTarget });
            } else {
                const leadWeight = typeTarget * 0.6;
                const otherWeight = (typeTarget - leadWeight) / (sorted.length - 1);
                
                sorted.forEach((f, i) => {
                    result.push({ 
                        ...f, 
                        recommendedWeight: i === 0 ? leadWeight : otherWeight 
                    });
                });
            }
        });

        return result;
    };

    const recommendedFunds = rebalance();

    // Simulation Result: Using Dynamic Principal and Compound Interest
    const principal = metrics.totalValuation || 100000;
    // Compound Interest Formula: A = P(1 + r)^t
    const projectedValue = principal * Math.pow(1 + (returns / 100), horizon);
    const profit = projectedValue - principal;

    const optimizedReturns = recommendedFunds.reduce((sum, f) => {
        let fundReturn = 0;
        if (f.isBenchmark) {
            if (benchmarks) {
                if (f.type === 'equity') fundReturn = benchmarks.equity[periodKey] || 12;
                else if (f.type === 'gold') fundReturn = benchmarks.gold[periodKey] || 8;
                else fundReturn = benchmarks.debt[periodKey] || 6;
            } else {
                fundReturn = f.type === 'equity' ? 12 : (f.type === 'gold' ? 8 : 6);
            }
        } else {
            if (horizon >= 10) fundReturn = f.tenYearReturn;
            else if (horizon >= 5) fundReturn = f.fiveYearReturn;
            else if (horizon >= 3) fundReturn = f.threeYearReturn;
            else fundReturn = f.oneYearReturn;

            // Fallback to benchmark
            if (!fundReturn && benchmarks) {
                if (f.type === 'equity') fundReturn = benchmarks.equity[periodKey] || 12;
                else if (f.type === 'gold') fundReturn = benchmarks.gold[periodKey] || 8;
                else fundReturn = benchmarks.debt[periodKey] || 6;
            }
        }

        return sum + (fundReturn * (f.recommendedWeight / 100));
    }, 0);

    const optimizedProjectedValue = principal * Math.pow(1 + (optimizedReturns / 100), horizon);
    const potentialBenefit = optimizedProjectedValue - projectedValue;
    const returnImprovement = optimizedReturns - returns;

    // RISK ADJUSTED INTELLIGENCE
    const optimizedAlpha = recommendedFunds.reduce((sum, f) => {
        const val = f.isBenchmark ? 0 : (f.alpha || 0);
        return sum + (val * (f.recommendedWeight / 100));
    }, 0);

    const optimizedBeta = recommendedFunds.reduce((sum, f) => {
        let val = 1.0; // Default for Benchmarks
        if (!f.isBenchmark) val = f.beta || 1.0;
        else if (f.type === 'debt') val = 0.1;
        else if (f.type === 'gold') val = 0.2;
        return sum + (val * (f.recommendedWeight / 100));
    }, 0);

    const currentEfficiency = beta > 0 ? (alpha / beta) : 0;
    const optimizedEfficiency = optimizedBeta > 0 ? (optimizedAlpha / optimizedBeta) : 0;

    // 3. ADVANCED ATTRIBUTION LOGIC & STAY COURSE CHECK
    const currentStressLoss = -20 * beta;
    const optimizedStressLoss = -20 * optimizedBeta;
    const isSuperiorAlignment = currentEfficiency >= (optimizedEfficiency * 0.95);
    const isRiskierProposed = Math.abs(optimizedStressLoss) > Math.abs(currentStressLoss);

    const attribution = categorizedFunds.map(f => ({
        ...f,
        riskContribution: (f.weight * (f.beta || 1.0)) / 100,
        alphaContribution: (f.weight * (f.alpha || 0)) / 100
    })).sort((a, b) => b.riskContribution - a.riskContribution);

    const volatilityLeader = attribution[0];
    const alphaHero = [...attribution].sort((a, b) => b.alphaContribution - a.alphaContribution)[0];

    // Style Drift Monitor: Check if current beta matches the intended strategy
    const getStyleRange = (style) => {
        if (style === 'Conservative') return { min: 0.0, max: 0.7 };
        if (style === 'Moderate') return { min: 0.7, max: 1.1 };
        return { min: 1.1, max: 2.0 };
    };
    const styleRange = getStyleRange(riskAppetite);
    const isDrifting = beta < styleRange.min || beta > styleRange.max;

    // Drifting trigger: Is any asset class off by > 5%?
    const hasAssetDrift = Math.abs(currentEquity - targets.equity) > 5 || 
                         Math.abs(currentDebt - targets.debt) > 5;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div 
                onClick={e => e.stopPropagation()}
                style={{
                    backgroundColor: '#0a0e1a',
                    width: '100%',
                    maxWidth: '800px',
                    maxHeight: '90vh',
                    borderRadius: '24px',
                    border: '1px solid rgba(99, 102, 241, 0.4)',
                    boxShadow: '0 25px 70px -10px rgba(0, 0, 0, 0.8)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    animation: 'modalSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '24px 32px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'linear-gradient(to right, rgba(99, 102, 241, 0.1), transparent)'
                }}>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#fff', margin: 0 }}>
                            <span style={{ marginRight: '12px' }}>📊</span>
                            AlphaEngine Deep Analysis
                        </h2>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                            <p style={{ fontSize: '10px', color: '#94a3b8', margin: 0, textTransform: 'uppercase', letterSpacing: '2px' }}>
                                Institutional Grade Portfolio Report v2.1
                            </p>
                            {isSuperiorAlignment && (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                    <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '2px 8px', borderRadius: '4px', fontSize: '9px', fontWeight: '900', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                        ✨ SUPERIOR ALIGNMENT
                                    </span>
                                    <span style={{ fontSize: '8px', color: '#64748b', marginTop: '4px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        Efficiency: {currentEfficiency.toFixed(2)} vs {optimizedEfficiency.toFixed(2)} Target
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: 'none',
                        color: '#94a3b8',
                        fontSize: '24px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>×</button>
                </div>

                {/* Content */}
                <div style={{ padding: '32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>

                    {/* Top Stats Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '20px' }}>
                        <div className="card-flat" title="Alpha measures the excess return of an investment relative to the return of a benchmark index. Skill factor." style={{ padding: '24px 20px', borderRadius: '20px', border: '1px solid rgba(16, 185, 129, 0.2)', backgroundColor: 'rgba(16, 185, 129, 0.05)', cursor: 'help', textAlign: 'center', transition: 'all 0.3s ease' }}>
                            <div style={{ fontSize: '11px', color: '#10b981', fontWeight: '900', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '1px' }}>Weighted Alpha ⓘ</div>
                            <div style={{ fontSize: '2rem', fontWeight: '900', color: '#10b981', lineHeight: '1' }}>{alpha.toFixed(2)}</div>
                            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '8px', fontWeight: '600' }}>Market Edge (3Y)</div>
                        </div>
                        <div className="card-flat" title="Beta measures a fund's sensitivity to market movements. 1.0 means it moves with the market." style={{ padding: '24px 20px', borderRadius: '20px', border: '1px solid rgba(59, 130, 246, 0.2)', backgroundColor: 'rgba(59, 130, 246, 0.05)', cursor: 'help', textAlign: 'center', transition: 'all 0.3s ease' }}>
                            <div style={{ fontSize: '11px', color: '#3b82f6', fontWeight: '900', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '1px' }}>Weighted Beta ⓘ</div>
                            <div style={{ fontSize: '2rem', fontWeight: '900', color: '#3b82f6', lineHeight: '1' }}>{beta.toFixed(2)}</div>
                            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '8px', fontWeight: '600' }}>Volatility DNA (3Y)</div>
                        </div>
                        <div className="card-flat" style={{ padding: '24px 20px', borderRadius: '20px', border: '1px solid rgba(139, 92, 246, 0.2)', backgroundColor: 'rgba(139, 92, 246, 0.05)', textAlign: 'center' }}>
                            <div style={{ fontSize: '11px', color: '#8b5cf6', fontWeight: '900', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '1px' }}>{horizon}Y Forecast</div>
                            <div style={{ fontSize: '2rem', fontWeight: '900', color: '#8b5cf6', lineHeight: '1' }}>{returns.toFixed(2)}%</div>
                            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '8px', fontWeight: '600' }}>Projected CAGR</div>
                        </div>
                        <div className="card-flat" style={{ padding: '24px 20px', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.03)', textAlign: 'center' }}>
                            <div style={{ fontSize: '11px', color: '#fff', fontWeight: '900', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '1px' }}>Net Variance</div>
                            <div style={{ fontSize: '2rem', fontWeight: '900', color: (metrics.variance1m || 0) < 0 ? '#ef4444' : '#fff', lineHeight: '1' }}>
                                {metrics.variance1m >= 0 ? '+' : ''}{(metrics.variance1m || 0).toFixed(2)}%
                            </div>
                            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '8px', fontWeight: '600' }}>30-Day Change</div>
                        </div>
                    </div>

                    {/* Simulation Result: Dynamic Principal Growth */}
                    <div style={{ padding: '24px', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        <div>
                            <h3 style={{ fontSize: '10px', color: '#94a3b8', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '2px' }}>Value After {horizon}y (Current)</h3>
                            <div style={{ fontSize: '24px', fontWeight: '800', color: '#fff' }}>₹{projectedValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                            <p style={{ fontSize: '10px', color: profit < 0 ? '#ef4444' : '#10b981', margin: '4px 0 0 0', fontWeight: '700' }}>
                                Principal: ₹{principal.toLocaleString('en-IN', { maximumFractionDigits: 0 })} • Compounded
                            </p>
                        </div>
                        <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.05)', paddingLeft: '24px' }}>
                            <h3 style={{ fontSize: '10px', color: isSuperiorAlignment ? '#10b981' : '#6366f1', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '2px' }}>
                                {isSuperiorAlignment ? 'Strategic Maintenance' : `Value After ${horizon}y (Optimized)`}
                            </h3>
                            <div style={{ fontSize: '24px', fontWeight: '800', color: isSuperiorAlignment ? '#10b981' : '#6366f1' }}>
                                ₹{(isSuperiorAlignment ? projectedValue : optimizedProjectedValue).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </div>
                            <p style={{ fontSize: '10px', color: isSuperiorAlignment ? '#94a3b8' : (potentialBenefit > 0 ? '#10b981' : '#f59e0b'), margin: '4px 0 0 0', fontWeight: '700' }}>
                                {isSuperiorAlignment 
                                    ? "Stay the Course - Alignment is Optimal" 
                                    : `Optimized CAGR: ${optimizedReturns.toFixed(2)}% ${potentialBenefit > 0 
                                        ? `(+₹${potentialBenefit.toLocaleString('en-IN', { maximumFractionDigits: 0 })})` 
                                        : `(Risk-Adjusted Profile)`}`}
                            </p>
                        </div>
                    </div>

                    {/* Strategy Efficiency & Protection */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div style={{ padding: '20px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.05)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase' }}>Efficiency Index (Alpha/Beta)</div>
                                <div style={{ fontSize: '10px', color: optimizedEfficiency >= currentEfficiency ? '#10b981' : '#94a3b8', fontWeight: '700' }}>
                                    {isSuperiorAlignment ? '🎯 Optimal' : (optimizedEfficiency >= currentEfficiency ? '↑ Improved' : '— Balanced')}
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                <span style={{ fontSize: '20px', fontWeight: '800', color: '#fff' }}>{currentEfficiency.toFixed(2)}</span>
                                <span style={{ fontSize: '10px', color: '#64748b' }}>Current Benchmark</span>
                            </div>
                            <p style={{ fontSize: '9px', color: '#64748b', margin: '8px 0 0 0' }}>Excess return earned per unit of market sensitivity.</p>
                        </div>
                        <div style={{ padding: '20px', borderRadius: '16px', border: '1px solid rgba(245, 158, 11, 0.2)', backgroundColor: 'rgba(245, 158, 11, 0.03)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <div style={{ fontSize: '10px', color: '#f59e0b', fontWeight: '800', textTransform: 'uppercase' }}>Market Stress Test (-20% Drop)</div>
                                <div style={{ fontSize: '10px', color: '#10b981', fontWeight: '700' }}>
                                    {isSuperiorAlignment ? '🛡️ Best in Class' : (Math.abs(optimizedStressLoss) < Math.abs(currentStressLoss) ? '🛡️ Better Protected' : '⚠️ Higher Exposure')}
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                <span style={{ fontSize: '20px', fontWeight: '800', color: '#f59e0b' }}>{currentStressLoss.toFixed(1)}%</span>
                                <span style={{ fontSize: '10px', color: '#64748b' }}>Current Exposure</span>
                            </div>
                            <p style={{ fontSize: '9px', color: '#64748b', margin: '8px 0 0 0' }}>Estimated portfolio impact during a major market correction.</p>
                        </div>
                    </div>

                    {/* NEW: Rebalancing Roadmap & DNA Integrity */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <h3 style={{ fontSize: '10px', color: '#94a3b8', margin: 0, textTransform: 'uppercase', letterSpacing: '2px' }}>🎯 Rebalancing Roadmap</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                            <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Allocation Drift</div>
                                <div style={{ fontSize: '14px', fontWeight: '700', color: hasAssetDrift ? '#f59e0b' : '#10b981', marginBottom: '4px' }}>
                                    {hasAssetDrift ? '⚠️ Rebalance Triggered' : '✅ Within Bounds'}
                                </div>
                                <div style={{ fontSize: '9px', color: '#475569' }}>
                                    Equity: {currentEquity.toFixed(1)}% (Target: {targets.equity}%)
                                </div>
                            </div>
                            <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>DNA Integrity</div>
                                <div style={{ fontSize: '14px', fontWeight: '700', color: isDrifting ? (isSuperiorAlignment ? '#f59e0b' : '#ef4444') : '#10b981', marginBottom: '4px' }}>
                                    {isDrifting ? '🧬 Style Drift' : '🧬 Style Anchored'}
                                </div>
                                <div style={{ fontSize: '9px', color: '#475569' }}>
                                    Beta: {beta.toFixed(2)} (Target: {styleRange.min}-{styleRange.max})
                                </div>
                            </div>
                            <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Next Review</div>
                                <div style={{ fontSize: '14px', fontWeight: '700', color: '#3b82f6' }}>{new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</div>
                                <div style={{ fontSize: '9px', color: '#475569', marginTop: '4px' }}>Quarterly sanity check</div>
                            </div>
                        </div>
                    </div>

                    {/* NEW: 80/20 Risk Attribution */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div style={{ padding: '20px', borderRadius: '20px', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), transparent)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                            <div style={{ fontSize: '10px', color: '#ef4444', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px' }}>📊 Volatility Leader (Highest Risk)</div>
                            <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{volatilityLeader?.schemeName}</div>
                            <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
                                Contributes <strong>{(volatilityLeader?.riskContribution / beta * 100).toFixed(0)}%</strong> of total portfolio risk.
                            </div>
                        </div>
                        <div style={{ padding: '20px', borderRadius: '20px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), transparent)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                            <div style={{ fontSize: '10px', color: '#10b981', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px' }}>🏆 Alpha Hero (Top Performer)</div>
                            <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{alphaHero?.schemeName}</div>
                            <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
                                Generates <strong>{(alphaHero?.alphaContribution / (alpha || 1) * 100).toFixed(0)}%</strong> of net excess returns.
                            </div>
                        </div>
                    </div>

                    {/* Breakdown Table */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '0.875rem', fontWeight: '800', color: isSuperiorAlignment ? '#10b981' : '#fff', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                {isSuperiorAlignment ? 'Tactical Fine-tuning (Optional)' : 'AlphaEngine Optimizer Suggestions'}
                            </h3>
                            <div style={{ fontSize: '10px', color: '#6366f1', background: 'rgba(99, 102, 241, 0.1)', padding: '4px 10px', borderRadius: '20px', fontWeight: '700' }}>
                                PROFILE: {riskAppetite.toUpperCase()}
                            </div>
                        </div>
                        <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.05)', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                                    <tr>
                                        <th style={{ padding: '12px 20px', fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Fund Name</th>
                                        <th style={{ padding: '12px 20px', fontSize: '10px', color: '#64748b', textTransform: 'uppercase', textAlign: 'center' }}>Current %</th>
                                        <th style={{ padding: '12px 20px', fontSize: '10px', color: '#10b981', textTransform: 'uppercase', textAlign: 'center' }}>Ideal %</th>
                                        <th style={{ padding: '12px 20px', fontSize: '10px', color: '#64748b', textTransform: 'uppercase', textAlign: 'center' }}>Delta</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recommendedFunds.filter(f => f.weight > 0 || f.recommendedWeight > 0).map((fund, idx) => (
                                        <tr key={idx} style={{ borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                                            <td style={{ padding: '12px 20px', fontSize: '12px', color: '#fff', fontWeight: '600' }}>{fund.schemeName}</td>
                                            <td style={{ padding: '12px 20px', fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>{fund.weight.toFixed(2)}%</td>
                                            <td style={{ padding: '12px 20px', fontSize: '12px', color: '#10b981', textAlign: 'center', fontWeight: '700' }}>{fund.recommendedWeight.toFixed(2)}%</td>
                                            <td style={{ padding: '12px 20px', fontSize: '12px', color: fund.recommendedWeight > fund.weight ? '#10b981' : fund.recommendedWeight < fund.weight ? '#ef4444' : '#64748b', textAlign: 'center' }}>
                                                {fund.recommendedWeight > fund.weight ? `+${(fund.recommendedWeight - fund.weight).toFixed(2)}` : (fund.recommendedWeight - fund.weight).toFixed(2)}%
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* AI Interpretation */}
                    <div style={{ padding: '24px', backgroundColor: 'rgba(99, 102, 241, 0.05)', borderRadius: '20px', border: '1px solid rgba(99, 102, 241, 0.2)', position: 'relative' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <div className="animate-pulse" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)' }}></div>
                            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#6366f1', margin: 0 }}>AI Tactical Interpretation</h3>
                        </div>
                        <p style={{ fontSize: '14px', color: '#e2e8f0', lineHeight: '1.7', margin: 0 }}>
                            {Math.abs(returnImprovement) < 0.01 && Math.abs(optimizedBeta - beta) < 0.05 ? (
                                <span>
                                    <strong style={{ color: '#94a3b8' }}>✨ Optimal Alignment (Verdict: No Action):</strong> Your current portfolio is perfectly mathematically aligned with your target benchmark. No changes are required.
                                </span>
                            ) : returnImprovement > 0 && optimizedBeta <= beta ? (
                                <span>
                                    <strong style={{ color: '#10b981' }}>✅ Alpha Upgrade (Verdict: Strongly Recommended):</strong> The AlphaEngine has identified structural inefficiencies. Rebalancing will increase your annual returns by <strong>{returnImprovement.toFixed(2)}%</strong> while <strong>lowering</strong> your market risk. <strong>We advise rebalancing.</strong>
                                </span>
                            ) : returnImprovement < -0.1 && (optimizedBeta > (beta - 0.1)) ? (
                                <span>
                                    <strong style={{ color: '#10b981' }}>✨ Superior Custom Strategy (Verdict: Maintain Holdings):</strong> Congratulations—your specific selection of funds is mathematically beating the standard {riskAppetite} benchmark. Switching to optimized weights would actually <strong>decrease your annual returns</strong> by <strong>{Math.abs(returnImprovement).toFixed(2)}%</strong>. <strong>Verdict: Keep your current holdings—no rebalancing is recommended.</strong>
                                </span>
                            ) : returnImprovement > 0 && optimizedBeta > beta ? (
                                <span>
                                    <strong style={{ color: '#f59e0b' }}>⚖️ Growth Expansion (Verdict: Optional Upgrade):</strong> You can increase your annual returns by <strong>{returnImprovement.toFixed(2)}%</strong>, but this requires shifting to a higher-speed behavior (Beta increases from {beta.toFixed(2)} to {optimizedBeta.toFixed(2)}). <strong>Verdict: Only rebalance if you have a longer investment horizon ({'>'}7 years) and can handle bigger market dips.</strong>
                                </span>
                            ) : (
                                <span>
                                    <strong style={{ color: '#3b82f6' }}>🛡️ Capital Preservation (Verdict: Defensive Shift):</strong> While returns may soften by <strong>{Math.abs(returnImprovement).toFixed(2)}%</strong>, your absolute downside protection is significantly hardened. <strong>Verdict: Only rebalance if you wish to reduce your market sensitivity and risk exposure.</strong>
                                </span>
                            )}
                        </p>
                        
                        <div style={{ marginTop: '24px', padding: '20px', borderRadius: '16px', backgroundColor: 'rgba(0, 0, 0, 0.4)', fontSize: '13px', color: '#cbd5e1', borderLeft: '4px solid #6366f1', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)', lineHeight: '1.6' }}>
                            <strong style={{ color: '#6366f1', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>Strategic Context & Philosophy</strong>
                            To help you understand simply: Think of your <strong>Equity Allocation</strong> as your engine size (how much power you have), and <strong>DNA (Beta {beta.toFixed(2)})</strong> as your driving speed (how fast you react to market curves). 
                            Even with a {riskAppetite === 'Aggressive' ? 'high-performance' : riskAppetite === 'Conservative' ? 'stable/compact' : 'balanced'} engine, your specific funds are currently <strong>{beta < 0.7 ? 'defensively positioned for safety' : beta > 1.1 ? 'geared for high-octane speed' : 'perfectly balanced for all conditions'}</strong>. 
                            If your verdict is <span style={{ color: '#10b981', fontWeight: '800' }}>"Maintain,"</span> it means your custom driving style is already more efficient than the standard roadmap.
                        </div>

                        <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '11px', color: '#64748b', textAlign: 'center', fontStyle: 'italic', lineHeight: '1.6', maxWidth: '600px', margin: '32px auto 0 auto' }}>
                            <strong style={{ color: '#94a3b8', fontStyle: 'normal' }}>Regulatory Disclosure:</strong> This analysis is generated by an automated intelligence engine for educational and informational purposes only. Antigravity is not a SEBI-registered investment advisor. Mutual fund investments are subject to market risks; please read all scheme-related documents carefully. This report does not constitute personalized financial advice.
                        </div>
                    </div>

                    {/* Methodology Footer */}
                    <div style={{ marginTop: '8px', padding: '16px', borderTop: '1px solid rgba(255,255,255,0.03)', textAlign: 'center' }}>
                        <p style={{ fontSize: '9px', color: '#475569', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Technical Methodology: Data sourced via MFAPI.in (NAV History) • Risk Metrics computed via 3-Year Daily Rolling Window • Projections assume compounded CAGR over {horizon}Y horizon • AlphaEngine v2.1 Model.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div style={{ padding: '24px 32px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'center' }}>
                    <button
                        onClick={onClose}
                        className="btn btn-primary"
                        style={{ padding: '12px 48px', borderRadius: '12px', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '1px' }}
                    >
                        Close Report
                    </button>
                </div>
            </div>
            <style jsx>{`
                @keyframes modalSlideIn {
                    from { opacity: 0; transform: scale(0.95) translateY(20px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>
        </div>
    );
}
