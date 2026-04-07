/**
 * features/Reports/hooks/useSeniorsReport.js
 *
 * React hook for Seniors (Senior Citizens) report
 * Handles fetching, pagination, and search
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { fetchSeniorsReport } from '../services/reportService';

export function useSeniorsReport(initialPage = 1, initialLimit = 10) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [search, setSearch] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const [isIndexError, setIsIndexError] = useState(false);
  const [indexErrorLink, setIndexErrorLink] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsIndexError(false);
    setIndexErrorLink(null);

    try {
      const data = await fetchSeniorsReport({ page, limit, search });

      setMembers(data.members || []);
      setTotalCount(data.totalMembers || 0);
      setTotalPages(data.totalPages || 0);
      setHasNextPage(data.hasNextPage || false);
      setHasPrevPage(data.hasPrevPage || false);
      setIsIndexError(Boolean(data.isIndexError));
    } catch (err) {
      setError(err.message || 'Failed to load Seniors report');
      setMembers([]);
      setTotalCount(0);
      setTotalPages(0);
      setHasNextPage(false);
      setHasPrevPage(false);
      setIsIndexError(Boolean(err.isIndexError));
      setIndexErrorLink(err.consoleLink || null);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    members,
    loading,
    error,
    page,
    limit,
    search,
    totalCount,
    totalPages,
    hasNextPage,
    hasPrevPage,
    isIndexError,
    indexErrorLink,
    setPage,
    setSearch,
    refetch: fetchData,
  };
}
