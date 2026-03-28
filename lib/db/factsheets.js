import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

const COLLECTION_NAME = 'fund_factsheets_cache';
const CACHE_TTL_DAYS = 30;

/**
 * Save factsheet data to Firestore cache
 * @param {string} schemeCode - AMFI Scheme Code
 * @param {object} data - Normalized factsheet data
 */
export async function saveFactsheetToCache(schemeCode, data) {
    if (!db) return false;
    try {
        const docRef = doc(db, COLLECTION_NAME, schemeCode.toString());
        await setDoc(docRef, {
            ...data,
            schemeCode: schemeCode.toString(),
            lastUpdated: new Date().toISOString(),
            _timestamp: serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error(`[DB] Failed to save factsheet for ${schemeCode}:`, error);
        return false;
    }
}

/**
 * Get factsheet data from Firestore cache
 * @param {string} schemeCode - AMFI Scheme Code
 * @returns {object|null} - Data if found and not expired, else null
 */
export async function getFactsheetFromCache(schemeCode) {
    if (!db) return null;
    try {
        const docRef = doc(db, COLLECTION_NAME, schemeCode.toString());
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            
            // Check expiry
            const lastUpdated = new Date(data.lastUpdated);
            const now = new Date();
            const diffDays = (now - lastUpdated) / (1000 * 60 * 60 * 24);

            if (diffDays < CACHE_TTL_DAYS) {
                console.log(`[DB] Cache HIT for ${schemeCode} (${Math.floor(diffDays)} days old)`);
                return data;
            } else {
                console.log(`[DB] Cache EXPIRED for ${schemeCode} (${Math.floor(diffDays)} days old)`);
            }
        }
        return null;
    } catch (error) {
        console.error(`[DB] Failed to get factsheet for ${schemeCode}:`, error);
        return null;
    }
}
