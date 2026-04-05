/**
 * features/Map/hooks/useAccidents.js
 *
 * Custom hook for managing accident data
 * Only fetches when accident map is active
 * 
 * @param {boolean} shouldFetch - Fetch only when accident map is active and user is not admin
 */

import { useEffect, useState } from 'react';
import { mapApi } from '../services/mapApi';

export const useAccidents = (shouldFetch = true) => {
  const [accidents, setAccidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch accidents on mount and when shouldFetch changes
  useEffect(() => {
    // ✅ Only fetch when accident map is active
    if (!shouldFetch) {
      setAccidents([]);
      return;
    }

    const fetchAccidents = async () => {
      try {
        console.log('📍 Fetching accidents for accident map...');
        setLoading(true);
        setError(null);

        const data = await mapApi.fetchAccidents();
        console.log(`✅ Fetched ${data.length} accidents`);

        setAccidents(data);
      } catch (err) {
        console.error('❌ Failed to fetch accidents:', err);
        setError(err.message || 'Failed to load accidents');
      } finally {
        setLoading(false);
      }
    };

    fetchAccidents();
  }, [shouldFetch]);

  // Add new accident to local state
  const addAccident = (newAccident) => {
    setAccidents((prev) => [...prev, newAccident]);
  };

  return { accidents, loading, error, addAccident, setAccidents };
};
