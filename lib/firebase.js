import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '', // Don't use 'demo-project' fallback as it causes GPRC errors
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

let app = null;
let auth = null;
let db = null;

try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    
    if (!firebaseConfig.projectId) {
        console.error('CRITICAL: Firebase Project ID missing from process.env. Detected keys:', Object.keys(process.env).filter(k => k.startsWith('NEXT_PUBLIC_FIREBASE')));
        db = getFirestore(app);
    } else {
        db = getFirestore(app);
        console.log('Firebase initialized successfully for project:', firebaseConfig.projectId);
    }
} catch (error) {
    console.error('CRITICAL: Firebase initialization failed:', error.message);
}

export { app, auth, db };
