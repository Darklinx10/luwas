/**
 * features/Households/utils/buildHouseholdPayload.js
 * 
 * Builds and normalizes household payload for consistent top-level field generation.
 * Ensures both manual add and upload create the same Household structure.
 */

import { normalizeHousehold } from './householdFormat';

/**
 * Build a normalized household payload from raw input data
 * Ensures consistent structure for creating households
 * 
 * @param {Object} input - Raw household data
 * @returns {Object} Normalized household payload
 */
export function buildHouseholdPayload(input = {}) {
    // Normalize text fields
    const householdId = input.householdId?.trim() || '';
    const headFirstName = (input.headFirstName || '').toString().trim();
    const headMiddleName = (input.headMiddleName || '').toString().trim();
    const headLastName = (input.headLastName || '').toString().trim();
    const headSuffix = (input.headSuffix || '').toString().trim();
    const contactNumber = (input.contactNumber || '').toString().trim();
    const barangay = (input.barangay || '').toString().trim();
    const sitio = (input.sitio || '').toString().trim();
    const headSex = (input.headSex || '').toString().trim();

    // Ensure numeric fields are properly typed
    const headAge = Number(input.headAge || 0);
    const totalFamilies = Number(input.totalFamilies || 1);
    const totalResidents = Number(input.totalResidents || 0);
    const totalMale = Number(input.totalMale || 0);
    const totalFemale = Number(input.totalFemale || 0);
    const totalPWDs = Number(input.totalPWDs || 0);
    const totalSeniors = Number(input.totalSeniors || 0);

    // Ensure homes is an array
    const homes = Array.isArray(input.homes) ? input.homes : [];

    // Preserve member input for create flows that also create nested member docs
    const members = Array.isArray(input.members) ? input.members : [];

    // Ensure ageBrackets is an object/map if provided
    const ageBrackets =
        input.ageBrackets &&
        typeof input.ageBrackets === 'object' &&
        !Array.isArray(input.ageBrackets)
            ? input.ageBrackets
            : null;

    // Build the base payload
    const payload = {
        householdId,
        headFirstName,
        headMiddleName,
        headLastName,
        headSuffix,
        headSex,
        headAge,
        contactNumber,
        barangay,
        sitio,
        homes,
        totalFamilies,
        totalResidents,
        totalMale,
        totalFemale,
        totalPWDs,
        totalSeniors,
        ...(ageBrackets && { ageBrackets }),
        ...(members.length > 0 && { members }),
    };

    // Apply formatting and normalization from householdFormat
    const normalized = normalizeHousehold(payload);

    return normalized;
}
