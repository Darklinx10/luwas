/**
 * Name Normalization & Splitting Utility
 * Handles splitting full names into components and normalizing them
 */

/**
 * Split a full name into components: firstName, middleName, lastName, suffix
 * Handles various formats and edge cases
 * 
 * @param {string} fullName - Full name string (e.g., "Juan Dela Cruz Jr.", "Smith, John Michael")
 * @returns {Object} { firstName, middleName, lastName, suffix }
 */
export function splitFullName(fullName = '') {
    if (!fullName || typeof fullName !== 'string') {
        return { firstName: '', middleName: '', lastName: '', suffix: '' };
    }

    const name = fullName.trim();
    if (!name) return { firstName: '', middleName: '', lastName: '', suffix: '' };

    // Common suffixes to detect
    const suffixes = ['jr', 'sr', 'ii', 'iii', 'iv', 'v', 'ph.d', 'md', 'esq', 'dds', 'dvm'];
    const suffixPattern = new RegExp(`\\b(${suffixes.join('|')})\\b\\.?`, 'i');

    let workingName = name;
    let suffix = '';

    // Extract suffix
    const suffixMatch = workingName.match(suffixPattern);
    if (suffixMatch) {
        suffix = suffixMatch[1];
        workingName = workingName.replace(suffixPattern, '').trim();
    }

    // Handle "LastName, FirstName MiddleName" format
    if (workingName.includes(',')) {
        const parts = workingName.split(',').map((p) => p.trim());
        const lastName = parts[0];
        const remaining = parts.slice(1).join(' ').trim();
        const remainingParts = remaining.split(/\s+/);

        const firstName = remainingParts[0] || '';
        const middleName = remainingParts.slice(1).join(' ') || '';

        return {
            firstName: firstName.trim(),
            middleName: middleName.trim(),
            lastName: lastName.trim(),
            suffix: suffix.trim(),
        };
    }

    // Handle "FirstName MiddleName(s) LastName" format
    const parts = workingName.split(/\s+/).filter(Boolean);

    if (parts.length === 0) {
        return { firstName: '', middleName: '', lastName: '', suffix: '' };
    }

    if (parts.length === 1) {
        // Single word: assume it's a last name
        return {
            firstName: '',
            middleName: '',
            lastName: parts[0],
            suffix: suffix.trim(),
        };
    }

    if (parts.length === 2) {
        // Two words: first and last name
        return {
            firstName: parts[0],
            middleName: '',
            lastName: parts[1],
            suffix: suffix.trim(),
        };
    }

    // Three or more words: first, middle (all but last), last
    return {
        firstName: parts[0],
        middleName: parts.slice(1, -1).join(' '),
        lastName: parts[parts.length - 1],
        suffix: suffix.trim(),
    };
}

/**
 * Normalize a single name component (capitalize, trim, handle accents)
 * @param {string} value - Name component
 * @returns {string} Normalized name
 */
export function normalizeName(value = '') {
    if (!value || typeof value !== 'string') return '';

    return value
        .trim()
        .split(/\s+/)
        .map((word) => {
            if (!word) return '';
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(' ');
}

/**
 * Normalize all name components
 * @param {Object} nameObj - { firstName, middleName, lastName, suffix }
 * @returns {Object} Normalized name object
 */
export function normalizeNameComponents(nameObj = {}) {
    return {
        firstName: normalizeName(nameObj.firstName || ''),
        middleName: normalizeName(nameObj.middleName || ''),
        lastName: normalizeName(nameObj.lastName || ''),
        suffix: normalizeName(nameObj.suffix || ''),
    };
}

/**
 * Process a potentially merged name field and split if needed
 * Falls back to splitting full name if individual fields are missing
 * @param {Object} data - { headFirstName, headMiddleName, headLastName, headSuffix, OR headFullName }
 * @returns {Object} { headFirstName, headMiddleName, headLastName, headSuffix }
 */
export function processHeadName(data = {}) {
    // If individual fields are provided and valid, use them
    if (
        data.headLastName &&
        (data.headFirstName || data.headMiddleName)
    ) {
        return normalizeNameComponents({
            firstName: data.headFirstName || '',
            middleName: data.headMiddleName || '',
            lastName: data.headLastName,
            suffix: data.headSuffix || '',
        });
    }

    // Fall back: try to split headFullName
    if (data.headFullName) {
        const split = splitFullName(data.headFullName);
        return normalizeNameComponents(split);
    }

    // Last resort: try to split a merged field if present
    if (data.headFirstName && !data.headLastName) {
        const split = splitFullName(data.headFirstName);
        return normalizeNameComponents(split);
    }

    // No usable data
    return {
        firstName: normalizeName(data.headFirstName || ''),
        middleName: normalizeName(data.headMiddleName || ''),
        lastName: normalizeName(data.headLastName || ''),
        suffix: normalizeName(data.headSuffix || ''),
    };
}

/**
 * Generate a sortable key for names (case-insensitive, Unicode-aware)
 * Used for both Firestore and client-side sorting
 * @param {Object} nameObj - { firstName, middleName, lastName, suffix }
 * @returns {string} Sortable key
 */
export function generateNameSortKey(nameObj = {}) {
    const parts = [
        (nameObj.lastName || '').toLowerCase(),
        (nameObj.firstName || '').toLowerCase(),
        (nameObj.middleName || '').toLowerCase(),
        (nameObj.suffix || '').toLowerCase(),
    ];
    return parts.filter(Boolean).join('|');
}

/**
 * Validate name components (check for at least a last name or first name)
 * @param {Object} nameObj - { firstName, middleName, lastName, suffix }
 * @returns {boolean} True if valid
 */
export function isValidName(nameObj = {}) {
    const { firstName = '', lastName = '' } = nameObj;
    return !!(firstName.trim() || lastName.trim());
}
