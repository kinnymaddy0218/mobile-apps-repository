'use client';

export default function InsightCard({ type, title, description, suggestedAction, actionText, onAction, isLocked }) {
    const getStyles = () => {
        switch (type) {
            case 'opportunity':
                return {
                    icon: '🚀',
                    bg: 'rgba(16, 185, 129, 0.1)',
                    border: 'rgba(16, 185, 129, 0.2)',
                    accent: '#10b981',
                    badge: 'Opportunity'
                };
            case 'risk':
                return {
                    icon: '⚠️',
                    bg: 'rgba(245, 158, 11, 0.1)',
                    border: 'rgba(245, 158, 11, 0.2)',
                    accent: '#f59e0b',
                    badge: 'Risk Alert'
                };
            case 'neutral':
            default:
                return {
                    icon: '💡',
                    bg: 'rgba(59, 130, 246, 0.1)',
                    border: 'rgba(59, 130, 246, 0.2)',
                    accent: '#3b82f6',
                    badge: 'Smart Insight'
                };
        }
    };

    const styles = getStyles();

    return (
        <div className="card-flat" style={{
            padding: '16px',
            borderRadius: '16px',
            border: `1px solid ${styles.border}`,
            backgroundColor: styles.bg,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            position: 'relative',
            overflow: 'hidden',
            transition: 'transform 0.2s ease',
            cursor: (onAction && !isLocked) ? 'pointer' : 'default'
        }}>
            <div className="flex-between" style={{ alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.25rem' }}>{isLocked ? '🔒' : styles.icon}</span>
                    <span style={{
                        fontSize: '10px',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        color: isLocked ? 'var(--text-muted)' : styles.accent
                    }}>
                        {isLocked ? 'PRO INSIGHT' : styles.badge}
                    </span>
                </div>
                {(actionText && !isLocked) && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onAction();
                        }}
                        style={{
                            fontSize: '10px',
                            fontWeight: '800',
                            textTransform: 'uppercase',
                            color: styles.accent,
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0
                        }}
                    >
                        {actionText} →
                    </button>
                )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <h4 style={{
                    fontSize: '0.875rem',
                    fontWeight: '700',
                    color: 'var(--text-primary)',
                    margin: 0,
                    lineHeight: '1.4'
                }}>
                    {title}
                </h4>
                <p style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    lineHeight: '1.5',
                    margin: 0,
                    fontStyle: 'italic',
                    filter: isLocked ? 'blur(4px)' : 'none',
                    opacity: isLocked ? 0.5 : 1,
                    userSelect: isLocked ? 'none' : 'auto'
                }}>
                    {description}
                </p>

                {suggestedAction && (
                    <div style={{
                        marginTop: '12px',
                        padding: '12px',
                        backgroundColor: 'var(--mask-light)',
                        borderRadius: '12px',
                        borderLeft: `3px solid ${isLocked ? 'var(--mask-heavy)' : styles.accent}`,
                        boxShadow: 'var(--shadow-sm)',
                        position: 'relative'
                    }}>
                        <div style={{
                            fontSize: '9px',
                            color: isLocked ? 'var(--text-muted)' : styles.accent,
                            fontWeight: '900',
                            textTransform: 'uppercase',
                            marginBottom: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            <span style={{ fontSize: '12px' }}>{isLocked ? '🔒' : '🎯'}</span> {isLocked ? 'LOCKED STRATEGY' : 'AI Technical Directive'}
                        </div>
                        <p style={{ 
                            fontSize: '11px', 
                            color: 'var(--text-primary)', 
                            margin: 0, 
                            fontWeight: '600', 
                            lineHeight: '1.4',
                            filter: isLocked ? 'blur(5px)' : 'none',
                            opacity: isLocked ? 0.3 : 1,
                            userSelect: isLocked ? 'none' : 'auto'
                        }}>
                            {suggestedAction}
                        </p>
                    </div>
                )}
            </div>

            <div className="flex-between" style={{
                marginTop: 'auto',
                paddingTop: '8px',
                borderTop: '1px solid var(--mask-medium)'
            }}>
                <span className="font-mono" style={{
                    fontSize: '9px',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                }}>
                    {isLocked ? 'UPGRADE TO ALPHAENGINE PRO' : 'Verified by AlphaEngine v2.1'}
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} style={{
                            width: '4px',
                            height: '4px',
                            borderRadius: '50%',
                             backgroundColor: isLocked ? 'var(--mask-heavy)' : styles.accent,
                            opacity: i === 1 ? 1 : 0.3
                        }}></div>
                    ))}
                </div>
            </div>
        </div>
    );
}
