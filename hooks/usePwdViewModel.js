'use client';
import { useEffect, useState, useMemo } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '@/context/authContext';
import { pwdService } from '@/services/pwdService';

export const usePWDs = (filterBarangay) => {
  const { profile, loading: authLoading } = useAuth();
  const [pwds, setPwds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchPWDs = async () => {
    try {
      setLoading(true);
      const data = await pwdService.fetchAllPWDs();
      setPwds(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch PWD data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPWDs();
  }, []);

  const effectiveBarangay =
    profile?.role === 'Brgy-Secretary'
      ? profile?.barangay
      : filterBarangay;
  
  const filteredPWDs = useMemo(() => {
  const normalize = (value) =>
    String(value || '')
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase();

  const getLastName = (fullName) => {
    const cleaned = normalize(fullName);
    if (!cleaned) return '';
    const parts = cleaned.split(' ').filter(Boolean);
    return parts.length ? parts[parts.length - 1] : '';
  };

  const term = normalize(searchTerm);
  const barangayFilter = normalize(effectiveBarangay);

  return [...pwds]
    .filter((item) => {
      if (!barangayFilter) return true;
      return normalize(item.barangay) === barangayFilter;
    })
    .filter((item) => {
      if (!term) return true;
      return getLastName(item.name).includes(term);
    })
    .sort((a, b) => {
      const lastA = getLastName(a.name);
      const lastB = getLastName(b.name);

      const fullA = normalize(a.name);
      const fullB = normalize(b.name);

      return lastA.localeCompare(lastB) || fullA.localeCompare(fullB);
    });
}, [pwds, searchTerm, effectiveBarangay]);

  const savePWD = async (item) => {
    try {
      setLoading(true);
      await pwdService.updatePWD(item);
      await fetchPWDs();
      toast.success('PWD info updated.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to update PWD info.');
    } finally {
      setLoading(false);
    }
  };

  const deletePWD = async (item) => {
    try {
      setLoading(true);
      await pwdService.removePWD(item);
      setPwds((prev) => prev.filter((p) => p.id !== item.id));
      toast.success('PWD removed.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to remove PWD.');
    } finally {
      setLoading(false);
    }
  };

  return {
    pwds: filteredPWDs,
    searchTerm,
    setSearchTerm,
    loading,
    authLoading,
    savePWD,
    deletePWD,
  };
};