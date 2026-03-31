/**
 * features/Map/hooks/useAccidents.js
 *
 * Custom hook for managing accident data
 */

import { useEffect, useState } from 'react';
import { mapApi } from '../services/mapApi';

export const useAccidents = () => {
  const [accidents, setAccidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch accidents on mount
  useEffect(() => {
    const fetchAccidents = async () => {
      try {
        console.log('📍 Fetching accidents...');
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
  }, []);

  // Add new accident to local state
  const addAccident = (newAccident) => {
    setAccidents((prev) => [...prev, newAccident]);
  };

  return { accidents, loading, error, addAccident, setAccidents };
};
