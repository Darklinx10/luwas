/**
 * Hook for Accidents report data management
 * ✅ FIXED: Added pagination and narrowed search to user-facing fields only
 */

import { useEffect, useState } from 'react';
import { fetchAllAccidents } from '../services/reportApi';
import { toast } from 'react-toastify';

export const useAccidentsReport = () => {
  const [accidents, setAccidents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [filteredAccidents, setFilteredAccidents] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 1,
  });

  // Fetch all accidents
  const fetchAccidents = async (search = '') => {
    setLoading(true);
    try {
      const data = await fetchAllAccidents({
        search,
      });

      // Total count and pagination
      const totalCount = Array.isArray(data) ? data.length : 0;
      const limit = 20;
      const totalPages = Math.ceil(totalCount / limit);

      setAccidents(data || []);

      // Apply search filter on user-facing fields ONLY (not coordinates, timestamps, etc)
      let filtered = data;
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = data.filter(a => {
          // ✅ FIXED: Only search user-facing fields (type, description, location name)
          // Do NOT search: lat, lng, timestamps, internal IDs, etc.
          const searchablefields = [
            a.type,
            a.severity,
            a.description,
            a.locationName,
            a.barangay,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          return searchablefields.includes(searchLower);
        });
      }

      setFilteredAccidents(filtered);
      setPagination({
        page: 1,
        limit,
        totalCount,
        totalPages,
      });
    } catch (error) {
      console.error('Error fetching accidents:', error);
      toast.error('Failed to load accident reports.');
      setAccidents([]);
      setFilteredAccidents([]);
      setPagination({ page: 1, limit: 20, totalCount: 0, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchAccidents('');
  }, []);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAccidents(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Get paginated results
  const getPaginatedAccidents = () => {
    const start = (pagination.page - 1) * pagination.limit;
    const end = start + pagination.limit;
    return filteredAccidents.slice(start, end);
  };

  // Handle page change
  const goToPage = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page }));
    }
  };

  return {
    accidents: getPaginatedAccidents(), // ✅ Return paginated results
    allAccidents: accidents,
    searchTerm,
    setSearchTerm,
    loading,
    pagination,
    goToPage,
    refetch: () => fetchAccidents(searchTerm),
    setAccidents,
  };
};
