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

/**
 * Recalculate household totals based on current members
 * Stores results in household doc for easy querying
 * 
 * @param {string} householdId - Household document ID
 * @returns {Promise<Object>} Updated totals object
 */
export async function recalculateHouseholdTotals(householdId) {
  const householdRef = adminDb.collection('households').doc(householdId);
  const membersSnapshot = await adminDb
    .collection('households')
    .doc(householdId)
    .collection('members')
    .get();

  let totalResidents = 0;
  let totalMale = 0;
  let totalFemale = 0;
  let totalPWDs = 0;
  let totalSeniors = 0;

  membersSnapshot.forEach((doc) => {
    const member = doc.data();
    totalResidents++;

    // Count by sex
    if (member.sex?.toLowerCase() === 'male') totalMale++;
    if (member.sex?.toLowerCase() === 'female') totalFemale++;

    // Count PWDs
    if (member.isPWD === true) totalPWDs++;

    // Count Seniors (age >= 60)
    const parsedAge = parseInt(member.age, 10);
    const derivedAge = !isNaN(parsedAge) ? parsedAge : calculateAge(member.birthdate);

    if (derivedAge !== null && derivedAge >= 60) totalSeniors++;
  });

  // Update household with totals
  const totals = {
    totalResidents,
    totalMale,
    totalFemale,
    totalPWDs,
    totalSeniors,
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