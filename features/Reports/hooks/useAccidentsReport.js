/**
 * Hook for Accidents report data management
 */

import { useEffect, useState } from 'react';
import { fetchAllAccidents } from '../services/reportApi';
import { toast } from 'react-toastify';

export const useAccidentsReport = () => {
  const [accidents, setAccidents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [filteredAccidents, setFilteredAccidents] = useState([]);

  // Fetch all accidents
  const fetchAccidents = async (search = '') => {
    setLoading(true);
    try {
      const data = await fetchAllAccidents({
        search,
      });

      setAccidents(data);

      // Apply search filter
      if (search) {
        const searchLower = search.toLowerCase();
        const filtered = data.filter(a =>
          Object.values(a)
            .join(' ')
            .toLowerCase()
            .includes(searchLower)
        );
        setFilteredAccidents(filtered);
      } else {
        setFilteredAccidents(data);
      }
    } catch (error) {
      console.error('Error fetching accidents:', error);
      toast.error('Failed to load accident reports.');
      setAccidents([]);
      setFilteredAccidents([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchAccidents('');
  }, []);

  // Handle search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAccidents(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  return {
    accidents: filteredAccidents,
    allAccidents: accidents,
    searchTerm,
    setSearchTerm,
    loading,
    refetch: () => fetchAccidents(searchTerm),
    setAccidents,
  };
};
