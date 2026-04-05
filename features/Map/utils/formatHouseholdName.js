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
  try {
    if (!household || typeof household !== 'object') return 'Unnamed';

    // 1. Use pre-computed headFullName if available and not empty
    if (household.headFullName && typeof household.headFullName === 'string' && household.headFullName.trim()) {
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

    // Ensure all values are strings before processing
    const firstName = typeof headFirstName === 'string' ? headFirstName : '';
    const middleName = typeof headMiddleName === 'string' ? headMiddleName : '';
    const lastName = typeof headLastName === 'string' ? headLastName : '';
    const suffix = typeof headSuffix === 'string' ? headSuffix : '';
    const id = typeof householdId === 'string' ? householdId : '';

    // Build name from components (first + middle) (last)(suffix)
    const firstPart = [firstName, middleName]
      .filter((n) => n && n.trim())
      .join(' ')
      .trim();
    const lastPart = lastName && lastName.trim() ? lastName.trim() : '';
    const suffixPart = suffix && suffix.trim() ? suffix.trim() : '';

    // Assemble full name
    const constructedName = [lastPart, firstPart, suffixPart]
      .filter(Boolean)
      .join(' ')
      .trim();

    if (constructedName) {
      return constructedName;
    }

    // 3. Fall back to household ID
    if (id && id.trim()) {
      return id.trim();
    }

    // 4. Final fallback
    return 'Unnamed';
  } catch (error) {
    console.error('Error in formatHouseholdName:', error);
    return 'Unnamed';
  }
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
