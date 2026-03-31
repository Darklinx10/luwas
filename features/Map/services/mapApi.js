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
      throw new Error(`Failed to fetch household markers: ${response.status}`);
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
};
