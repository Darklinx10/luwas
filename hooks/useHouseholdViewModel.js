import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import * as householdService from '@/services/householdServices';

export function useHouseholdViewModel(profile) {
  const [households, setHouseholds] = useState([]);
  const [membersData, setMembersData] = useState({});
  const [expandedHouseholds, setExpandedHouseholds] = useState({});
  const [loadingMembers, setLoadingMembers] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalHouseholds, setTotalHouseholds] = useState(0);
  const [totalResidents, setTotalResidents] = useState(0);
  const [updating, setUpdating] = useState(false);

  /** MEMBER MODAL */
  const [editMemberModal, setEditMemberModal] = useState({
    isOpen: false,
    member: null,
    updating: false,
  });

  /** HOUSEHOLD MODAL */
  const [editHouseholdModal, setEditHouseholdModal] = useState({
    open: false,
    householdId: null,
  });

  /** MAP POPUP */
  const [mapPopup, setMapPopup] = useState({
    isOpen: false,
    location: null,
    selectedHomeIndex: null,
    readOnly: false,
  });
  const [progress, setProgress] = useState(0);


  const memberListeners = useRef({});

  /** FETCH HOUSEHOLDS */
  const fetchHouseholds = useCallback(async () => {
    setLoading(true);
    try {
      const { households, totalHouseholds, totalResidents } = await householdService.fetchHouseholdsBatch();
      setHouseholds(households);
      setTotalHouseholds(totalHouseholds);
      setTotalResidents(totalResidents);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch households');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHouseholds();
    return () => {
      Object.values(memberListeners.current).forEach((unsub) => unsub());
    };
  }, [fetchHouseholds]);

  /** REALTIME MEMBERS */
  const toggleExpanded = (householdId) => {
    setExpandedHouseholds((p) => ({ ...p, [householdId]: !p[householdId] }));

    if (memberListeners.current[householdId]) return;

    setLoadingMembers((p) => ({ ...p, [householdId]: true }));

    memberListeners.current[householdId] = householdService.listenMembers(householdId, (members) => {
      setMembersData((p) => ({ ...p, [householdId]: members }));
      setLoadingMembers((p) => ({ ...p, [householdId]: false }));
    });
  };

  /** MEMBER CRUD */
  

  const handleDeleteMember = async (memberId) => {
    if (!confirm('Delete this member?')) return;

    try {
      const householdId = Object.entries(membersData).find(([_, m]) =>
        m.some((x) => x.id === memberId)
      )?.[0];
      if (!householdId) return;

      await householdService.deleteMember(householdId, memberId);
      toast.success('Member deleted');

      setMembersData((prev) => ({
        ...prev,
        [householdId]: prev[householdId].filter((m) => m.id !== memberId),
      }));
      setHouseholds((prev) =>
        prev.map((hh) =>
          hh.householdId === householdId
            ? { ...hh, residentCount: hh.residentCount - 1 }
            : hh
        )
      );
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleDeleteHousehold = async (householdId) => {
    if (!confirm('Are you sure you want to delete this household?')) return;
  
    try {
      await householdService.deleteHousehold(householdId);
      toast.success('Household deleted successfully');
  
      // Remove from state
      setHouseholds((prev) => prev.filter((hh) => hh.householdId !== householdId));
      setTotalHouseholds((prev) => prev - 1);
      // Recalculate total residents
      const removedHH = households.find((hh) => hh.householdId === householdId);
      setTotalResidents((prev) => prev - (removedHH?.residentCount || 0));
    } catch {
      toast.error('Failed to delete household');
    }
  };
  
  
  /** OPEN EDIT MEMBER MODAL */
const handleEditMember = (member, householdId) => {
  setEditMemberModal({
    isOpen: true,
    member: { ...member, householdId }, // include householdId for save
    updating: false,
    originalMember: member, // store original for comparison
  });
};

/** HANDLE FIELD CHANGE IN MODAL */
const handleEditFieldChange = (e) => {
  const { name, value } = e.target;
  setEditMemberModal((p) => ({
    ...p,
    member: { ...p.member, [name]: value.trim() },
  }));
};

/** SAVE MEMBER */
const handleSaveEditMember = async () => {
  if (!editMemberModal.member) return;

  const { householdId, id, ...updatedData } = editMemberModal.member;
  const { originalMember } = editMemberModal;

  // Prevent saving if nothing changed
  if (JSON.stringify(originalMember) === JSON.stringify(editMemberModal.member)) {
    toast.info('No changes detected.');
    setEditMemberModal((p) => ({ ...p, isOpen: false, member: null }));
    return;
  }

  setEditMemberModal((p) => ({ ...p, updating: true }));

  try {
    await householdService.updateMember(householdId, id, updatedData);
    
    toast.success('Member updated successfully');

    // ✅ Optimistic update
    setMembersData((prev) => ({
      ...prev,
      [householdId]: prev[householdId].map((m) =>
        m.id === id ? { ...m, ...updatedData } : m
      ),
    }));

    setEditMemberModal({ isOpen: false, member: null });
  } catch (err) {
    console.error('Update failed:', err);
    toast.error('Failed to update member');
  } finally {
    setEditMemberModal((p) => ({ ...p, updating: false }));
  }
};

  /** FILTERING */
  const filteredByRole = useMemo(() => {
    if (!profile) return households;
    if (profile.role === 'Brgy-Secretary') {
      return households.filter(
        (h) => (h.barangay || '').toLowerCase() === profile.barangay?.toLowerCase()
      );
    }
    return households;
  }, [households, profile]);

  const filteredHouseholds = useMemo(() => {
    const normalize = (value) =>
      String(value || '')
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase();
  
    const term = normalize(searchTerm);
  
    return [...filteredByRole]
      .filter((h) => {
        if (!term) return true;
        return normalize(h.headLastName).includes(term);
      })
      .sort((a, b) => {
        const lastA = normalize(a.headLastName);
        const lastB = normalize(b.headLastName);
  
        const firstA = normalize(a.headFirstName);
        const firstB = normalize(b.headFirstName);
  
        const middleA = normalize(a.headMiddleName);
        const middleB = normalize(b.headMiddleName);
  
        const suffixA = normalize(a.headSuffix === 'N/A' ? '' : a.headSuffix);
        const suffixB = normalize(b.headSuffix === 'N/A' ? '' : b.headSuffix);
  
        return (
          lastA.localeCompare(lastB) ||
          firstA.localeCompare(firstB) ||
          middleA.localeCompare(middleB) ||
          suffixA.localeCompare(suffixB)
        );
      });
  }, [filteredByRole, searchTerm]);

  useEffect(() => {
    setTotalHouseholds(filteredHouseholds.length);
    setTotalResidents(
      filteredHouseholds.reduce((sum, hh) => sum + (hh.residentCount || 0), 0)
    );
  }, [filteredHouseholds]);

  /** MAP */
  const openMapWithLocation = (household, index = 0) => {
    const home = household.homes?.[index];
    if (home && home.latitude && home.longitude) {
      setMapPopup({
        isOpen: true,
        location: { lat: parseFloat(home.latitude), lng: parseFloat(home.longitude) },
        selectedHomeIndex: index,
        readOnly: false,
      });
    } else {
      alert('No location data available for this home.');
    }
  };

  /** UPLOAD / IMPORT */
  const handleUploadHouseholdData = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setProgress(0);

    try {
      const total = await householdService.uploadHouseholdsFromFile(file, setProgress);
      toast.success(`Uploaded ${total} households successfully!`);
      await fetchHouseholds();
    } catch (err) {
      console.error('Upload failed:', err);
      toast.error('Failed to upload household data');
    } finally {
      setLoading(false);
      setProgress(0);
      e.target.value = '';
    }
  };

  


  /** DOWNLOAD CSV */
  const downloadCSV = () => {
    const csvHeaders = ['Household ID', 'Family Head', 'Barangay', 'Sitio', 'Sex', 'Age', 'Contact Number'];
    const rows = filteredHouseholds.map((h) => [
      h.householdId,
      [h.headFirstName, h.headMiddleName, h.headLastName, h.headSuffix !== 'N/A' ? h.headSuffix : '']
        .filter(Boolean)
        .join(' '),
      h.barangay,
      h.sitio,
      h.headSex,
      h.headAge,
      h.contactNumber,
    ]);
    const csvContent = [csvHeaders, ...rows]
      .map((e) => e.map((f) => `"${f ?? ''}"`).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'households.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ✅ Relation mapping
  const mapRelationToCategory = (relation) => {
    if (!relation) return '';
    const lower = relation.toLowerCase();
    if (['head', 'family head'].includes(lower)) return 'Head';
    if (['spouse', 'partner'].includes(lower)) return 'Spouse';
    if (['son', 'daughter', 'child', 'nephew', 'niece'].includes(lower)) return 'Child';
    if (['father', 'mother', 'father-in-law', 'mother-in-law', 'parent'].includes(lower))
      return 'Parent';
    if (['brother', 'sister', 'brother-in-law', 'sister-in-law', 'sibling'].includes(lower))
      return 'Sibling';
    if (['uncle', 'aunt', 'other relative', 'relative'].includes(lower)) return 'Relative';
    return 'Other';
  };

  /** ADD HOUSEHOLD */
  const handleAddHouseholdClick = () => (window.location.href = '/household/add');

  /** MODAL HELPERS (for Table/Modals) */
  const setSelectedHouseholdId = (id) =>
    setEditHouseholdModal((p) => ({ ...p, householdId: id }));
  const setEditModalOpen = (val) =>
    setEditHouseholdModal((p) => ({ ...p, open: val }));
  const closeEditMemberModal = () =>
    setEditMemberModal({ isOpen: false, member: null, updating: false });
  const closeMapPopup = () =>
    setMapPopup((p) => ({ ...p, isOpen: false, selectedHomeIndex: null }));

  return {
    // data
    households,
    filteredHouseholds,
    expandedHouseholds,
    membersData,
    loadingMembers,
    setLoading,
    loading,
    totalHouseholds,
    totalResidents,
    searchTerm,
    setSearchTerm,

    // modals
    editMemberModal,
    editHouseholdModal,
    mapPopup,
    setMapPopup,
    progress,
    setSelectedHouseholdId,
    setEditModalOpen,
    closeEditMemberModal,
    closeMapPopup,
    mapRelationToCategory,

    // actions
    toggleExpanded,
    handleEditMember,
    handleDeleteMember,
    handleDeleteHousehold,
    handleSaveEditMember,
    handleEditFieldChange,
    openMapWithLocation,
    handleUploadHouseholdData,
    downloadCSV,
    handleAddHouseholdClick,
    fetchHouseholds,
    updating,
  };
}
