import { useEffect, useState, useMemo } from 'react';
import { fetchSeniors, updateSenior, removeSeniorStatus } from '@/services/seniorServices';
import { toast } from 'react-toastify';
import { useAuth } from '@/context/authContext';
import { capitalizeWords } from '@/utils/capitalize';

export const useSeniors = (filterBarangay = null) => {
  const [seniors, setSeniors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const { profile, loading: authLoading } = useAuth();

  // Fetch seniors on mount
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchSeniors();
        setSeniors(data);
        console.log('Seniors fetched:', data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to fetch senior citizen data.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Effective barangay filtering
  const effectiveBarangay = useMemo(() => {
    if (profile?.role === 'Brgy-Secretary') return profile.barangay;
    if (filterBarangay) return filterBarangay;
    return null;
  }, [profile, filterBarangay]);

  // Filtered seniors
  const filteredSeniors = useMemo(() => {
    return seniors
      .filter(item =>
        !effectiveBarangay || item.barangay?.trim().toLowerCase() === effectiveBarangay?.trim().toLowerCase()
      )
      .filter(item =>
        Object.values(item).some(val => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [seniors, searchTerm, effectiveBarangay]);

  // Actions
  const saveSenior = async (senior) => {
    setLoading(true);
    try {
      await updateSenior(senior);
      setSeniors(prev => prev.map(s => (s.id === senior.id ? { ...s, ...senior } : s)));
      toast.success('Senior info updated.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update senior information.');
    } finally {
      setLoading(false);
    }
  };

  const deleteSenior = async (senior) => {
    if (!window.confirm(`Remove senior citizen status for ${senior.name}?`)) return;
    setLoading(true);
    try {
      await removeSeniorStatus(senior);
      setSeniors(prev => prev.filter(s => s.id !== senior.id));
      toast.success(`Senior citizen status removed for ${senior.name}.`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove senior citizen status.');
    } finally {
      setLoading(false);
    }
  };

  // CSV download
  const handleDownloadCSV = () => {
    if (!seniors.length) return;
    const headers = 'Name,Sex,Age,Barangay,Contact';
    const rows = seniors.map(p => [
      capitalizeWords(p.name),
      p.sex,
      p.age,
      capitalizeWords(p.barangay),
      capitalizeWords(p.sitio),
      p.contact
    ].join(','));
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `senior_citizens_report_2025.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return {
    seniors: filteredSeniors,
    searchTerm,
    setSearchTerm,
    loading,
    authLoading,
    saveSenior,
    deleteSenior,
    downloadCSV:handleDownloadCSV,
  };
};
