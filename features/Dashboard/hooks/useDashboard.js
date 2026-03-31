/**
 * features/Dashboard/hooks/useDashboard.js
 * 
 * Custom hook for managing dashboard state and data fetching
 */

import { useEffect, useState } from 'react';
import { dashboardApi } from '../services/dashboardService';

export const useDashboard = (profile, authLoading) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [stats, setStats] = useState({
    households: 0,
    residents: 0,
    families: 0,
    male: 0,
    female: 0,
    pwd: 0,
    seniors: 0,
    hazards: 0,
    accidents: 0,
    mapped: 0,
    malePercent: 0,
    femalePercent: 0,
  });
  
  const [barangayResidents, setBarangayResidents] = useState([]);
  const [ageBracketData, setAgeBracketData] = useState([]);

  useEffect(() => {
    if (authLoading || !profile) return;

    let cancelled = false;

    const fetchData = async () => {
      console.log('📊 Fetching dashboard data...');
      setLoading(true);
      setError(null);
      
      try {
        const apiStats = await dashboardApi.fetchDashboardStats();

        if (cancelled) return;

        console.log('✅ Dashboard data received:', {
          households: apiStats.summary.totalHouseholds,
          residents: apiStats.summary.totalResidents,
          pwds: apiStats.demographics.totalPWDs,
          seniors: apiStats.demographics.totalSeniors,
          hazards: apiStats.hazardsAndAccidents.totalHazards,
          accidents: apiStats.hazardsAndAccidents.totalAccidents,
        });

        // Update stats from API response
        setStats({
          households: apiStats.summary.totalHouseholds,
          residents: apiStats.summary.totalResidents,
          families: apiStats.summary.totalFamilies,
          male: apiStats.demographics.totalMale,
          female: apiStats.demographics.totalFemale,
          pwd: apiStats.demographics.totalPWDs,
          seniors: apiStats.demographics.totalSeniors,
          hazards: apiStats.hazardsAndAccidents.totalHazards,
          accidents: apiStats.hazardsAndAccidents.totalAccidents,
          mapped: apiStats.summary.mappedHouseholds,
          malePercent: apiStats.demographics.malePercent,
          femalePercent: apiStats.demographics.femalePercent,
        });

        // Set barangay breakdown
        setBarangayResidents(apiStats.barangayResidents || []);

        // Set age bracket data
        setAgeBracketData(apiStats.ageBracketData || []);
      } catch (err) {
        if (!cancelled) {
          console.error('❌ Dashboard fetch error:', err);
          setError(err.message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [authLoading, profile]);

  return {
    loading,
    error,
    stats,
    barangayResidents,
    ageBracketData,
  };
};
