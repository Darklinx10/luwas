/**
 * features/Dashboard/services/dashboardService.js
 * 
 * API service for dashboard data fetching
 */

export const dashboardApi = {
  /**
   * Fetch dashboard summary statistics
   * @returns {Promise<{
   *   summary: { totalHouseholds, totalResidents, totalFamilies, mappedHouseholds },
   *   demographics: { totalMale, totalFemale, totalPWDs, totalSeniors, malePercent, femalePercent },
   *   hazardsAndAccidents: { totalHazards, totalAccidents },
   *   barangayResidents: Array,
   *   ageBracketData: Array,
   * }>}
   */
  async fetchDashboardStats() {
    const response = await fetch('/api/dashboard', {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.stats;
  },
};
