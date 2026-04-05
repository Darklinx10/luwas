/**
 * lib/api/memberService.js
 * 
 * Firestore operations for household members
 * Handles member CRUD and queries with name normalization and multi-field sorting
 */

import { adminDb } from '@/lib/firebaseAdmin';
import { recalculateHouseholdTotals, calculateAge } from './recalculateTotals';
import { normalizeNameComponents } from '@/lib/utils/nameNormalizer';

/**
 * Fetch paginated members for a household
 * 
 * @param {string} householdId - Household ID
 * @param {Object} options - Query options
 * @param {number} options.page - Page number (1-based)
 * @param {number} options.limit - Members per page
 * @param {string} options.search - Search term (searches firstName/lastName)
 * @returns {Promise<Object>} { members, totalCount, totalPages, hasNextPage, hasPrevPage }
 */
export async function fetchMembersQuery(householdId, options = {}) {
  const { page = 1, limit = 20, search = '' } = options;
  const normalizedSearch = String(search || '').trim().toLowerCase();

  const baseQuery = adminDb
    .collection('households')
    .doc(householdId)
    .collection('members');

  // Search - use simple query without compound index
  if (normalizedSearch) {
    try {
      const snapshot = await baseQuery.get();

      const filtered = snapshot.docs
        .map((doc) => ({
          memberId: doc.id,
          householdId,
          ...doc.data(),
        }))
        .filter((member) => {
          const firstName = String(member.firstName || '').toLowerCase();
          const lastName = String(member.lastName || '').toLowerCase();
          const fullName = String(member.fullName || '').toLowerCase();

          return (
            firstName.includes(normalizedSearch) ||
            lastName.includes(normalizedSearch) ||
            fullName.includes(normalizedSearch)
          );
        })
        .sort((a, b) => {
          // Multi-field sort: lastName → firstName → middleName → suffix
          const lastNameA = String(a.lastName || '').toLowerCase();
          const lastNameB = String(b.lastName || '').toLowerCase();
          let cmp = lastNameA.localeCompare(lastNameB);
          if (cmp !== 0) return cmp;
          
          const firstNameA = String(a.firstName || '').toLowerCase();
          const firstNameB = String(b.firstName || '').toLowerCase();
          cmp = firstNameA.localeCompare(firstNameB);
          if (cmp !== 0) return cmp;

          const middleNameA = String(a.middleName || '').toLowerCase();
          const middleNameB = String(b.middleName || '').toLowerCase();
          cmp = middleNameA.localeCompare(middleNameB);
          if (cmp !== 0) return cmp;

          const suffixA = String(a.suffix || '').toLowerCase();
          const suffixB = String(b.suffix || '').toLowerCase();
          return suffixA.localeCompare(suffixB);
        });

      const totalCount = filtered.length;
      const totalPages = Math.max(1, Math.ceil(totalCount / limit));
      const startIndex = (page - 1) * limit;
      const members = filtered.slice(startIndex, startIndex + limit);

      return {
        members,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      };
    } catch (err) {
      console.error('📛 Search query failed:', err.message);
      throw err;
    }
  }

  // No search - fetch all and sort in memory (avoids compound index requirement)
  try {
    console.log(`📡 Fetching all members for household ${householdId} (no search)`);
    
    const snapshot = await baseQuery.get();

    const allMembers = snapshot.docs
      .map((doc) => ({
        memberId: doc.id,
        householdId,
        ...doc.data(),
      }))
      .sort((a, b) => {
        // Multi-field sort: lastName → firstName → middleName → suffix
        const lastNameA = String(a.lastName || '').toLowerCase();
        const lastNameB = String(b.lastName || '').toLowerCase();
        let cmp = lastNameA.localeCompare(lastNameB);
        if (cmp !== 0) return cmp;
        
        const firstNameA = String(a.firstName || '').toLowerCase();
        const firstNameB = String(b.firstName || '').toLowerCase();
        cmp = firstNameA.localeCompare(firstNameB);
        if (cmp !== 0) return cmp;

        const middleNameA = String(a.middleName || '').toLowerCase();
        const middleNameB = String(b.middleName || '').toLowerCase();
        cmp = middleNameA.localeCompare(middleNameB);
        if (cmp !== 0) return cmp;

        const suffixA = String(a.suffix || '').toLowerCase();
        const suffixB = String(b.suffix || '').toLowerCase();
        return suffixA.localeCompare(suffixB);
      });

    const totalCount = allMembers.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));
    const startIndex = (page - 1) * limit;
    const members = allMembers.slice(startIndex, startIndex + limit);

    console.log(`✅ Fetched and sorted ${totalCount} members, page ${page}/${totalPages}`);

    return {
      members,
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  } catch (err) {
    console.error('📛 Member query failed:', err.message);
    throw err;
  }
}

/**
 * Get single member
 * @param {string} householdId - Household ID
 * @param {string} memberId - Member ID
 * @returns {Promise<Object|null>} Member data or null
 */
export async function getMember(householdId, memberId) {
  const snap = await adminDb
    .collection('households')
    .doc(householdId)
    .collection('members')
    .doc(memberId)
    .get();

  if (!snap.exists) return null;

  return {
    memberId: snap.id,
    householdId,
    ...snap.data(),
  };
}

/**
 * Create new member and recalculate household totals
 * @param {string} householdId - Household ID
 * @param {Object} payload - Member data
 * @param {string} userId - User creating the member
 * @returns {Promise<string>} New member ID
 */
export async function createMember(householdId, payload, userId) {
  const parsedAge = parseInt(payload.age, 10);
  const derivedAge = !isNaN(parsedAge) ? parsedAge : calculateAge(payload.birthdate);

  // Normalize member names (capitalize, trim, handle compound names)
  const normalizedNames = normalizeNameComponents({
    firstName: payload.firstName,
    middleName: payload.middleName,
    lastName: payload.lastName,
    suffix: payload.suffix,
  });

  const data = {
    ...payload,
    householdId,
    firstName: normalizedNames.firstName,
    middleName: normalizedNames.middleName,
    lastName: normalizedNames.lastName,
    suffix: normalizedNames.suffix,
    fullName:
      payload.fullName?.trim() ||
      [
        normalizedNames.firstName,
        normalizedNames.middleName,
        normalizedNames.lastName,
        normalizedNames.suffix,
      ]
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim(),
    sex: payload.sex?.trim() || '',
    barangay: payload.barangay?.trim() || '',
    sitio: payload.sitio?.trim() || '',
    contactNumber: payload.contactNumber?.trim() || '',
    age: derivedAge ?? payload.age ?? null,
    isPWD: Boolean(payload.isPWD),
    isSeniorCitizen: derivedAge !== null ? derivedAge >= 60 : Boolean(payload.isSeniorCitizen),
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: userId,
    updatedBy: userId,
  };

  const docRef = await adminDb
    .collection('households')
    .doc(householdId)
    .collection('members')
    .add(data);

  // Recalculate household totals
  await recalculateHouseholdTotals(householdId);

  return docRef.id;
}

/**
 * Update member and recalculate household totals
 * @param {string} householdId - Household ID
 * @param {string} memberId - Member ID
 * @param {Object} payload - Fields to update
 * @param {string} userId - User performing update
 * @returns {Promise<void>}
 */
export async function updateMember(householdId, memberId, payload, userId) {
  const parsedAge = parseInt(payload.age, 10);
  const derivedAge =
    payload.age !== undefined || payload.birthdate !== undefined
      ? (!isNaN(parsedAge) ? parsedAge : calculateAge(payload.birthdate))
      : undefined;

  // Normalize member names if updating name fields
  const normalizedNames = (payload.firstName !== undefined || payload.lastName !== undefined)
    ? normalizeNameComponents({
      firstName: payload.firstName,
      middleName: payload.middleName,
      lastName: payload.lastName,
      suffix: payload.suffix,
    })
    : null;

  const updates = {
    ...payload,
    ...(payload.firstName !== undefined && {
      firstName: normalizedNames?.firstName || '',
    }),
    ...(payload.middleName !== undefined && {
      middleName: normalizedNames?.middleName || '',
    }),
    ...(payload.lastName !== undefined && {
      lastName: normalizedNames?.lastName || '',
    }),
    ...(payload.suffix !== undefined && {
      suffix: normalizedNames?.suffix || '',
    }),
    ...(payload.fullName !== undefined && {
      fullName: payload.fullName?.trim() || '',
    }),
    ...(payload.sex !== undefined && {
      sex: payload.sex?.trim() || '',
    }),
    ...(payload.barangay !== undefined && {
      barangay: payload.barangay?.trim() || '',
    }),
    ...(payload.sitio !== undefined && {
      sitio: payload.sitio?.trim() || '',
    }),
    ...(payload.contactNumber !== undefined && {
      contactNumber: payload.contactNumber?.trim() || '',
    }),
    ...(derivedAge !== undefined && {
      age: derivedAge,
      isSeniorCitizen: derivedAge !== null ? derivedAge >= 60 : false,
    }),
    updatedAt: new Date(),
    updatedBy: userId,
  };

  await adminDb
    .collection('households')
    .doc(householdId)
    .collection('members')
    .doc(memberId)
    .update(updates);

  // Recalculate household totals (age might have changed, etc.)
  await recalculateHouseholdTotals(householdId);
}

/**
 * Delete member and recalculate household totals
 * @param {string} householdId - Household ID
 * @param {string} memberId - Member ID
 * @returns {Promise<void>}
 */
export async function deleteMember(householdId, memberId) {
  const memberRef = adminDb
    .collection('households')
    .doc(householdId)
    .collection('members')
    .doc(memberId);

  const demographicRef = memberRef
    .collection('demographicCharacteristics')
    .doc('main');

  const demographicSnap = await demographicRef.get();
  if (demographicSnap.exists) {
    await demographicRef.delete();
  }

  await memberRef.delete();

  // Recalculate household totals
  await recalculateHouseholdTotals(householdId);
}

/**
 * Get all members with PWD = true for a household
 * @param {string} householdId - Household ID
 * @returns {Promise<Object[]>} Array of PWD members
 */
export async function getPWDMembers(householdId) {
  const snap = await adminDb
    .collection('households')
    .doc(householdId)
    .collection('members')
    .where('isPWD', '==', true)
    .get();

  return snap.docs.map((doc) => ({
    memberId: doc.id,
    householdId,
    ...doc.data(),
  }));
}

/**
 * Get all members with age >= 60 (Seniors)
 * @param {string} householdId - Household ID
 * @returns {Promise<Object[]>} Array of senior members
 */
export async function getSeniorMembers(householdId) {
  const snap = await adminDb
    .collection('households')
    .doc(householdId)
    .collection('members')
    .where('isSeniorCitizen', '==', true)
    .get();

  return snap.docs.map((doc) => ({
    memberId: doc.id,
    householdId,
    ...doc.data(),
  }));
}

/**
 * Fetch all PWD members across households with optional barangay filter
 * Used by reports API for aggregated PWD lists
 * 
 * ✅ OPTIMIZED: Uses collectionGroup query instead of N+1 pattern
 * collectionGroup('members').where('isPWD', true) fetches all PWD members in 1 read
 * Then filters households by barangay if needed
 * 
 * @param {Object} options
 * @param {string|null} options.barangay - Optional barangay filter
 * @returns {Promise<Object[]>} Array of PWD members with household context
 */
export async function getAllPWDMembers(options = {}) {
  const { barangay = null } = options;

  // ✅ OPTIMIZED: Single collectionGroup query for all PWD members
  const membersSnap = await adminDb
    .collectionGroup('members')
    .where('isPWD', '==', true)
    .get();

  const pwdMembers = [];

  // ✅ When filtering by barangay, need to fetch household data for each unique household
  // But we only fetch households we actually need (deduped), not all households
  const householdsToFetch = new Set();

  membersSnap.forEach((memDoc) => {
    const householdId = memDoc.ref.parent.parent.id;
    householdsToFetch.add(householdId);
  });

  // Fetch all needed households in parallel (much faster than sequential)
  const householdCache = {};
  await Promise.all(
    Array.from(householdsToFetch).map(async (householdId) => {
      const hhSnap = await adminDb.collection('households').doc(householdId).get();
      if (hhSnap.exists) {
        householdCache[householdId] = hhSnap.data();
      }
    })
  );

  // Build results, filtering by barangay if needed
  membersSnap.forEach((memDoc) => {
    const householdId = memDoc.ref.parent.parent.id;
    const member = memDoc.data();
    const household = householdCache[householdId];

    // Filter by barangay if specified
    if (barangay && household?.barangay !== barangay) {
      return;
    }

    pwdMembers.push({
      memberId: memDoc.id,
      householdId,
      ...member,
      headFirstName: household?.headFirstName || '',
      headLastName: household?.headLastName || '',
      householdBarangay: household?.barangay || '',
    });
  });

  return pwdMembers;
}

/**
 * Fetch all Senior members across households with optional barangay filter
 * Used by reports API for aggregated senior citizen lists
 * 
 * ✅ OPTIMIZED: Uses collectionGroup query instead of N+1 pattern
 * collectionGroup('members').where('isSeniorCitizen', true) fetches all seniors in 1 read
 * Then filters households by barangay if needed
 * 
 * @param {Object} options
 * @param {string|null} options.barangay - Optional barangay filter
 * @returns {Promise<Object[]>} Array of senior members with household context
 */
export async function getAllSeniorMembers(options = {}) {
  const { barangay = null } = options;

  // ✅ OPTIMIZED: Single collectionGroup query for all senior members
  const membersSnap = await adminDb
    .collectionGroup('members')
    .where('isSeniorCitizen', '==', true)
    .get();

  const seniorMembers = [];

  // ✅ When filtering by barangay, need to fetch household data for each unique household
  // But we only fetch households we actually need (deduped), not all households
  const householdsToFetch = new Set();

  membersSnap.forEach((memDoc) => {
    const householdId = memDoc.ref.parent.parent.id;
    householdsToFetch.add(householdId);
  });

  // Fetch all needed households in parallel (much faster than sequential)
  const householdCache = {};
  await Promise.all(
    Array.from(householdsToFetch).map(async (householdId) => {
      const hhSnap = await adminDb.collection('households').doc(householdId).get();
      if (hhSnap.exists) {
        householdCache[householdId] = hhSnap.data();
      }
    })
  );

  // Build results, filtering by barangay if needed
  membersSnap.forEach((memDoc) => {
    const householdId = memDoc.ref.parent.parent.id;
    const member = memDoc.data();
    const household = householdCache[householdId];

    // Filter by barangay if specified
    if (barangay && household?.barangay !== barangay) {
      return;
    }

    seniorMembers.push({
      memberId: memDoc.id,
      householdId,
      ...member,
      headFirstName: household?.headFirstName || '',
      headLastName: household?.headLastName || '',
      householdBarangay: household?.barangay || '',
    });
  });

  return seniorMembers;
}