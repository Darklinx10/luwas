/**
 * lib/api/householdService.js
 *
 * Household Firestore service layer
 * Handles CRUD for top-level household docs only
 *
 * Firestore structure:
 * households/{householdId}
 *
 * Notes:
 * - Top-level household docs store summary/queryable fields
 * - Detailed data (members, geographicIdentification, health) live in subcollections
 * - Secretary barangay filtering is applied by caller/API layer
 */

import { adminDb } from '@/lib/firebaseAdmin';
import { calculateAgeBrackets, recalculateHouseholdTotals } from './recalculateTotals';
import { processHeadName, isValidName, normalizeNameComponents } from '@/lib/utils/nameNormalizer';

const HOUSEHOLDS_COLLECTION = 'households';

const ALLOWED_SORT_FIELDS = [
  'headLastName',
  'headFirstName',
  'headMiddleName',
  'headSuffix',
  'barangay',
  'sitio',
  'createdAt',
  'totalSeniors',
  'totalPWDs',
  'hasMapLocation',
];

const ALLOWED_ORDERS = ['asc', 'desc'];

/**
 * Fetch paginated households with optional barangay filter
 * Supports sorting and basic in-memory search fallback
 *
 * @param {Object} params
 * @param {number} params.page
 * @param {number} params.limit
 * @param {string} params.search
 * @param {string} params.sort
 * @param {'asc'|'desc'} params.order
 * @param {string|null} params.barangay
 * @returns {Promise<{
 *   households: Array,
 *   totalCount: number,
 *   totalPages: number,
 *   hasNextPage: boolean,
 *   hasPrevPage: boolean
 * }>}
 */
export async function fetchHouseholdsQuery({
  page = 1,
  limit = 10,
  search = '',
  sort = 'headLastName',
  order = 'asc',
  barangay = null,
  exportAll = false,
} = {}) {
  const safePage = Number.isInteger(page) && page > 0 ? page : 1;
  const safeLimit =
    Number.isInteger(limit) && limit > 0 && limit <= 100 ? limit : 10;

  const safeSort = ALLOWED_SORT_FIELDS.includes(sort)
    ? sort
    : 'headLastName';

  const safeOrder = ALLOWED_ORDERS.includes(order) ? order : 'asc';
  const normalizedSearch = String(search || '').trim().toLowerCase();

  let baseQuery = adminDb.collection(HOUSEHOLDS_COLLECTION);

  if (barangay) {
    baseQuery = baseQuery.where('barangay', '==', barangay);
  }

  // Query construction strategy based on available Firestore composite indexes
  // Available indexes:
  // 1. headLastName, headFirstName, headMiddleName, headSuffix, __name__ (no barangay)
  // 2. barangay, headLastName, headFirstName, headMiddleName, headSuffix, __name__
  // 3. totalPWDs, headLastName, __name__ (no barangay)
  // 4. barangay, totalPWDs, __name__ (NO headLastName tiebreaker!)
  // 5. totalSeniors, headLastName, __name__ (no barangay)
  // 6. barangay, totalSeniors, __name__ (NO headLastName tiebreaker!)
  // 7. hasMapLocation, headLastName, __name__ (no barangay)

  const nameFields = ['headLastName', 'headFirstName', 'headMiddleName', 'headSuffix'];
  const specialFields = ['totalPWDs', 'totalSeniors', 'hasMapLocation'];
  let orderedQuery;

  if (nameFields.includes(safeSort)) {
    // Uses Index #1 or #2 depending on barangay filter
    orderedQuery = baseQuery
      .orderBy('headLastName', safeOrder)
      .orderBy('headFirstName', safeOrder)
      .orderBy('headMiddleName', safeOrder)
      .orderBy('headSuffix', safeOrder);
  } else if (specialFields.includes(safeSort)) {
    // Uses Index #3, #4, #5, #6, or #7 depending on field and barangay
    //
    // ⚠️ CRITICAL: When sorting by totalPWDs/totalSeniors WITH barangay filter,
    // the index is barangay, {field}, __name__ — NO headLastName!
    // Only add headLastName tiebreaker if there's NO barangay filter.
    //
    if (!barangay && (safeSort === 'totalPWDs' || safeSort === 'totalSeniors')) {
      // Index #3 or #5: {field}, headLastName, __name__
      orderedQuery = baseQuery
        .orderBy(safeSort, safeOrder)
        .orderBy('headLastName', 'asc');
    } else if (!barangay && safeSort === 'hasMapLocation') {
      // Index #7: hasMapLocation, headLastName, __name__
      orderedQuery = baseQuery
        .orderBy(safeSort, safeOrder)
        .orderBy('headLastName', 'asc');
    } else {
      // Index #4 or #6: barangay, {field}, __name__ (NO headLastName)
      orderedQuery = baseQuery.orderBy(safeSort, safeOrder);
    }
  } else {
    // Fallback: use sort field only
    orderedQuery = baseQuery.orderBy(safeSort, safeOrder);
  }

  // If search is provided, use a broader fetch then filter in memory
  // This is a simple fallback for now. For larger datasets, replace with a better search strategy.
  if (normalizedSearch) {
    const snapshot = await orderedQuery.get();

    const filtered = snapshot.docs
      .map((doc) => ({
        householdId: doc.id,
        ...doc.data(),
      }))
      .filter((item) => {
        const householdId = String(item.householdId || '').toLowerCase();
        const headFirstName = String(item.headFirstName || '').toLowerCase();
        const headLastName = String(item.headLastName || '').toLowerCase();
        const headFullName = String(item.headFullName || '').toLowerCase();
        const barangayValue = String(item.barangay || '').toLowerCase();
        const sitio = String(item.sitio || '').toLowerCase();

        return (
          householdId.includes(normalizedSearch) ||
          headFirstName.includes(normalizedSearch) ||
          headLastName.includes(normalizedSearch) ||
          headFullName.includes(normalizedSearch) ||
          barangayValue.includes(normalizedSearch) ||
          sitio.includes(normalizedSearch)
        );
      });

    const totalCount = filtered.length;
    const totalResidents = filtered.reduce(
      (sum, h) => sum + (Number(h.totalResidents) || 0),
      0
    );

    if (exportAll) {
      return {
        households: filtered,
        totalCount,
        totalResidents,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      };
    }

    const totalPages = Math.max(1, Math.ceil(totalCount / safeLimit));
    const startIndex = (safePage - 1) * safeLimit;
    const households = filtered.slice(startIndex, startIndex + safeLimit);

    return {
      households,
      totalCount,
      totalResidents,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPrevPage: safePage > 1,
    };
  }

  // No search: standard paginated fetch
  const totalSnapshot = await baseQuery.get();
  const totalCount = totalSnapshot.size;
  const totalResidents = totalSnapshot.docs.reduce((sum, doc) => {
    return sum + (Number(doc.data().totalResidents) || 0);
  }, 0);

  if (exportAll) {
    const snapshot = await orderedQuery.get();
    const households = snapshot.docs.map((doc) => ({
      householdId: doc.id,
      ...doc.data(),
    }));

    return {
      households,
      totalCount,
      totalResidents,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    };
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / safeLimit));
  const offset = (safePage - 1) * safeLimit;

  const snapshot = await orderedQuery.offset(offset).limit(safeLimit).get();

  const households = snapshot.docs.map((doc) => ({
    householdId: doc.id,
    ...doc.data(),
  }));

  return {
    households,
    totalCount,
    totalResidents,
    totalPages,
    hasNextPage: safePage < totalPages,
    hasPrevPage: safePage > 1,
  };
}

/**
 * Calculate total seniors including household head and members
 * @param {number} headAge - Age of household head
 * @param {Array} members - Array of member objects with age property
 * @returns {number} Total count of seniors (age >= 60)
 */
function calculateTotalSeniors(headAge, members) {
  let count = (headAge >= 60) ? 1 : 0;
  if (Array.isArray(members)) {
    count += members.filter(m => m.age >= 60).length;
  }
  return count;
}

/**
 * Create a new top-level household doc
 *
 * @param {Object} payload
 * @param {string} userId
 * @returns {Promise<string>} householdId
 */
export async function createHousehold(payload, userId) {
  const now = new Date();

  const householdId =
    payload.householdId?.trim() ||
    adminDb.collection(HOUSEHOLDS_COLLECTION).doc().id;

  const homes = Array.isArray(payload.homes) ? payload.homes : [];
  const members = Array.isArray(payload.members) ? payload.members : [];
  const normalizedHeadSex = String(payload.headSex || '').trim().toLowerCase();

  // Normalize and split names using server-side fallback
  // This handles cases where a full name is provided instead of split fields
  const normalizedNames = processHeadName({
    headFirstName: payload.headFirstName,
    headMiddleName: payload.headMiddleName,
    headLastName: payload.headLastName,
    headSuffix: payload.headSuffix,
    headFullName: payload.headFullName,
  });

  // Validate that at least a name is provided
  if (!isValidName(normalizedNames)) {
    throw new Error('At least a first name or last name is required');
  }

  const totalMale = members.filter(
    (member) => member?.sex?.toLowerCase() === 'male'
  ).length + (normalizedHeadSex === 'male' ? 1 : 0);
  const totalFemale = members.filter(
    (member) => member?.sex?.toLowerCase() === 'female'
  ).length + (normalizedHeadSex === 'female' ? 1 : 0);
  const totalPWDs = members.filter((member) => Boolean(member?.isPWD)).length;
  const totalSeniors =
    (Number(payload.headAge || 0) >= 60 ? 1 : 0) +
    members.filter((member) => Number(member?.age || 0) >= 60).length;
  const ageBrackets =
    payload.ageBrackets && typeof payload.ageBrackets === 'object' && !Array.isArray(payload.ageBrackets)
      ? payload.ageBrackets
      : calculateAgeBrackets(members, payload.headAge);

  const data = {
    householdId,
    barangay: payload.barangay?.trim() || '',
    sitio: payload.sitio?.trim() || '',
    headFirstName: normalizedNames.firstName,
    headMiddleName: normalizedNames.middleName,
    headLastName: normalizedNames.lastName,
    headSuffix: normalizedNames.suffix,
    headFullName: [
      normalizedNames.firstName,
      normalizedNames.middleName,
      normalizedNames.lastName,
      normalizedNames.suffix,
    ]
      .filter(Boolean)
      .join(' ')
      .trim(),
    contactNumber: payload.contactNumber?.trim() || '',
    headSex: payload.headSex?.trim() || '',
    headAge: Number(payload.headAge || 0),
    homes,
    hasMapLocation: homes.some(
      (home) =>
        home &&
        home.latitude !== undefined &&
        home.longitude !== undefined &&
        home.latitude !== null &&
        home.longitude !== null
    ),
    totalFamilies: Number(payload.totalFamilies || 1),
    totalResidents: members.length + 1,
    totalMale,
    totalFemale,
    totalPWDs,
    totalSeniors,
    ageBrackets,
    createdAt: now,
    updatedAt: now,
    createdBy: userId || null,
    updatedBy: userId || null,
  };

  await adminDb.collection(HOUSEHOLDS_COLLECTION).doc(householdId).set(data);

  if (members.length > 0) {
    const batch = adminDb.batch();
    const membersCollection = adminDb
      .collection(HOUSEHOLDS_COLLECTION)
      .doc(householdId)
      .collection('members');

    members.forEach((member) => {
      const normalizedMemberNames = normalizeNameComponents({
        firstName: member.firstName,
        middleName: member.middleName,
        lastName: member.lastName,
        suffix: member.suffix,
      });

      const parsedAge = parseInt(member.age, 10);
      const memberAge = !isNaN(parsedAge) ? parsedAge : 0;
      const memberRef = member.memberId
        ? membersCollection.doc(member.memberId)
        : membersCollection.doc();

      batch.set(memberRef, {
        householdId,
        firstName: normalizedMemberNames.firstName,
        middleName: normalizedMemberNames.middleName,
        lastName: normalizedMemberNames.lastName,
        suffix: normalizedMemberNames.suffix,
        fullName:
          member.fullName?.trim() ||
          [
            normalizedMemberNames.firstName,
            normalizedMemberNames.middleName,
            normalizedMemberNames.lastName,
            normalizedMemberNames.suffix,
          ]
            .filter(Boolean)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim(),
        relationshipToHead: member.relationshipToHead?.trim() || '',
        sex: member.sex?.trim() || '',
        birthDate: member.birthDate || '',
        age: memberAge,
        education: member.education || '',
        occupation: member.occupation || '',
        otherInfo: member.otherInfo || '',
        isPWD: Boolean(member.isPWD),
        isSeniorCitizen: memberAge >= 60,
        createdAt: now,
        updatedAt: now,
        createdBy: userId || null,
        updatedBy: userId || null,
      });
    });

    await batch.commit();
    await recalculateHouseholdTotals(householdId);
  }

  return householdId;
}

/**
 * Get a single household by ID
 *
 * @param {string} householdId
 * @returns {Promise<Object|null>}
 */
export async function getHousehold(householdId) {
  const docRef = adminDb.collection(HOUSEHOLDS_COLLECTION).doc(householdId);
  const snap = await docRef.get();

  if (!snap.exists) {
    return null;
  }

  return {
    householdId: snap.id,
    ...snap.data(),
  };
}

/**
 * Update top-level household doc only
 *
 * @param {string} householdId
 * @param {Object} updates
 * @param {string} userId
 * @returns {Promise<void>}
 */
export async function updateHousehold(householdId, updates, userId) {
  const docRef = adminDb.collection(HOUSEHOLDS_COLLECTION).doc(householdId);

  const existingSnap = await docRef.get();
  if (!existingSnap.exists) {
    throw new Error('Household not found');
  }

  const existingData = existingSnap.data() || {};
  const nextHomes = Array.isArray(updates.homes)
    ? updates.homes
    : existingData.homes || [];

  // Normalize and split names if any name field is being updated
  let nameUpdates = {};
  if (
    updates.headFirstName !== undefined ||
    updates.headMiddleName !== undefined ||
    updates.headLastName !== undefined ||
    updates.headSuffix !== undefined ||
    updates.headFullName !== undefined
  ) {
    const normalizedNames = processHeadName({
      headFirstName: updates.headFirstName !== undefined ? updates.headFirstName : existingData.headFirstName,
      headMiddleName: updates.headMiddleName !== undefined ? updates.headMiddleName : existingData.headMiddleName,
      headLastName: updates.headLastName !== undefined ? updates.headLastName : existingData.headLastName,
      headSuffix: updates.headSuffix !== undefined ? updates.headSuffix : existingData.headSuffix,
      headFullName: updates.headFullName !== undefined ? updates.headFullName : existingData.headFullName,
    });

    nameUpdates = {
      headFirstName: normalizedNames.firstName,
      headMiddleName: normalizedNames.middleName,
      headLastName: normalizedNames.lastName,
      headSuffix: normalizedNames.suffix,
      headFullName: [
        normalizedNames.firstName,
        normalizedNames.middleName,
        normalizedNames.lastName,
        normalizedNames.suffix,
      ]
        .filter(Boolean)
        .join(' ')
        .trim(),
    };
  }

  const normalizedUpdates = {
    ...updates,
    ...nameUpdates,
    ...(updates.barangay !== undefined && {
      barangay: updates.barangay?.trim() || '',
    }),
    ...(updates.sitio !== undefined && {
      sitio: updates.sitio?.trim() || '',
    }),
    ...(updates.contactNumber !== undefined && {
      contactNumber: updates.contactNumber?.trim() || '',
    }),
    ...(updates.headSex !== undefined && {
      headSex: updates.headSex?.trim() || '',
    }),
    ...(updates.headAge !== undefined && {
      headAge: Number(updates.headAge || 0),
    }),
    ...(updates.homes !== undefined && {
      homes: nextHomes,
      hasMapLocation: nextHomes.some(
        (home) =>
          home &&
          home.latitude !== undefined &&
          home.longitude !== undefined &&
          home.latitude !== null &&
          home.longitude !== null
      ),
    }),
    updatedAt: new Date(),
    updatedBy: userId || null,
  };

  await docRef.update(normalizedUpdates);

  if (updates.headAge !== undefined || updates.headSex !== undefined) {
    await recalculateHouseholdTotals(householdId);
  }
}

/**
 * Delete household and related subcollections
 *
 * @param {string} householdId
 * @returns {Promise<void>}
 */
export async function deleteHousehold(householdId) {
  const householdRef = adminDb.collection(HOUSEHOLDS_COLLECTION).doc(householdId);

  // Delete member demographic subdocs first, then member docs
  const membersSnap = await householdRef.collection('members').get();
  for (const memberDoc of membersSnap.docs) {
    const demographicRef = memberDoc.ref
      .collection('demographicCharacteristics')
      .doc('main');

    const demographicSnap = await demographicRef.get();
    if (demographicSnap.exists) {
      await demographicRef.delete();
    }

    await memberDoc.ref.delete();
  }

  // Delete geographicIdentification/main if it exists
  const geographicRef = householdRef
    .collection('geographicIdentification')
    .doc('main');
  const geographicSnap = await geographicRef.get();
  if (geographicSnap.exists) {
    await geographicRef.delete();
  }

  // Delete health/main if it exists
  const healthRef = householdRef.collection('health').doc('main');
  const healthSnap = await healthRef.get();
  if (healthSnap.exists) {
    await healthRef.delete();
  }

  // Delete household parent doc
  await householdRef.delete();
}

/**
 * Return lightweight summary list
 *
 * @param {string|null} barangay
 * @returns {Promise<Array>}
 */
export async function getHouseholdsSummary(barangay = null) {
  let query = adminDb.collection(HOUSEHOLDS_COLLECTION);

  if (barangay) {
    query = query.where('barangay', '==', barangay);
  }

  const snapshot = await query.get();

  return snapshot.docs.map((doc) => {
    const data = doc.data() || {};

    return {
      householdId: doc.id,
      headFirstName: data.headFirstName || '',
      headLastName: data.headLastName || '',
      headFullName: data.headFullName || '',
      barangay: data.barangay || '',
      sitio: data.sitio || '',
      totalFamilies: Number(data.totalFamilies || 0),
      totalResidents: Number(data.totalResidents || 0),
      totalMale: Number(data.totalMale || 0),
      totalFemale: Number(data.totalFemale || 0),
      totalPWDs: Number(data.totalPWDs || 0),
      totalSeniors: Number(data.totalSeniors || 0),
      homes: Array.isArray(data.homes) ? data.homes : [],
      hasMapLocation: Boolean(data.hasMapLocation),
    };
  });
}

/**
 * Recalculate and persist household totals from members subcollection
 *
 * @param {string} householdId
 * @param {string|null} userId
 * @returns {Promise<void>}
 */
export async function refreshHouseholdTotals(householdId, userId = null) {
  await recalculateHouseholdTotals(householdId, userId);
}


