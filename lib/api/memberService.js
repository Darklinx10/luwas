/**
 * lib/api/memberService.js
 *
 * Firestore operations for household members
 * Handles member CRUD plus report-oriented queries that stay aligned
 * with top-level household summaries.
 */

import { adminDb } from '@/lib/firebaseAdmin';
import { recalculateHouseholdTotals, calculateAge } from './recalculateTotals';
import { buildFullName, normalizeNameComponents } from '@/lib/utils/nameNormalizer';
import { formatHouseholdName } from '@/features/Map/utils/formatHouseholdName';

const REPORT_HOUSEHOLD_FIELDS = [
  'headFirstName',
  'headMiddleName',
  'headLastName',
  'headSuffix',
  'headSex',
  'headFullName',
  'headAge',
  'barangay',
  'sitio',
  'contactNumber',
  'totalPWDs',
  'totalSeniors',
];

const REPORT_MEMBER_FIELDS = [
  'firstName',
  'middleName',
  'lastName',
  'suffix',
  'fullName',
  'birthDate',
  'birthdate',
  'age',
  'sex',
  'barangay',
  'sitio',
  'contactNumber',
  'isPWD',
  'isSeniorCitizen',
  'relationshipToHead',
];

function capitalizeWords(value = '') {
  return String(value || '')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function compareRecordsByName(a, b) {
  const fields = ['lastName', 'firstName', 'middleName', 'suffix'];

  for (const field of fields) {
    const left = String(a?.[field] || '').toLowerCase();
    const right = String(b?.[field] || '').toLowerCase();
    const comparison = left.localeCompare(right);

    if (comparison !== 0) {
      return comparison;
    }
  }

  const leftHousehold = String(a?.householdId || '').toLowerCase();
  const rightHousehold = String(b?.householdId || '').toLowerCase();
  const householdComparison = leftHousehold.localeCompare(rightHousehold);

  if (householdComparison !== 0) {
    return householdComparison;
  }

  return String(a?.recordId || a?.memberId || '')
    .toLowerCase()
    .localeCompare(String(b?.recordId || b?.memberId || '').toLowerCase());
}

function getDerivedMemberAge(member = {}) {
  const parsedAge = parseInt(member?.age, 10);
  if (!isNaN(parsedAge)) {
    return parsedAge;
  }

  return calculateAge(member?.birthDate || member?.birthdate);
}

function buildHouseholdContext(householdId, household = {}) {
  return {
    householdId,
    headFirstName: capitalizeWords(household?.headFirstName || ''),
    headLastName: capitalizeWords(household?.headLastName || ''),
    headFullName: formatHouseholdName({
      householdId,
      ...household,
    }),
    householdBarangay: capitalizeWords(household?.barangay || ''),
    householdSitio: capitalizeWords(household?.sitio || ''),
    householdContactNumber: String(household?.contactNumber || '').trim(),
  };
}

function buildReportMemberRecord({ memberId, householdId, member = {}, household = {} }) {
  const age = getDerivedMemberAge(member);
  const birthDate = member?.birthDate || member?.birthdate || '';
  const normalizedNames = normalizeNameComponents({
    firstName: member?.firstName,
    middleName: member?.middleName,
    lastName: member?.lastName,
    suffix: member?.suffix,
  });

  return {
    memberId,
    recordId: `member:${householdId}:${memberId}`,
    recordType: 'Member',
    householdId,
    ...member,
    firstName: normalizedNames.firstName,
    middleName: normalizedNames.middleName,
    lastName: normalizedNames.lastName,
    suffix: normalizedNames.suffix,
    fullName:
      buildFullName(
        normalizedNames.firstName,
        normalizedNames.middleName,
        normalizedNames.lastName,
        normalizedNames.suffix
      ) || member?.fullName || '',
    age,
    birthDate,
    birthdate: birthDate,
    sex: capitalizeWords(member?.sex || ''),
    barangay: capitalizeWords(member?.barangay || ''),
    sitio: capitalizeWords(member?.sitio || ''),
    contactNumber: String(member?.contactNumber || household?.contactNumber || '').trim(),
    ...buildHouseholdContext(householdId, household),
  };
}

function buildSeniorHeadRecord(householdId, household = {}) {
  const headAge = Number(household?.headAge);

  if (!Number.isFinite(headAge) || headAge < 60) {
    return null;
  }

  return {
    recordId: `head:${householdId}`,
    recordType: 'Household Head',
    memberId: null,
    householdId,
    firstName: capitalizeWords(household?.headFirstName || ''),
    middleName: capitalizeWords(household?.headMiddleName || ''),
    lastName: capitalizeWords(household?.headLastName || ''),
    suffix: capitalizeWords(household?.headSuffix || ''),
    fullName: formatHouseholdName({
      householdId,
      ...household,
    }),
    age: headAge,
    sex: capitalizeWords(household?.headSex || ''),
    birthDate: '',
    birthdate: '',
    contactNumber: String(household?.contactNumber || '').trim(),
    relationshipToHead: 'Household Head',
    ...buildHouseholdContext(householdId, household),
  };
}

async function fetchReportHouseholds(options = {}) {
  const { barangay = null, predicate = null, summaryField = null } = options;

  let query = adminDb.collection('households');
  if (barangay) {
    query = query.where('barangay', '==', barangay);
  } else if (summaryField) {
    query = query.where(summaryField, '>', 0);
  }

  query = query.select(...REPORT_HOUSEHOLD_FIELDS);

  const snapshot = await query.get();

  return snapshot.docs
    .map((doc) => ({
      householdId: doc.id,
      household: doc.data() || {},
    }))
    .filter(({ household }) => (predicate ? predicate(household) : true));
}

/**
 * Fetch paginated members for a household
 */
export async function fetchMembersQuery(householdId, options = {}) {
  const { page = 1, limit = 10, search = '' } = options;
  const normalizedSearch = String(search || '').trim().toLowerCase();

  const baseQuery = adminDb
    .collection('households')
    .doc(householdId)
    .collection('members');

  const sortMembers = (items) => items.sort(compareRecordsByName);

  if (normalizedSearch) {
    const snapshot = await baseQuery.get();

    const filtered = sortMembers(
      snapshot.docs
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
    );

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
  }

  const snapshot = await baseQuery.get();
  const allMembers = sortMembers(
    snapshot.docs.map((doc) => ({
      memberId: doc.id,
      householdId,
      ...doc.data(),
    }))
  );

  const totalCount = allMembers.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  const startIndex = (page - 1) * limit;
  const members = allMembers.slice(startIndex, startIndex + limit);

  return {
    members,
    totalCount,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

/**
 * Get single member
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
 */
export async function createMember(householdId, payload, userId) {
  const parsedAge = parseInt(payload.age, 10);
  const normalizedBirthDate = payload.birthDate || payload.birthdate || '';
  const derivedAge = !isNaN(parsedAge) ? parsedAge : calculateAge(normalizedBirthDate);

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
    birthDate: normalizedBirthDate,
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

  await recalculateHouseholdTotals(householdId);

  return docRef.id;
}

/**
 * Update member and recalculate household totals
 */
export async function updateMember(householdId, memberId, payload, userId) {
  const parsedAge = parseInt(payload.age, 10);
  const normalizedBirthDate =
    payload.birthDate !== undefined || payload.birthdate !== undefined
      ? payload.birthDate || payload.birthdate || ''
      : undefined;
  const derivedAge =
    payload.age !== undefined || normalizedBirthDate !== undefined
      ? (!isNaN(parsedAge) ? parsedAge : calculateAge(normalizedBirthDate))
      : undefined;

  const shouldNormalizeNames =
    payload.firstName !== undefined ||
    payload.middleName !== undefined ||
    payload.lastName !== undefined ||
    payload.suffix !== undefined;

  const normalizedNames = shouldNormalizeNames
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
    ...(shouldNormalizeNames &&
      payload.fullName === undefined && {
        fullName: [
          normalizedNames?.firstName || '',
          normalizedNames?.middleName || '',
          normalizedNames?.lastName || '',
          normalizedNames?.suffix || '',
        ]
          .filter(Boolean)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim(),
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
    ...(normalizedBirthDate !== undefined && {
      birthDate: normalizedBirthDate,
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

  await recalculateHouseholdTotals(householdId);
}

/**
 * Delete member and recalculate household totals
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

  await recalculateHouseholdTotals(householdId);
}

/**
 * Get all members with PWD = true for a household
 */
export async function getPWDMembers(householdId) {
  const snap = await adminDb
    .collection('households')
    .doc(householdId)
    .collection('members')
    .where('isPWD', '==', true)
    .get();

  return snap.docs
    .map((doc) => ({
      memberId: doc.id,
      householdId,
      ...doc.data(),
    }))
    .sort(compareRecordsByName);
}

/**
 * Get all senior members for a household
 */
export async function getSeniorMembers(householdId) {
  const snap = await adminDb
    .collection('households')
    .doc(householdId)
    .collection('members')
    .get();

  return snap.docs
    .map((doc) => ({
      memberId: doc.id,
      householdId,
      ...doc.data(),
    }))
    .filter((member) => {
      const age = getDerivedMemberAge(member);
      return member.isSeniorCitizen === true || (age !== null && age >= 60);
    })
    .sort(compareRecordsByName);
}

/**
 * Fetch all PWD members across households with optional barangay filter
 */
export async function getAllPWDMembers(options = {}) {
  const { barangay = null } = options;
  const candidateHouseholds = await fetchReportHouseholds({
    barangay,
    summaryField: 'totalPWDs',
    predicate: (household) => Number(household?.totalPWDs || 0) > 0,
  });

  const pwdMembers = [];

  await Promise.all(
    candidateHouseholds.map(async ({ householdId, household }) => {
      const membersSnap = await adminDb
        .collection('households')
        .doc(householdId)
        .collection('members')
        .select(...REPORT_MEMBER_FIELDS)
        .where('isPWD', '==', true)
        .get();

      membersSnap.forEach((memberDoc) => {
        pwdMembers.push(
          buildReportMemberRecord({
            memberId: memberDoc.id,
            householdId,
            member: memberDoc.data(),
            household,
          })
        );
      });
    })
  );

  return pwdMembers.sort(compareRecordsByName);
}

/**
 * Fetch all senior records across households with optional barangay filter
 * Includes both member seniors and household heads age 60+.
 */
export async function getAllSeniorMembers(options = {}) {
  const { barangay = null } = options;
  const candidateHouseholds = await fetchReportHouseholds({
    barangay,
    predicate: (household) =>
      Number(household?.totalSeniors || 0) > 0 || Number(household?.headAge || 0) >= 60,
  });

  const seniorRecords = [];

  await Promise.all(
    candidateHouseholds.map(async ({ householdId, household }) => {
      const headRecord = buildSeniorHeadRecord(householdId, household);
      if (headRecord) {
        seniorRecords.push(headRecord);
      }

      const membersSnap = await adminDb
        .collection('households')
        .doc(householdId)
        .collection('members')
        .select(...REPORT_MEMBER_FIELDS)
        .get();

      membersSnap.forEach((memberDoc) => {
        const memberData = memberDoc.data();
        const age = getDerivedMemberAge(memberData);

        if (memberData.isSeniorCitizen === true || (age !== null && age >= 60)) {
          seniorRecords.push(
            buildReportMemberRecord({
              memberId: memberDoc.id,
              householdId,
              member: memberData,
              household,
            })
          );
        }
      });
    })
  );

  return seniorRecords.sort(compareRecordsByName);
}
