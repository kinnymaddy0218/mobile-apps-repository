'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [firebaseReady, setFirebaseReady] = useState(false);

    useEffect(() => {
        // Safety net: if Firebase auth never fires within 8s, unblock the app
        const authTimeout = setTimeout(() => {
            console.warn('[AuthContext] Firebase auth timed out — forcing loading=false');
            setLoading(false);
        }, 8000);

        const initAuth = async () => {
            try {
                const { auth, db } = await import('@/lib/firebase');
                if (!auth) {
                    clearTimeout(authTimeout);
                    setLoading(false);
                    return;
                }
                const { onAuthStateChanged } = await import('firebase/auth');
                const { doc, getDoc, setDoc, onSnapshot } = await import('firebase/firestore');

                setFirebaseReady(true);
                const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
                    clearTimeout(authTimeout); // Auth responded — cancel the timeout
                    if (firebaseUser) {
                        // User is signed in, sync profile
                        const userDocRef = doc(db, 'users', firebaseUser.uid);

                        // Set up snapshot listener for real-time profile updates
                        const unsubProfile = onSnapshot(userDocRef, (docSnap) => {
                            if (docSnap.exists()) {
                                const profileData = docSnap.data();
                                
                                // Calculate Trial/Subscription status
                                const createdAt = profileData.createdAt ? new Date(profileData.createdAt) : new Date();
                                const trialDays = 7;
                                const msInDay = 1000 * 60 * 60 * 24;
                                const daysElapsed = (new Date() - createdAt) / msInDay;
                                const trialDaysLeft = Math.max(0, Math.ceil(trialDays - daysElapsed));
                                let isTrialActive = trialDaysLeft > 0;
                                
                                // Founding Member Bypass (You)
                                const isFoundingMember = ['kinnymadd0218@gmail.com', 'kinnymaddy0218@gmail.com'].includes(firebaseUser.email);
                                
                                // Admin Simulation Support (Testing all states)
                                const simulationState = isFoundingMember && typeof window !== 'undefined' ? localStorage.getItem('MF_RESEARCH_SIM_STATE') : null;
                                
                                let isPremium = isFoundingMember || profileData.subscriptionTier === 'Premium' || simulationState === 'premium';
                                isTrialActive = (trialDaysLeft > 0) && simulationState !== 'expired';
                                if (simulationState === 'expired') isTrialActive = false;
                                if (simulationState === 'trial') isTrialActive = true;
                                
                                setUser({
                                    ...firebaseUser,
                                    profile: {
                                        ...profileData,
                                        isPremium,
                                        isTrialActive,
                                        trialDaysLeft,
                                        isFoundingMember
                                    }
                                });
                            } else {
                                // Initialize profile if it doesn't exist
                                const initialProfile = {
                                    email: firebaseUser.email,
                                    riskAppetite: 'Moderate',
                                    goal: 'Wealth Creation',
                                    subscriptionTier: 'Free',
                                    createdAt: new Date().toISOString()
                                };
                                setDoc(userDocRef, initialProfile);
                                setUser({
                                    ...firebaseUser,
                                    profile: {
                                        ...initialProfile,
                                        isPremium: ['kinnymadd0218@gmail.com', 'kinnymaddy0218@gmail.com'].includes(firebaseUser.email),
                                        isTrialActive: true,
                                        trialDaysLeft: 7,
                                        isFoundingMember: ['kinnymadd0218@gmail.com', 'kinnymaddy0218@gmail.com'].includes(firebaseUser.email)
                                    }
                                });
                            }
                            setLoading(false);
                        });

                        return () => {
                            unsubProfile();
                        };
                    } else {
                        setUser(null);
                        setLoading(false);
                    }
                });
                return () => unsubscribe();
            } catch (err) {
                console.warn('Auth initialization skipped:', err.message);
                setLoading(false);
            }
        };
        initAuth();
    }, []);

    const signIn = async (email, password) => {
        const { auth } = await import('@/lib/firebase');
        const { signInWithEmailAndPassword } = await import('firebase/auth');
        return signInWithEmailAndPassword(auth, email, password);
    };

    const signUp = async (email, password) => {
        const { auth } = await import('@/lib/firebase');
        const { createUserWithEmailAndPassword } = await import('firebase/auth');
        return createUserWithEmailAndPassword(auth, email, password);
    };

    const signInWithGoogle = async () => {
        const { auth } = await import('@/lib/firebase');
        const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
        const provider = new GoogleAuthProvider();
        return signInWithPopup(auth, provider);
    };

    const signOut = async () => {
        const { auth } = await import('@/lib/firebase');
        const { signOut: firebaseSignOut } = await import('firebase/auth');
        return firebaseSignOut(auth);
    };

    return (
        <AuthContext.Provider value={{ user, loading, firebaseReady, signIn, signUp, signInWithGoogle, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
