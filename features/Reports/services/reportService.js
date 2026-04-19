/**
 * features/Reports/services/reportService.js
 *
 * Browser-safe API service for the Reports module.
 * All calls go through protected Next.js API routes.
 */

class ReportApiError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'ReportApiError';
    Object.assign(this, details);
  }
}

function buildPath(path, params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
}

async function requestJson(path, options = {}, fallbackMessage = 'Request failed') {
  const response = await fetch(path, {
    credentials: 'include',
    cache: 'no-store',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  let data = null;
  try {
    data = await response.json();
  } catch (error) {
    data = null;
  }

  if (!response.ok) {
    throw new ReportApiError(data?.error || fallbackMessage, {
      status: response.status,
      isIndexError: Boolean(data?.isIndexError),
      consoleLink: data?.consoleLink || null,
      details: data?.details || null,
      explanation: data?.explanation || null,
      payload: data,
    });
  }

  return data;
}

export async function fetchPWDReport(params = {}) {
  const { page = 1, limit = 10, search = '', exportAll = false } = params;

  return requestJson(
    buildPath('/api/reports/pwd', {
      ...(exportAll ? {} : { page, limit }),
      search,
      ...(exportAll ? { exportAll: true } : {}),
    }),
    { method: 'GET' },
    'Failed to fetch PWD report'
  );
}

export async function fetchSeniorsReport(params = {}) {
  const { page = 1, limit = 10, search = '', exportAll = false } = params;

  return requestJson(
    buildPath('/api/reports/seniors', {
      ...(exportAll ? {} : { page, limit }),
      search,
      ...(exportAll ? { exportAll: true } : {}),
    }),
    { method: 'GET' },
    'Failed to fetch Seniors report'
  );
}

export async function fetchAffectedHouseholdsReport(params = {}) {
  const { hazardType = '' } = params;

  return requestJson(
    buildPath('/api/reports/affected-households', { hazardType }),
    { method: 'GET' },
    'Failed to fetch affected households report'
  );
}

export async function fetchAccidentsReport() {
  return requestJson('/api/accidents', { method: 'GET' }, 'Failed to fetch accident report');
}

export async function fetchAccidentById(id) {
  return requestJson(`/api/accidents/${id}`, { method: 'GET' }, 'Failed to fetch accident');
}

export async function updateAccidentReport(id, payload) {
  return requestJson(
    `/api/accidents/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
    'Failed to update accident'
  );
}

export async function deleteAccidentReport(id) {
  return requestJson(`/api/accidents/${id}`, { method: 'DELETE' }, 'Failed to delete accident');
}

export const reportApi = {
  fetchPWDReport,
  fetchSeniorsReport,
  fetchAffectedHouseholdsReport,
  fetchAccidentsReport,
  fetchAccidentById,
  updateAccidentReport,
  deleteAccidentReport,
};

export { ReportApiError };
