import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

const COLLECTION_NAME = 'category_rankings';

/**
 * Save top funds for a category
 * @param {string} category 
 * @param {Array} topFunds - Expected to be sorted array of objects containing fund metrics
 */
export async function saveCategoryRankings(category, topFunds) {
    if (!db) {
        console.warn('Firestore is not initialized.');
        return false;
    }

    try {
        // We use the category string as the document ID for easy fetching
        const docRef = doc(db, COLLECTION_NAME, category);
        await setDoc(docRef, {
            funds: topFunds,
            lastUpdated: serverTimestamp(),
            categoryName: category
        });
        return true;
    } catch (error) {
        console.error(`Failed to save rankings for ${category}:`, error);
        return false;
    }
}

/**
 * Get top funds for a category
 * @param {string} category 
 * @returns {Object|null} The ranking document data or null if not found
 */
export async function getCategoryRankings(category) {
    if (!db) {
        return null;
    }

    try {
        const docRef = doc(db, COLLECTION_NAME, category);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data();
        } else {
            return null;
        }
    } catch (error) {
        console.error(`Failed to get rankings for ${category}:`, error);
        return null;
    }
}
