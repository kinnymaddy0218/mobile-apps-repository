'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [firebaseReady, setFirebaseReady] = useState(false);

    useEffect(() => {
        const initAuth = async () => {
            try {
                const { auth, db } = await import('@/lib/firebase');
                if (!auth) {
                    setLoading(false);
                    return;
                }
                const { onAuthStateChanged } = await import('firebase/auth');
                const { doc, getDoc, setDoc, onSnapshot } = await import('firebase/firestore');

                setFirebaseReady(true);
                const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
                    if (firebaseUser) {
                        // User is signed in, sync profile
                        const userDocRef = doc(db, 'users', firebaseUser.uid);

                        // Set up snapshot listener for real-time profile updates
                        const unsubProfile = onSnapshot(userDocRef, (docSnap) => {
                            if (docSnap.exists()) {
                                setUser({
                                    ...firebaseUser,
                                    profile: docSnap.data()
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
                                    profile: initialProfile
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
