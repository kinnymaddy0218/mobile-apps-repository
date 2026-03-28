import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import Sidebar from '@/components/Sidebar/Sidebar';
import ScrollLockRecovery from '@/components/ScrollLockRecovery';

export const metadata = {
    title: 'MF Research — Indian Mutual Fund Research & Education',
    description:
        'Research and learn about Indian mutual funds. Explore NAV data, compare funds, track performance, and understand risk metrics — all in one place.',
    keywords: 'Indian mutual funds, NAV, CAGR, fund comparison, SIP, equity funds, debt funds',
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'MF Research',
    },
};

export const viewport = {
    themeColor: '#0b1222',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" data-theme="dark">
            <body>
                <ThemeProvider>
                    <AuthProvider>
                        <ScrollLockRecovery />
                        <div className="app-layout">
                            <Sidebar />
                            <main className="main-content">{children}</main>
                        </div>
                    </AuthProvider>
                </ThemeProvider>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            if ('serviceWorker' in navigator) {
                                window.addEventListener('load', function() {
                                    navigator.serviceWorker.register('/sw.js').then(function(registration) {
                                        console.log('ServiceWorker registration successful with scope: ', registration.scope);
                                    }, function(err) {
                                        console.log('ServiceWorker registration failed: ', err);
                                    });
                                });
                            }
                        `,
                    }}
                />
            </body>
        </html>
    );
}
