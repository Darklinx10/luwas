/**
 * features/Map/services/mapApi.js
 *
 * Browser-safe API service for Map module
 * All calls go through Next.js API routes (server-side)
 */

export const mapApi = {
  /**
   * Fetch household markers for map display
   * Includes only top-level fields; no nested collection reads
   * Secretary users automatically filtered to their barangay server-side
   *
   * @returns {Promise<{
   *   markers: Array<{id, householdId, homeIndex, homeLabel, headFullName, barangay, sitio, contactNumber, lat, lng, totalResidents, totalMale, totalFemale, totalPWDs, totalSeniors}>,
   *   count: number,
   *   householdCount: number,
   *   barangayFilter: string|null
   * }>}
   */
  async fetchHouseholdMarkers() {
    const response = await fetch('/api/maps/household-markers', {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    });

    if (!response.ok) {
      let errorMsg = `Failed to fetch household markers: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMsg += ` - ${errorData.error}`;
        }
        if (errorData.type) {
          errorMsg += ` (${errorData.type})`;
        }
      } catch (e) {
        // Can't parse error response
      }
      throw new Error(errorMsg);
    }

    return response.json();
  },

  /**
   * Fetch all accidents for accident overlay
   *
   * @returns {Promise<Array>}
   */
  async fetchAccidents() {
    const response = await fetch('/api/accidents', {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch accidents: ${response.status}`);
    }

    const data = await response.json();
    return data.accidents || [];
  },

  /**
   * Create a new accident
   *
   * @param {Object} accidentData - Accident document data
   * @returns {Promise<Object>} Created accident with ID
   */
  async createAccident(accidentData) {
    const response = await fetch('/api/accidents', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(accidentData),
    });

    if (!response.ok) {
      throw new Error(`Failed to create accident: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Fetch boundary GeoJSON from Firestore
   * Structure: mapSettings/config/boundary/data
   *
   * @returns {Promise<Object>} Boundary GeoJSON data with metadata
   */
  async fetchBoundary() {
    const response = await fetch('/api/maps/boundary', {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null; // No boundary found
      }
      throw new Error(`Failed to fetch boundary: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Upload boundary GeoJSON to Firestore
   * Replaces existing boundary data
   * Admin only
   *
   * @param {File} geojsonFile - GeoJSON file to upload
   * @returns {Promise<Object>} Upload result with metadata
   */
  async uploadBoundary(geojsonFile) {
    const formData = new FormData();
    formData.append('file', geojsonFile);

    const response = await fetch('/api/maps/boundary', {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      let errorMsg = `Failed to upload boundary: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMsg += ` - ${errorData.error}`;
        }
      } catch (e) {
        // Can't parse error response
      }
      throw new Error(errorMsg);
    }

    return response.json();
  },

  /**
   * Fetch default map center (accessible to all authenticated users)
   *
   * @returns {Promise<{lat: number, lng: number, isDefault: boolean, updatedAt?: timestamp, updatedBy?: string}>}
   */
  async fetchDefaultCenter() {
    const response = await fetch('/api/maps/settings/default-center', {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch default center: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Set new default map center (admin only)
   *
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Promise<Object>} Update result with metadata
   */
  async setDefaultCenter(lat, lng) {
    const response = await fetch('/api/maps/settings/default-center', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lng }),
    });

    if (!response.ok) {
      let errorMsg = `Failed to set default center: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMsg += ` - ${errorData.error}`;
        }
      } catch (e) {
        // Can't parse error response
      }
      throw new Error(errorMsg);
    }

    return response.json();
  },
};

export default mapApi;
