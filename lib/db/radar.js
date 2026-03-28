import { db } from '@/lib/firebase';
import { doc, setDoc, getDocs, collection, serverTimestamp } from 'firebase/firestore';

const COLLECTION_NAME = 'market_radar';

/**
 * Save radar updates for a category
 */
export async function saveRadarUpdates(category, updates) {
    if (!db) return false;
    try {
        const docRef = doc(db, COLLECTION_NAME, category);
        await setDoc(docRef, {
            updates,
            lastUpdated: serverTimestamp(),
            categoryName: category
        });
        return true;
    } catch (error) {
        console.error(`Failed to save radar for ${category}:`, error);
        return false;
    }
}

/**
 * Get all active radar updates across all categories
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

        // Sort by date (newest first) assuming updates have a timestamp or we use lastUpdated
        return allUpdates.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    } catch (error) {
        console.error('Failed to get radar updates:', error);
        return [];
    }
}
