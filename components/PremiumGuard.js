'use client';

import { useAuth } from '@/context/AuthContext';
import styles from './PremiumGuard.module.css';

export default function PremiumGuard({ children, fallback, featureName = 'This feature' }) {
    const { user, loading } = useAuth();
    const isPremium = user?.profile?.subscriptionTier === 'Premium' || process.env.NODE_ENV === 'development';

    if (loading) return null;

    if (isPremium) {
        return children;
    }

    if (fallback) {
        return fallback;
    }

    return (
        <div className={styles.premiumOverlay}>
            <div className={styles.premiumContent}>
                <span className={styles.premiumBadge}>PREMIUM</span>
                <h3>{featureName} is a Premium Feature</h3>
                <p>Upgrade to the Premium tier to unlock advanced analytics and automated imports.</p>
                <button 
                    className="btn btn-primary"
                    onClick={() => window.dispatchEvent(new CustomEvent('open-pricing-modal'))}
                >
                    Upgrade Now ✨
                </button>
            </div>
            <div className={styles.blurredChildren}>
                {children}
            </div>
        </div>
    );
}
