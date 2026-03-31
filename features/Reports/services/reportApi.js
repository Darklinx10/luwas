/**
 * features/Reports/services/reportApi.js
 * 
 * Centralized API service for all report types
 * Handles PWD, Seniors, Accidents, and Hazard reports
 */

/**
 * Parse API response and handle errors
 * @private
 */
async function parseResponse(response) {
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || `API Error: ${response.status}`);
  }
  
  if (!data.success) {
    throw new Error(data.error || 'Unknown error');
  }
  
  return data;
}

/**
 * Fetch PWD (Persons with Disability) report
 * @param {Object} options - Query options
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Items per page (default: 20)
 * @param {string} options.search - Search term
 * @returns {Promise<Object>} Report data with pagination
 * @throws {Error} If request fails
 */
export async function fetchPWDReport(options = {}) {
  const { page = 1, limit = 20, search = '' } = options;
  const query = new URLSearchParams();
  query.set('page', String(page));
  query.set('limit', String(limit));
  if (search) query.set('search', search);

  const response = await fetch(`/api/reports/pwd?${query.toString()}`, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });

  return parseResponse(response);
}

/**
 * Fetch Seniors (age >= 60 or isSeniorCitizen = true) report
 * @param {Object} options - Query options
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Items per page (default: 20)
 * @param {string} options.search - Search term
 * @returns {Promise<Object>} Report data with pagination
 * @throws {Error} If request fails
 */
export async function fetchSeniorsReport(options = {}) {
  const { page = 1, limit = 20, search = '' } = options;
  const query = new URLSearchParams();
  query.set('page', String(page));
  query.set('limit', String(limit));
  if (search) query.set('search', search);

  const response = await fetch(`/api/reports/seniors?${query.toString()}`, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });

  return parseResponse(response);
}

/**
 * Fetch all accidents
 * @returns {Promise<Object>} Accidents data
 * @throws {Error} If request fails
 */
export async function fetchAccidents() {
  const response = await fetch('/api/accidents', {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch accidents: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch hazard data by type (used for hazard reports)
 * @param {string} hazardType - Type of hazard (e.g., 'flood', 'landslide')
 * @returns {Promise<Object>} GeoJSON with hazard features
 * @throws {Error} If request fails
 */
export async function fetchHazardReport(hazardType) {
  const response = await fetch(`/api/hazards/${encodeURIComponent(hazardType)}`, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${hazardType} hazards: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Update PWD member record
 * @param {string} memberId - Member ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated member data
 * @throws {Error} If request fails
 */
export async function updatePWDMember(memberId, updateData) {
  const response = await fetch(`/api/members/${memberId}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    throw new Error(`Failed to update PWD member: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Delete PWD status for a member
 * @param {string} memberId - Member ID
 * @returns {Promise<Object>} Response data
 * @throws {Error} If request fails
 */
export async function deletePWDStatus(memberId) {
  const response = await fetch(`/api/members/${memberId}/removePWD`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to remove PWD status: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Update Senior Citizen record
 * @param {string} memberId - Member ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated member data
 * @throws {Error} If request fails
 */
export async function updateSeniorCitizen(memberId, updateData) {
  const response = await fetch(`/api/members/${memberId}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    throw new Error(`Failed to update senior citizen: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Remove Senior Citizen status for a member
 * @param {string} memberId - Member ID
 * @returns {Promise<Object>} Response data
 * @throws {Error} If request fails
 */
export async function removeSeniorStatus(memberId) {
  const response = await fetch(`/api/members/${memberId}/removeSenior`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to remove senior status: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch all accidents with optional filtering
 * @param {Object} options - Query options
 * @param {string} options.search - Search term
 * @returns {Promise<Array>} Array of accident records
 * @throws {Error} If request fails
 */
export async function fetchAllAccidents(options = {}) {
  const { search = '' } = options;
  
  try {
    const response = await fetch('/api/accidents', {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch accidents: ${response.statusText}`);
    }

    let accidents = await response.json();

    // Filter by search term if provided
    if (search) {
      const searchLower = search.toLowerCase();
      accidents = accidents.filter(a =>
        Object.values(a)
          .join(' ')
          .toLowerCase()
          .includes(searchLower)
      );
    }

    return accidents;
  } catch (error) {
    throw new Error(`Failed to fetch accidents: ${error.message}`);
  }
}
