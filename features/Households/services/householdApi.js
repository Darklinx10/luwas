import { buildHouseholdQuery } from '../utils/householdQuery';

async function parseResponse(response) {
  const rawText = await response.text();

  let data = {};
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    data = { rawText };
  }

  console.log('📡 API response status:', response.status);
  console.log('📡 API response body:', data);
  console.log('📡 API request URL:', response.url);

  if (!response.ok) {
    throw new Error(
      data?.error ||
      data?.rawText ||
      `Request failed with status ${response.status}`
    );
  }

  return data;
}

export async function fetchHouseholds({
  page = 1,
  limit = 10,
  search = '',
  sort = 'headLastName',
  order = 'asc',
  exportAll = false,
} = {}) {
  const query = buildHouseholdQuery({
    page,
    limit,
    search,
    sort,
    order,
    ...(exportAll ? { exportAll: true } : {}),
  });

  const response = await fetch(`/api/households?${query}`, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });

  return parseResponse(response);
}

export async function fetchHousehold(householdId) {
  const response = await fetch(`/api/households/${householdId}`, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });

  return parseResponse(response);
}

export async function createHousehold(payload) {
  const response = await fetch('/api/households', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    cache: 'no-store',
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}

export async function updateHousehold(householdId, payload) {
  const response = await fetch(`/api/households/${householdId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    cache: 'no-store',
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}

export async function deleteHousehold(householdId) {
  const response = await fetch(`/api/households/${householdId}`, {
    method: 'DELETE',
    credentials: 'include',
    cache: 'no-store',
  });

  return parseResponse(response);
}

export async function fetchMembers(householdId, options = {}) {
  const { page = 1, limit = 20, search = '' } = options;
  
  const query = new URLSearchParams();
  query.set('page', String(page));
  query.set('limit', String(limit));
  if (search) query.set('search', search);

  const url = `/api/households/${householdId}/members?${query.toString()}`;
  console.log('📡 Fetching members with URL:', url, { householdId, page, limit, search });

  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });

  return parseResponse(response);
}

export async function createMember(householdId, payload) {
  const response = await fetch(`/api/households/${householdId}/members`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    cache: 'no-store',
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}

export async function updateMember(householdId, memberId, payload) {
  const response = await fetch(
    `/api/households/${householdId}/members/${memberId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      cache: 'no-store',
      body: JSON.stringify(payload),
    }
  );

  return parseResponse(response);
}

export async function deleteMember(householdId, memberId) {
  const response = await fetch(
    `/api/households/${householdId}/members/${memberId}`,
    {
      method: 'DELETE',
      credentials: 'include',
      cache: 'no-store',
    }
  );

  return parseResponse(response);
}

/**
 * Fetch PWD (Persons with Disability) report
 * @param {Object} options - Query options
 * @param {number} options.page - Page number
 * @param {number} options.limit - Items per page
 * @param {string} options.search - Search term
 * @returns {Promise<Object>} Report data with pagination
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
 * Fetch Seniors (age >= 60) report
 * @param {Object} options - Query options
 * @param {number} options.page - Page number
 * @param {number} options.limit - Items per page
 * @param {string} options.search - Search term
 * @returns {Promise<Object>} Report data with pagination
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
