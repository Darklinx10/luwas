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
import { recalculateHouseholdTotals } from './recalculateTotals';

const HOUSEHOLDS_COLLECTION = 'households';

const ALLOWED_SORT_FIELDS = [
  'headLastName',
  'headFirstName',
  'barangay',
  'sitio',
  'createdAt',
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

  // Firestore query for ordered results
  let orderedQuery = baseQuery.orderBy(safeSort, safeOrder);

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

  const data = {
    householdId,
    barangay: payload.barangay?.trim() || '',
    sitio: payload.sitio?.trim() || '',
    headFirstName: payload.headFirstName?.trim() || '',
    headMiddleName: payload.headMiddleName?.trim() || '',
    headLastName: payload.headLastName?.trim() || '',
    headSuffix: payload.headSuffix?.trim() || '',
    headFullName:
      payload.headFullName?.trim() ||
      [
        payload.headFirstName?.trim() || '',
        payload.headMiddleName?.trim() || '',
        payload.headLastName?.trim() || '',
        payload.headSuffix?.trim() || '',
      ]
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
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
    totalResidents: Number(payload.totalResidents || 0),
    totalMale: Number(payload.totalMale || 0),
    totalFemale: Number(payload.totalFemale || 0),
    totalPWDs: Number(payload.totalPWDs || 0),
    totalSeniors: Number(payload.totalSeniors || 0),
    createdAt: now,
    updatedAt: now,
    createdBy: userId || null,
    updatedBy: userId || null,
  };

  await adminDb.collection(HOUSEHOLDS_COLLECTION).doc(householdId).set(data);

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

  const normalizedUpdates = {
    ...updates,
    ...(updates.barangay !== undefined && {
      barangay: updates.barangay?.trim() || '',
    }),
    ...(updates.sitio !== undefined && {
      sitio: updates.sitio?.trim() || '',
    }),
    ...(updates.headFirstName !== undefined && {
      headFirstName: updates.headFirstName?.trim() || '',
    }),
    ...(updates.headMiddleName !== undefined && {
      headMiddleName: updates.headMiddleName?.trim() || '',
    }),
    ...(updates.headLastName !== undefined && {
      headLastName: updates.headLastName?.trim() || '',
    }),
    ...(updates.headSuffix !== undefined && {
      headSuffix: updates.headSuffix?.trim() || '',
    }),
    ...(updates.headFullName !== undefined && {
      headFullName: updates.headFullName?.trim() || '',
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


