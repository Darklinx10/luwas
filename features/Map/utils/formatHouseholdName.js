/**
 * features/Map/utils/formatHouseholdName.js
 *
 * Utility to build consistent household name display across Map module
 * Handles the complete fallback chain for household naming
 */

/**
 * Build household display name with comprehensive fallback chain
 *
 * Priority:
 * 1. headFullName (if exists and not empty)
 * 2. Constructed name from headFirstName + headMiddleName + headLastName + headSuffix
 * 3. householdId as identifier
 * 4. "Unnamed" only as final fallback
 *
 * @param {Object} household - Household document data
 * @param {string} [household.headFullName] - Pre-computed full name
 * @param {string} [household.headFirstName] - Head's first name
 * @param {string} [household.headMiddleName] - Head's middle name
 * @param {string} [household.headLastName] - Head's last name
 * @param {string} [household.headSuffix] - Head's suffix (Jr., Sr., etc.)
 * @param {string} [household.householdId] - Household ID fallback
 * @returns {string} Display name for household
 */
export const formatHouseholdName = (household = {}) => {
  if (!household) return 'Unnamed';

  // 1. Use pre-computed headFullName if available and not empty
  if (household.headFullName && household.headFullName.trim()) {
    return household.headFullName.trim();
  }

  // 2. Construct from individual components
  const {
    headFirstName = '',
    headMiddleName = '',
    headLastName = '',
    headSuffix = '',
    householdId = '',
  } = household;

  // Build name from components (first + middle) (last)(suffix)
  const firstPart = [headFirstName, headMiddleName]
    .filter((n) => n && n.trim())
    .join(' ')
    .trim();
  const lastPart = headLastName && headLastName.trim() ? headLastName.trim() : '';
  const suffix = headSuffix && headSuffix.trim() ? headSuffix.trim() : '';

  // Assemble full name
  const constructedName = [lastPart, firstPart, suffix]
    .filter(Boolean)
    .join(' ')
    .trim();

  if (constructedName) {
    return constructedName;
  }

  // 3. Fall back to household ID
  if (householdId && householdId.trim()) {
    return householdId.trim();
  }

  // 4. Final fallback (should rarely reach here)
  return 'Unnamed';
};

/**
 * Format household name for marker display (with residential context)
 * @param {Object} household - Household document data
 * @returns {string} Display name formatted as "Name's Residence"
 */
export const formatHouseholdResidenceName = (household = {}) => {
  const name = formatHouseholdName(household);
  // Don't append "Residence" if already has similar suffix or if it's just "Unnamed"
  if (name === 'Unnamed' || name.includes('Residence') || name.includes('residence')) {
    return name;
  }
  return `${name}'s Residence`;
};
