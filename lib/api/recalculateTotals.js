/**
 * lib/api/recalculateTotals.js
 * 
 * Helper function to recalculate and update household totals
 * when members are added, edited, or deleted
 * 
 * Totals are important for:
 * - Efficient dashboard summary queries
 * - Pagination without reading all members
 * - Reports filtering (e.g., "which households have PWDs?")
 */

import { adminDb } from '@/lib/firebaseAdmin';

const AGE_BRACKET_KEYS = [
  'Under 1',
  '1-4',
  '5-9',
  '10-14',
  '15-19',
  '20-24',
  '25-29',
  '30-34',
  '35-39',
  '40-44',
  '45-49',
  '50-54',
  '55-59',
  '60 and over',
];

export function createEmptyAgeBrackets() {
  return AGE_BRACKET_KEYS.reduce((acc, key) => {
    acc[key] = 0;
    return acc;
  }, {});
}

function getAgeBracketKey(age) {
  if (!Number.isFinite(age) || age < 0) return null;
  if (age < 1) return 'Under 1';
  if (age <= 4) return '1-4';
  if (age <= 9) return '5-9';
  if (age <= 14) return '10-14';
  if (age <= 19) return '15-19';
  if (age <= 24) return '20-24';
  if (age <= 29) return '25-29';
  if (age <= 34) return '30-34';
  if (age <= 39) return '35-39';
  if (age <= 44) return '40-44';
  if (age <= 49) return '45-49';
  if (age <= 54) return '50-54';
  if (age <= 59) return '55-59';
  return '60 and over';
}

export function calculateAgeBrackets(members = [], headAge = null) {
  const ageBrackets = createEmptyAgeBrackets();

  const parsedHeadAge = Number(headAge);
  const headBracket = getAgeBracketKey(parsedHeadAge);
  if (headBracket) {
    ageBrackets[headBracket] += 1;
  }

  members.forEach((member) => {
    const parsedAge = parseInt(member?.age, 10);
    const derivedAge = !isNaN(parsedAge)
      ? parsedAge
      : calculateAge(member?.birthDate || member?.birthdate);
    const bracket = getAgeBracketKey(derivedAge);

    if (bracket) {
      ageBrackets[bracket] += 1;
    }
  });

  return ageBrackets;
}

/**
 * Recalculate household totals based on current members
 * Stores results in household doc for easy querying
 * 
 * @param {string} householdId - Household document ID
 * @returns {Promise<Object>} Updated totals object
 */
export async function recalculateHouseholdTotals(householdId) {
  const householdRef = adminDb.collection('households').doc(householdId);
  const householdSnapshot = await householdRef.get();
  const householdData = householdSnapshot.data() || {};
  const headAge = householdData.headAge || 0;
  const headSex = String(householdData.headSex || '').toLowerCase();

  const membersSnapshot = await adminDb
    .collection('households')
    .doc(householdId)
    .collection('members')
    .get();

  let totalResidents = householdSnapshot.exists ? 1 : 0;
  let totalMale = headSex === 'male' ? 1 : 0;
  let totalFemale = headSex === 'female' ? 1 : 0;
  let totalPWDs = 0;
  let totalSeniors = headAge >= 60 ? 1 : 0;
  const members = [];

  membersSnapshot.forEach((doc) => {
    const member = doc.data();
    members.push(member);
    totalResidents++;

    // Count by sex
    if (member.sex?.toLowerCase() === 'male') totalMale++;
    if (member.sex?.toLowerCase() === 'female') totalFemale++;

    // Count PWDs
    if (member.isPWD === true) totalPWDs++;

    // Count Seniors (age >= 60)
    const parsedAge = parseInt(member.age, 10);
    const derivedAge = !isNaN(parsedAge)
      ? parsedAge
      : calculateAge(member.birthDate || member.birthdate);

    if (derivedAge !== null && derivedAge >= 60) totalSeniors++;
  });

  const ageBrackets = calculateAgeBrackets(members, headAge);

  // Update household with totals
  const totals = {
    totalResidents,
    totalMale,
    totalFemale,
    totalPWDs,
    totalSeniors,
    ageBrackets,
    updatedAt: new Date(),
  };

  await householdRef.update(totals);

  return totals;
}

/**
 * Calculate age from birthdate
 * @param {string} birthdate - ISO date string or Firestore Timestamp
 * @returns {number} Age in years, or null if invalid
 */
export function calculateAge(birthdate) {
  if (!birthdate) return null;

  let date;
  // Handle Firestore Timestamp
  if (birthdate.toDate) {
    date = birthdate.toDate();
  } else if (typeof birthdate === 'string') {
    date = new Date(birthdate);
  } else {
    return null;
  }

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age--;
  }

  return age >= 0 ? age : null;
}
