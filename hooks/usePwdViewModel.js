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
    return pwds
      .filter(
        (item) =>
          !effectiveBarangay ||
          item.barangay?.toLowerCase().trim() ===
            effectiveBarangay?.toLowerCase().trim()
      )
      .filter((item) =>
        Object.values(item).some((val) =>
          String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
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