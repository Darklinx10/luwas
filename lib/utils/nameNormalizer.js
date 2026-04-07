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

/**
 * Normalize a person's name (generic for users, members, etc.)
 * Handles both individual fields and merged fullName
 * @param {string} firstName - First name
 * @param {string} middleName - Middle name
 * @param {string} lastName - Last name
 * @param {string} suffix - Suffix
 * @returns {Object} { firstName, middleName, lastName, suffix }
 */
export function normalizePerson(firstName = '', middleName = '', lastName = '', suffix = '') {
    // If we have lastName and at least one other field, use them
    if (lastName && (firstName || middleName)) {
        return normalizeNameComponents({ firstName, middleName, lastName, suffix });
    }

    // If only firstName provided, try to split it
    if (firstName && !lastName) {
        const split = splitFullName(firstName);
        return normalizeNameComponents(split);
    }

    // Otherwise normalize what we have
    return normalizeNameComponents({ firstName, middleName, lastName, suffix });
}

/**
 * Build a consistent full name string from components
 * Format: "LastName, FirstName, MiddleName, Suffix"
 * Used for display names, search keys, etc.
 * @param {string} firstName - First name
 * @param {string} middleName - Middle name
 * @param {string} lastName - Last name
 * @param {string} suffix - Suffix
 * @returns {string} Formatted full name (e.g., "Smith, John, Michael, Jr")
 */
export function buildFullName(firstName = '', middleName = '', lastName = '', suffix = '') {
    const sanitizePart = (value = '') => {
        const trimmed = String(value || '').trim();
        if (!trimmed) return '';

        const upperValue = trimmed.toUpperCase();
        if (upperValue === 'N/A' || upperValue === 'NA' || trimmed === '-') {
            return '';
        }

        return normalizeName(trimmed);
    };

    const first = sanitizePart(firstName);
    const middle = sanitizePart(middleName);
    const last = sanitizePart(lastName);
    const normalizedSuffix = sanitizePart(suffix);

    if (!last && !first) {
        return '';
    }

    const givenNames = [first, middle].filter(Boolean).join(' ');
    const formattedName = last ? `${last}${givenNames ? `, ${givenNames}` : ''}` : givenNames;

    return normalizedSuffix ? `${formattedName} ${normalizedSuffix}`.trim() : formattedName.trim();
}

/**
 * Compare two name objects for sorting
 * Sorts by: lastName, firstName, middleName, suffix
 * @param {Object} nameA - { firstName, middleName, lastName, suffix } or similar
 * @param {Object} nameB - { firstName, middleName, lastName, suffix } or similar
 * @param {string} order - 'asc' or 'desc'
 * @returns {number} For use with Array.sort()
 */
export function compareNames(nameA = {}, nameB = {}, order = 'asc') {
    const keyA = generateNameSortKey(nameA).toLowerCase();
    const keyB = generateNameSortKey(nameB).toLowerCase();

    const comparison = keyA.localeCompare(keyB);
    return order === 'asc' ? comparison : -comparison;
}

/**
 * Sort an array of objects by name field
 * @param {Array} items - Array of objects to sort
 * @param {string|Function} nameField - Field name containing name object, or function that returns name object
 * @param {string} order - 'asc' or 'desc' (default: 'asc')
 * @returns {Array} Sorted array (creates new array, doesn't mutate)
 */
export function sortByName(items = [], nameField = 'name', order = 'asc') {
    if (!Array.isArray(items) || items.length === 0) {
        return [];
    }

    return [...items].sort((a, b) => {
        let nameObjA, nameObjB;

        if (typeof nameField === 'function') {
            nameObjA = nameField(a) || {};
            nameObjB = nameField(b) || {};
        } else {
            nameObjA = a[nameField] || {};
            nameObjB = b[nameField] || {};
        }

        return compareNames(nameObjA, nameObjB, order);
    });
}
