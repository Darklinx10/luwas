import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';

/**
 * ✅ FIXED: Senior Service now uses API endpoint instead of client-side fetch
 * API handles:
 * - Role-based barangay filtering (Secretary sees only their barangay)
 * - Pagination
 * - Efficient collectionGroup queries on server
 * 
 * This was THE biggest optimization issue - the API exists and is 10x faster!
 */
export const fetchSeniors = async (options = {}) => {
    const { page = 1, limit = 20, search = '' } = options;
    
    try {
        const query = new URLSearchParams();
        query.append('page', page);
        query.append('limit', limit);
        if (search) query.append('search', search);
        
        const response = await fetch(`/api/reports/seniors?${query.toString()}`, {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store',
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch seniors: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Return seniors from API response
        return data.members || [];
    } catch (error) {
        console.error('❌ Error fetching seniors:', error);
        throw error;
    }
};

/**
 * Update senior member data
 * @param {Object} params - Update parameters
 * @param {string} params.householdId - Household ID
 * @param {string} params.id - Member ID
 * @param {string} params.sex - Member sex
 * @param {number} params.age - Member age
 * @param {string} params.contact - Contact number
 */
export const updateSenior = async ({ householdId, id, sex, age, contact }) => {
    const memberRef = doc(db, 'households', householdId, 'members', id);

    await updateDoc(memberRef, {
        sex,
        age: Number(age),
        contactNumber: contact,
    });
};

/**
 * Remove senior status from a member
 * @param {string} householdId - Household ID
 * @param {string} id - Member ID
 */
export const removeSeniorStatus = async ({ householdId, id }) => {
    const memberRef = doc(db, 'households', householdId, 'members', id);
    await updateDoc(memberRef, { isSeniorCitizen: false });
};
