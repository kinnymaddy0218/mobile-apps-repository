'use client';

import { useState } from 'react';
import styles from './PricingModal.module.css';

export default function PricingModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    const plans = [
        {
            name: 'Institutional Alpha',
            price: '₹0',
            subtitle: 'Perfect for beginners',
            features: [
                'Manual Portfolio Entry',
                'Basic Asset Allocation',
                'Mutual Fund Search',
                'NAV History (Basic)',
                'Snapshot Analysis'
            ],
            btnText: 'Current Plan',
            disabled: true
        },
        {
            name: 'Institutional Intelligence',
            price: '₹599',
            period: '/mo',
            subtitle: 'Forensic-grade analytics',
            features: [
                'Unlimited CAS PDF Imports',
                'Forensic Risk Metrics (Alpha/Beta)',
                'Portfolio Stress Testing',
                'Stock & Sector Overlap Analysis',
                'Nightly Intelligence Pulse',
                'Premium "Magic Search" Suggestions',
                'Ad-free Experience',
                '1-on-1 Founding Member Support'
            ],
            btnText: 'Start 7-Day Free Trial ✨',
            popular: true,
            trial: true
        }
    ];

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onClose}>&times;</button>
                <div className={styles.header}>
                    <h2>Unlock Full Intelligence</h2>
                    <p>Choose the plan that fits your investment journey.</p>
                </div>

                <div className={styles.plansGrid}>
                    {plans.map(plan => (
                        <div key={plan.name} className={`${styles.planCard} ${plan.popular ? styles.popular : ''}`}>
                            {plan.popular && <span className={styles.popularBadge}>MOST POPULAR</span>}
                            <h3>{plan.name}</h3>
                            <p className={styles.subtitle}>{plan.subtitle}</p>
                            <div className={styles.price}>
                                <span className={styles.amount}>{plan.price}</span>
                                {plan.period && <span className={styles.period}>{plan.period}</span>}
                            </div>
                            <ul className={styles.features}>
                                {plan.features.map(f => (
                                    <li key={f}><span>✓</span> {f}</li>
                                ))}
                            </ul>
                            <button 
                                className={`btn ${plan.popular ? 'btn-primary' : 'btn-outline'} w-full mt-auto`}
                                disabled={plan.disabled}
                                onClick={() => alert('Razorpay integration coming soon! This would open the payment gateway.')}
                            >
                                {plan.btnText}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
