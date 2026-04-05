/**
 * features/Map/hooks/useHouseholdMarkers.js
 *
 * Custom hook for managing household marker data fetching
 * 
 * @param {boolean} shouldFetch - If false, skip fetching (e.g., for admin users)
 */

import { useEffect, useState } from 'react';
import { mapApi } from '../services/mapApi';

export const useHouseholdMarkers = (shouldFetch = true) => {
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // ✅ Skip fetching if disabled for this role
    if (!shouldFetch) {
      setMarkers([]);
      return;
    }

    const fetchMarkers = async () => {
      try {
        console.log('🗺️ Fetching household markers...');
        setLoading(true);
        setError(null);

        const data = await mapApi.fetchHouseholdMarkers();
        console.log(`✅ Fetched ${data.markers.length} markers from ${data.householdCount} households`);

        setMarkers(data.markers);
      } catch (err) {
        console.error('❌ Failed to fetch household markers:', err);
        setError(err.message || 'Failed to load household markers');
      } finally {
        setLoading(false);
      }
    };

    fetchMarkers();
  }, [shouldFetch]);

  return { markers, loading, error };
};
