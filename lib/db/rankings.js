import { db } from '@/lib/firebase';
import { doc, getDoc, getDocs, collection } from 'firebase/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const COLLECTION_NAME = 'category_rankings';

/**
 * Save top funds for a category (ADMIN ONLY)
 */
export async function saveCategoryRankings(category, topFunds) {
    try {
        const docRef = adminDb.collection(COLLECTION_NAME).doc(category);
        await docRef.set({
            funds: topFunds,
            lastUpdated: FieldValue.serverTimestamp(),
            categoryName: category
        });
        return true;
    } catch (error) {
        console.error(`Failed to save rankings for ${category}:`, error);
        return false;
    }
}

/**
 * Incrementally update funds in a category's ranking document (ADMIN ONLY)
 */
export async function updateCategoryRankingsBatch(category, updatedFunds, preFetchedExistingFunds = null) {
    if (!updatedFunds || updatedFunds.length === 0) return false;

    try {
        const docRef = adminDb.collection(COLLECTION_NAME).doc(category);
        
        let existingFunds = preFetchedExistingFunds;
        if (!existingFunds) {
            const docSnap = await docRef.get();
            existingFunds = docSnap.exists ? (docSnap.data().funds || []) : [];
        }

        // Merge updated funds into existing list
        const fundMap = new Map();
        existingFunds.forEach(f => {
            const key = f.schemeCode ? f.schemeCode.toString() : `id-${f.schemeName?.replace(/\s+/g, '-')}`;
            fundMap.set(key, f);
        });
        
        updatedFunds.forEach(f => {
            const key = f.schemeCode ? f.schemeCode.toString() : `id-${f.schemeName?.replace(/\s+/g, '-')}`;
            fundMap.set(key, f);
        });

        const mergedFunds = Array.from(fundMap.values())
            .filter(f => f.cagr && f.cagr['1yr'] !== undefined)
            .sort((a, b) => (b.cagr['1yr'] || 0) - (a.cagr['1yr'] || 0));

        await docRef.set({
            funds: mergedFunds,
            lastUpdated: FieldValue.serverTimestamp(),
            categoryName: category
        });
        
        return true;
    } catch (error) {
        console.error(`Failed to update batch for ${category}:`, error);
        return false;
    }
}

/**
 * Get top funds for a category (PUBLIC READ)
 */
export async function getCategoryRankings(category) {
    if (!db) return null;
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

/**
 * Get all category rankings at once (PUBLIC READ)
 */
export async function getAllCategoryRankings() {
    if (!db) return [];
    try {
        const snapshot = await getDocs(collection(db, COLLECTION_NAME));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Failed to get all rankings:', error);
        return [];
    }
}
