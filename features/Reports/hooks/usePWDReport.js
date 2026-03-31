/**
 * Hook for PWD report data management
 */

import { useEffect, useState, useMemo } from 'react';
import { fetchPWDReport, updatePWDMember, deletePWDStatus } from '../services/reportApi';
import { toast } from 'react-toastify';
import { useAuth } from '@/context/authContext';
import { getMemberDisplayName } from '../utils/nameFormatter';

export const usePWDReport = () => {
  const [pwdMembers, setPWDMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 0,
  });
  const { profile, loading: authLoading } = useAuth();

  // Fetch PWD report
  const fetchReport = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const data = await fetchPWDReport({
        page,
        limit: 20,
        search,
      });

      setPWDMembers(data.members || []);
      setPagination({
        page: data.currentPage || 1,
        limit: 20,
        totalCount: data.totalMembers || 0,
        totalPages: data.totalPages || 1,
      });
    } catch (error) {
      console.error('Error fetching PWD report:', error);
      toast.error('Failed to load PWD members.');
      setPWDMembers([]);
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

  // Save PWD member
  const savePWD = async (member) => {
    try {
      await updatePWDMember(member.memberId, member);
      setPWDMembers(prev =>
        prev.map(m => (m.memberId === member.memberId ? { ...m, ...member } : m))
      );
      toast.success('PWD member updated successfully.');
    } catch (error) {
      console.error('Error updating PWD member:', error);
      toast.error('Failed to update PWD member.');
    }
  };

  // Delete PWD status
  const deletePWD = async (member) => {
    if (!window.confirm(`Remove PWD status for ${getMemberDisplayName(member)}?`)) {
      return;
    }

    try {
      await deletePWDStatus(member.memberId);
      setPWDMembers(prev => prev.filter(m => m.memberId !== member.memberId));
      toast.success('PWD member removed successfully.');
      // Refetch to update counts
      fetchReport(pagination.page, searchTerm);
    } catch (error) {
      console.error('Error deleting PWD status:', error);
      toast.error('Failed to remove PWD member.');
    }
  };

  return {
    pwdMembers,
    searchTerm,
    setSearchTerm,
    loading,
    authLoading,
    pagination,
    goToPage,
    savePWD,
    deletePWD,
    refetch: () => fetchReport(pagination.page, searchTerm),
  };
};
