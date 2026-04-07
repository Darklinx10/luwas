/**
 * features/Reports/hooks/useAffectedHouseholdsReport.js
 *
 * Fetches hazard-affected household rows from the protected report API.
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchAffectedHouseholdsReport } from '../services/reportService';
import { hazardTypes as defaultHazardTypes } from '@/utils/hazardTypes';

export function useAffectedHouseholdsReport(initialHazardType = '') {
  const [hazardType, setHazardType] = useState(initialHazardType);
  const [hazardTypes, setHazardTypes] = useState(defaultHazardTypes);
  const [records, setRecords] = useState([]);
  const [legendProp, setLegendProp] = useState(null);
  const [activeHazardType, setActiveHazardType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchAffectedHouseholdsReport({ hazardType });

      setHazardTypes(data.hazardTypes || []);
      setRecords(data.affectedHouseholds || []);
      setLegendProp(data.legendProp || null);
      setActiveHazardType(data.selectedHazardType || '');
    } catch (err) {
      setError(err.message || 'Failed to load affected households report');
      setRecords([]);
      setLegendProp(null);
      setActiveHazardType('');
    } finally {
      setLoading(false);
    }
  }, [hazardType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    hazardType,
    setHazardType,
    hazardTypes,
    activeHazardType,
    records,
    legendProp,
    loading,
    error,
    refetch: fetchData,
  };
}
