import { db } from '@/lib/firebase';
import { getDocs, collection, query, orderBy } from 'firebase/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const COLLECTION_NAME = 'market_radar';

/**
 * Save radar updates for a category (ADMIN ONLY)
 */
export async function saveRadarUpdates(category, updates) {
    try {
        const docRef = adminDb.collection(COLLECTION_NAME).doc(category);
        await docRef.set({
            updates,
            lastUpdated: FieldValue.serverTimestamp(),
            categoryName: category
        });
        return true;
    } catch (error) {
        console.error(`Failed to save radar for ${category}:`, error);
        return false;
    }
}

/**
 * Get all active radar updates across all categories (PUBLIC READ)
 */
export async function getAllRadarUpdates() {
    if (!db) return [];
    try {
        const snapshot = await getDocs(collection(db, COLLECTION_NAME));
        let allUpdates = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.updates && Array.isArray(data.updates)) {
                allUpdates = [...allUpdates, ...data.updates];
            }
        });

        // Sort by date (newest first)
        return allUpdates.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    } catch (error) {
        console.error('Failed to get radar updates:', error);
        return [];
    }
}
