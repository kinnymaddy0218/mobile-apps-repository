'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function ScrollLockRecovery() {
    const pathname = usePathname();

    useEffect(() => {
        // Recovery logic to clear any stuck scroll locks on route change
        const clearScrollLock = () => {
            // Remove common scroll lock classes
            document.body.classList.remove('antigravity-scroll-lock');
            document.body.classList.remove('modal-open');
            document.body.classList.remove('overflow-hidden');
            
            // Reset style-based overflow
            if (document.body.style.overflow === 'hidden') {
                document.body.style.overflow = '';
            }
            
            // Clean up any stray full-screen fixed overlays that might be blocking interactions
            const overlays = document.querySelectorAll('div[style*="position: fixed"], .modal-overlay, .sidebar-overlay, [class*="overlay"], [id*="overlay"]');
            overlays.forEach(overlay => {
                const style = window.getComputedStyle(overlay);
                const isFixed = style.position === 'fixed' || style.position === 'absolute';
                const isFullScreen = parseFloat(style.width) >= window.innerWidth * 0.9 && parseFloat(style.height) >= window.innerHeight * 0.9;
                
                // Detection criteria for "Ghost" blockers:
                // 1. Fixed/Absolute position and full screen
                // 2. Invisible (opacity 0 or transparent background)
                // 3. Pointer events are enabled (blocking clicks)
                // 4. No meaningful visible content
                const isInvisible = style.opacity === '0' || style.visibility === 'hidden' || 
                                   style.backgroundColor.replace(/\s/g, '') === 'rgba(0,0,0,0)' ||
                                   style.backgroundColor === 'transparent';
                                   
                const isBlocking = style.pointerEvents !== 'none';
                const hasNoContent = !overlay.innerText.trim() && overlay.children.length === 0;

                if (isFixed && isFullScreen && isInvisible && isBlocking && hasNoContent) {
                    console.warn('Removing ghost overlay blocker:', overlay);
                    overlay.remove();
                }
            });

            // Targeted removal of known suspicious IDs or classes that sometimes get stuck
            ['preact-border-shadow-host', 'modal-root', 'portal-root'].forEach(id => {
                const el = document.getElementById(id);
                if (el && !el.innerText.trim() && el.children.length === 0) {
                    console.warn(`Cleaning empty portal/host: ${id}`);
                    el.remove();
                }
            });
        };

        // Clear immediately on route change
        clearScrollLock();
        
        // Also clear periodically for the first few seconds to catch late-rendering ghosts
        const interval = setInterval(clearScrollLock, 1000);
        const timer = setTimeout(() => clearInterval(interval), 5000);
        
        return () => {
            clearInterval(interval);
            clearTimeout(timer);
        };
    }, [pathname]);

    return null;
}
