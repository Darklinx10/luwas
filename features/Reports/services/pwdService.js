'use client';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';

export const pwdService = {
    /**
     * Fetch all PWD (Persons with Disability) members
     * ✅ OPTIMIZED: Uses efficient batching with household summary check
     * Checks totalPWDs from household doc before fetching members
     * Queries members with isPWD = true
     * Uses household-level barangay and sitio from parent doc
     */
    fetchAllPWDs: async () => {
        const householdsSnap = await getDocs(collection(db, 'households'));

        const data = await Promise.all(
            householdsSnap.docs.map(async (householdDoc) => {
                const householdId = householdDoc.id;
                const household = householdDoc.data();
                const barangay = household?.barangay || '—';
                const sitio = household?.sitio || '—';

                try {
                    // ✅ Use totalPWDs from household doc for quick check
                    const totalPWDs = household?.totalPWDs || 0;
                    if (totalPWDs === 0) {
                        return []; // Skip households with no PWDs
                    }

                    const membersSnap = await getDocs(
                        collection(db, 'households', householdId, 'members')
                    );

                    const pwdMembers = membersSnap.docs
                        .map((memberDoc) => {
                            const member = memberDoc.data();

                            // Filter by isPWD flag
                            if (!member.isPWD) return null;

                            const name = [
                                member.firstName,
                                member.middleName,
                                member.lastName,
                                member.suffix && member.suffix.toLowerCase() !== 'n/a'
                                    ? member.suffix
                                    : '',
                            ]
                                .filter(Boolean)
                                .join(' ');

                            return {
                                id: memberDoc.id,
                                householdId,
                                name,
                                age: member.age || '—',
                                sex: member.sex || '—',
                                contact: member.contactNumber || '—',
                                barangay,
                                sitio,
                                disability: member.disability || '—',
                            };
                        })
                        .filter(Boolean);

                    return pwdMembers;
                } catch (err) {
                    console.warn(`⚠️ Error processing household ${householdId}:`, err);
                    return [];
                }
            })
        );

        return data.flat();
    },

    /**
     * Update PWD member data
     * @param {Object} item - Member data to update
     */
    updatePWD: async (item) => {
        const memberRef = doc(db, 'households', item.householdId, 'members', item.id);

        await updateDoc(memberRef, {
            sex: item.sex,
            age: Number(item.age),
            contactNumber: item.contact,
            disability: item.disability,
        });
    },

    /**
     * Remove PWD status from a member
     * @param {Object} item - Member data
     */
    removePWD: async (item) => {
        const memberRef = doc(db, 'households', item.householdId, 'members', item.id);
        await updateDoc(memberRef, {
            isPWD: false,
            disability: '',
        });
    },
};
