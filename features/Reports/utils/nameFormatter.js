/**
 * Formats member names for display in reports
 */

import { capitalizeWords } from '@/utils/capitalize';

/**
 * Format name as "LastName, FirstName MiddleName"
 * @param {string} fullName - Full name to format
 * @returns {string} Formatted name
 */
export function formatNameLastFirst(fullName) {
  const cleaned = String(fullName || '').trim().replace(/\s+/g, ' ');
  if (!cleaned) return '-';

  const parts = cleaned.split(' ').filter(Boolean);
  if (parts.length === 1) return capitalizeWords(parts[0]);

  const lastName = parts[parts.length - 1];
  const firstMiddle = parts.slice(0, -1).join(' ');

  return capitalizeWords(`${lastName}, ${firstMiddle}`);
}

/**
 * Format member names from firstName, middleName, lastName fields
 * @param {Object} member - Member object with firstName, middleName, lastName
 * @returns {string} Formatted name
 */
export function formatNameFromParts(member) {
  const { firstName = '', middleName = '', lastName = '' } = member;
  const parts = [firstName, middleName, lastName].filter(p => p && p.trim());
  
  if (parts.length === 0) return '-';
  
  const last = parts[parts.length - 1];
  const first = parts.slice(0, -1).join(' ');
  
  if (!first) return capitalizeWords(last);
  return capitalizeWords(`${last}, ${first}`);
}

/**
 * Get display name from member object (handles both fullName and firstName/lastName patterns)
 * @param {Object} member - Member object
 * @returns {string} Display name
 */
export function getMemberDisplayName(member) {
  if (member.fullName) {
    return formatNameLastFirst(member.fullName);
  }
  return formatNameFromParts(member);
}
