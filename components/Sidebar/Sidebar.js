'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import styles from './Sidebar.module.css';

const navItems = [
    { href: '/', label: 'Dashboard', icon: '📊' },
    { href: '/portfolio', label: 'My Portfolio', icon: '✨' },
    { href: '/factsheets', label: 'Factsheet Hub', icon: '🏆' },
    { href: '/search', label: 'Search Funds', icon: '🔍' },
    { href: '/stress-test', label: 'Stress Tester', icon: '🛡️' },
    { href: '/watchlist', label: 'Watchlist', icon: '⭐' },
    { href: '/compare', label: 'Compare', icon: '⚖️' },
    { href: '/categories', label: 'Categories', icon: '📁' },
    { href: '/news', label: 'MF News', icon: '📰' },
];

export default function Sidebar() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const pathname = usePathname();
    const { user, signOut } = useAuth();
    const { theme, toggleTheme } = useTheme();

    // Close mobile sidebar on route change
    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    // Prevent scrolling when mobile sidebar is open
    useEffect(() => {
        if (mobileOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [mobileOpen]);

    return (
        <>
            {/* Mobile Header */}
            <header className={styles.mobileHeader}>
                <button
                    className={styles.hamburger}
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label="Toggle menu"
                >
                    <span className={`${styles.hamburgerLine} ${mobileOpen ? styles.open : ''}`} />
                    <span className={`${styles.hamburgerLine} ${mobileOpen ? styles.open : ''}`} />
                    <span className={`${styles.hamburgerLine} ${mobileOpen ? styles.open : ''}`} />
                </button>
                <span className={styles.mobileLogo}>
                    <img src="/images/india-flag.png" alt="India Flag" className={styles.flagIcon} /> MF Research
                </span>
                <button className={styles.themeToggleMobile} onClick={toggleTheme} aria-label="Toggle theme">
                    {theme === 'dark' ? '☀️' : '🌙'}
                </button>
            </header>

            {/* Overlay */}
            {mobileOpen && (
                <div className={styles.overlay} onClick={() => setMobileOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ''}`}>
                <div className={styles.sidebarInner}>
                    {/* Logo */}
                    <div className={styles.logo}>
                        <img src="/images/india-flag.png" alt="India Flag" className={styles.flagIcon} />
                        <div>
                            <h1 className={styles.logoText}>MF Research</h1>
                            <span className={styles.logoSubtext}>Indian Mutual Funds</span>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className={styles.nav}>
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`${styles.navItem} ${pathname === item.href ? styles.active : ''}`}
                            >
                                <span className={styles.navIcon}>{item.icon}</span>
                                <span className={styles.navLabel}>{item.label}</span>
                                {pathname === item.href && <span className={styles.activeIndicator} />}
                            </Link>
                        ))}
                    </nav>

                    {/* Bottom Section */}
                    <div className={styles.bottomSection}>
                        {/* Theme Toggle */}
                        <button className={styles.themeToggle} onClick={toggleTheme}>
                            <span className={styles.navIcon}>{theme === 'dark' ? '☀️' : '🌙'}</span>
                            <span className={styles.navLabel}>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                        </button>

                        {/* User */}
                        {user ? (
                            <div className={styles.userSection}>
                                <div className={styles.userAvatar}>
                                    {user.photoURL ? (
                                        <img src={user.photoURL} alt="" className={styles.avatarImg} />
                                    ) : (
                                        <span className={styles.avatarFallback}>
                                            {(user.email || 'U')[0].toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <div className={styles.userInfo}>
                                    <span className={styles.userName}>
                                        {user.displayName || user.email?.split('@')[0]}
                                    </span>
                                    <button className={styles.signOutBtn} onClick={signOut}>
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <Link href="/login" className={`${styles.navItem} ${styles.loginBtn}`}>
                                <span className={styles.navIcon}>🔐</span>
                                <span className={styles.navLabel}>Sign In</span>
                            </Link>
                        )}
                    </div>
                </div>
            </aside>

            {/* Bottom Nav (Mobile Only) */}
            <nav className={styles.bottomNav}>
                <Link href="/" className={`${styles.bottomNavItem} ${pathname === '/' ? styles.active : ''}`}>
                    <span className={styles.bottomNavIcon}>📊</span>
                    <span className={styles.bottomNavLabel}>Home</span>
                </Link>
                <Link href="/portfolio" className={`${styles.bottomNavItem} ${pathname === '/portfolio' ? styles.active : ''}`}>
                    <span className={styles.bottomNavIcon}>✨</span>
                    <span className={styles.bottomNavLabel}>Portfolio</span>
                </Link>
                <Link href="/search" className={`${styles.bottomNavItem} ${pathname === '/search' ? styles.active : ''}`}>
                    <span className={styles.bottomNavIcon}>🔍</span>
                    <span className={styles.bottomNavLabel}>Search</span>
                </Link>
                <Link href="/factsheets" className={`${styles.bottomNavItem} ${pathname === '/factsheets' ? styles.active : ''}`}>
                    <span className={styles.bottomNavIcon}>🏆</span>
                    <span className={styles.bottomNavLabel}>Top</span>
                </Link>
                <Link href="/login" className={`${styles.bottomNavItem} ${pathname === '/login' ? styles.active : ''}`}>
                    <span className={styles.bottomNavIcon}>{user ? '👤' : '🔐'}</span>
                    <span className={styles.bottomNavLabel}>{user ? 'Profile' : 'Login'}</span>
                </Link>
            </nav>
        </>
    );
}
