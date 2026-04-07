import { buildFullName } from '@/lib/utils/nameNormalizer';

/**
 * Normalize text to title case (first letter capitalized, rest lowercase)
 * @param {string} value - Text to normalize
 * @returns {string} Normalized text
 */
export function normalizeString(value) {
  return String(value || '').trim();
}

/**
 * Normalize text to lowercase
 * @param {string} value - Text to normalize
 * @returns {string} Normalized lowercase text
 */
export function normalizeLower(value) {
  return normalizeString(value).toLowerCase();
}

/**
 * Capitalize each word in a string
 * @param {string} value - Text to capitalize
 * @returns {string} Text with each word capitalized
 */
export function capitalizeWords(value = '') {
  return normalizeString(value)
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Format full name as: LastName, FirstName MiddleName Suffix
 * @param {Object} nameParts - { firstName, middleName, lastName, suffix }
 * @returns {string} Formatted full name
 */
export function formatFullName({ firstName = '', middleName = '', lastName = '', suffix = '' } = {}) {
  return buildFullName(firstName, middleName, lastName, suffix);
}

/**
 * Format address as: Sitio, Barangay
 * @param {Object} addressParts - { sitio, barangay }
 * @returns {string} Formatted address
 */
export function formatAddress({ sitio = '', barangay = '' } = {}) {
  const sit = capitalizeWords(sitio);
  const brgy = capitalizeWords(barangay);

  if (!sit && !brgy) return '';
  if (!sit) return brgy;
  if (!brgy) return sit;

  return `${sit}, ${brgy}`;
}

/**
 * Normalize household data object with proper capitalization and formatting
 * @param {Object} household - Raw household data
 * @returns {Object} Normalized household data
 */
export function normalizeHousehold(household = {}) {
  // Ensure name fields are always defined and not null/undefined
  const headFirstName = capitalizeWords(household.headFirstName || '');
  const headMiddleName = capitalizeWords(household.headMiddleName || '');
  const headLastName = capitalizeWords(household.headLastName || '');
  const headSuffix = capitalizeWords(household.headSuffix || '');

  return {
    ...household,
    headFirstName,
    headMiddleName,
    headLastName,
    headSuffix,
    headFullName: formatFullName({
      firstName: household.headFirstName,
      middleName: household.headMiddleName,
      lastName: household.headLastName,
      suffix: household.headSuffix,
    }),
    barangay: capitalizeWords(household.barangay),
    sitio: capitalizeWords(household.sitio),
    address: formatAddress({
      sitio: household.sitio,
      barangay: household.barangay,
    }),
  };
}

/**
 * Combine parts into full name
 * @param {string[]} parts - Array of name parts
 * @returns {string} Combined full name
 */
export function fullName(parts = []) {
  return parts
    .map((part) => normalizeString(part))
    .filter(Boolean)
    .join(' ');
}

/**
 * Normalize member data object with proper capitalization and formatting
 * @param {Object} member - Raw member data
 * @returns {Object} Normalized member data
 */
export function normalizeMember(member = {}) {
  return {
    ...member,
    firstName: capitalizeWords(member.firstName),
    middleName: capitalizeWords(member.middleName),
    lastName: capitalizeWords(member.lastName),
    suffix: capitalizeWords(member.suffix),
    fullName: formatFullName({
      firstName: member.firstName,
      middleName: member.middleName,
      lastName: member.lastName,
      suffix: member.suffix,
    }),
    barangay: capitalizeWords(member.barangay),
    sitio: capitalizeWords(member.sitio),
    address: formatAddress({
      sitio: member.sitio,
      barangay: member.barangay,
    }),
  };
}
