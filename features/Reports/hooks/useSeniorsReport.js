/**
 * Hook for Senior Citizens report data management
 */

import { useEffect, useState, useMemo } from 'react';
import { fetchSeniorsReport, updateSeniorCitizen, removeSeniorStatus } from '../services/reportApi';
import { toast } from 'react-toastify';
import { useAuth } from '@/context/authContext';
import { getMemberDisplayName } from '../utils/nameFormatter';

export const useSeniorsReport = () => {
  const [seniors, setSeniors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 0,
  });
  const { profile, loading: authLoading } = useAuth();

  // Fetch Seniors report
  const fetchReport = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const data = await fetchSeniorsReport({
        page,
        limit: 20,
        search,
      });

      setSeniors(data.members || []);
      setPagination({
        page: data.currentPage || 1,
        limit: 20,
        totalCount: data.totalMembers || 0,
        totalPages: data.totalPages || 1,
      });
    } catch (error) {
      console.error('Error fetching seniors report:', error);
      toast.error('Failed to load senior citizens.');
      setSeniors([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchReport(1, '');
  }, []);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReport(1, searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Handle pagination
  const goToPage = (page) => {
    fetchReport(page, searchTerm);
  };

  // Save Senior
  const saveSenior = async (senior) => {
    try {
      await updateSeniorCitizen(senior.memberId, senior);
      setSeniors(prev =>
        prev.map(s => (s.memberId === senior.memberId ? { ...s, ...senior } : s))
      );
      toast.success('Senior citizen updated successfully.');
    } catch (error) {
      console.error('Error updating senior citizen:', error);
      toast.error('Failed to update senior citizen.');
    }
  };

  // Delete Senior status
  const deleteSenior = async (senior) => {
    if (!window.confirm(`Remove senior citizen status for ${getMemberDisplayName(senior)}?`)) {
      return;
    }

    try {
      await removeSeniorStatus(senior.memberId);
      setSeniors(prev => prev.filter(s => s.memberId !== senior.memberId));
      toast.success('Senior citizen removed successfully.');
      // Refetch to update counts
      fetchReport(pagination.page, searchTerm);
    } catch (error) {
      console.error('Error deleting senior status:', error);
      toast.error('Failed to remove senior citizen.');
    }
  };

  return {
    seniors,
    searchTerm,
    setSearchTerm,
    loading,
    authLoading,
    pagination,
    goToPage,
    saveSenior,
    deleteSenior,
    refetch: () => fetchReport(pagination.page, searchTerm),
  };
};
