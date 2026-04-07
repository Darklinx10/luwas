'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { compareNames } from '@/lib/utils/nameNormalizer';
import * as householdApi from '../services/householdApi';
import { normalizeHousehold, normalizeMember } from '../utils/householdFormat';

const PAGE_SIZE = 10;

function compareHouseholdHeadNames(left = {}, right = {}) {
  return compareNames(
    {
      firstName: left.headFirstName,
      middleName: left.headMiddleName,
      lastName: left.headLastName,
      suffix: left.headSuffix,
    },
    {
      firstName: right.headFirstName,
      middleName: right.headMiddleName,
      lastName: right.headLastName,
      suffix: right.headSuffix,
    }
  );
}

function compareMemberNames(left = {}, right = {}) {
  return compareNames(
    {
      firstName: left.firstName,
      middleName: left.middleName,
      lastName: left.lastName,
      suffix: left.suffix,
    },
    {
      firstName: right.firstName,
      middleName: right.middleName,
      lastName: right.lastName,
      suffix: right.suffix,
    }
  );
}

export function useHouseholds() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [totalHouseholds, setTotalHouseholds] = useState(0);
  const [totalResidents, setTotalResidents] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);

  const [expandedHouseholds, setExpandedHouseholds] = useState({});
  const [loadingMembers, setLoadingMembers] = useState({});
  const [membersData, setMembersData] = useState({});

  const [editMemberModal, setEditMemberModal] = useState({
    isOpen: false,
    member: null,
    householdId: '',
    updating: false,
  });

  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const fetchPage = useCallback(async () => {
    try {
      setLoading(true);

      const result = await householdApi.fetchHouseholds({
        page,
        limit: PAGE_SIZE,
        search,
        sort: 'headLastName',
        order: 'asc',
      });

      const householdsWithId = (result.households || [])
        .filter((household) => household && household.householdId)
        .map((household) => normalizeHousehold(household))
        .sort(compareHouseholdHeadNames);

      if (householdsWithId.length !== (result.households || []).length) {
        console.warn(
          'Some households missing householdId:',
          (result.households || []).filter((household) => !household || !household.householdId)
        );
      }

      setItems(householdsWithId);
      setTotalHouseholds(result.totalHouseholds || 0);
      setTotalResidents(result.totalResidents || 0);
      setTotalPages(result.totalPages || 1);
      setHasNextPage(Boolean(result.hasNextPage));
      setHasPrevPage(Boolean(result.hasPrevPage));
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Failed to fetch households');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  const handleSearchSubmit = useCallback(
    (event) => {
      event?.preventDefault?.();
      setPage(1);
      setSearch(searchInput.trim());
    },
    [searchInput]
  );

  const toggleExpanded = useCallback(
    (householdId) => {
      if (!householdId) {
        console.error('toggleExpanded: householdId is missing or undefined', { householdId });
        toast.error('Error: Household ID is missing');
        return;
      }

      setExpandedHouseholds((prev) => {
        const willOpen = !prev[householdId];

        if (willOpen && !membersData[householdId]) {
          (async () => {
            try {
              setLoadingMembers((prevLoading) => ({
                ...prevLoading,
                [householdId]: true,
              }));

              const result = await householdApi.fetchMembers(householdId);

              const normalizedMembers = (result.members || [])
                .map((member) => normalizeMember(member))
                .sort(compareMemberNames);

              setMembersData((prevMembers) => ({
                ...prevMembers,
                [householdId]: normalizedMembers,
              }));
            } catch (error) {
              console.error('Failed to fetch members for household:', { householdId, error });
              toast.error(error.message || 'Failed to fetch household members');
            } finally {
              setLoadingMembers((prevLoading) => ({
                ...prevLoading,
                [householdId]: false,
              }));
            }
          })();
        }

        return {
          ...prev,
          [householdId]: willOpen,
        };
      });
    },
    [membersData]
  );

  const handleDeleteHousehold = useCallback(
    async (householdId) => {
      const confirmed = window.confirm(
        'Delete this household and all members? This action cannot be undone.'
      );

      if (!confirmed) return;

      try {
        setSubmitting(true);
        await householdApi.deleteHousehold(householdId);
        toast.success('Household deleted successfully');

        setExpandedHouseholds((prev) => {
          const next = { ...prev };
          delete next[householdId];
          return next;
        });

        setMembersData((prev) => {
          const next = { ...prev };
          delete next[householdId];
          return next;
        });

        await fetchPage();
      } catch (error) {
        console.error(error);
        toast.error(error.message || 'Failed to delete household');
      } finally {
        setSubmitting(false);
      }
    },
    [fetchPage]
  );

  const handleDeleteMember = useCallback(
    async (householdId, memberId) => {
      const confirmed = window.confirm(
        'Delete this member? This action cannot be undone.'
      );

      if (!confirmed) return;

      try {
        await householdApi.deleteMember(householdId, memberId);
        toast.success('Member deleted successfully');

        setMembersData((prev) => ({
          ...prev,
          [householdId]: (prev[householdId] || []).filter(
            (member) => member.memberId !== memberId
          ),
        }));

        await fetchPage();
      } catch (error) {
        console.error(error);
        toast.error(error.message || 'Failed to delete member');
      }
    },
    [fetchPage]
  );

  const handleEditMember = useCallback((householdId, member) => {
    setEditMemberModal({
      isOpen: true,
      householdId,
      member: { ...member },
      updating: false,
    });
  }, []);

  const closeEditMember = useCallback(() => {
    setEditMemberModal({
      isOpen: false,
      householdId: '',
      member: null,
      updating: false,
    });
  }, []);

  const handleEditFieldChange = useCallback((event) => {
    const { name, value } = event.target;

    setEditMemberModal((prev) => ({
      ...prev,
      member: {
        ...prev.member,
        [name]: value,
      },
    }));
  }, []);

  const handleSaveEditMember = useCallback(async () => {
    const current = editMemberModal;

    if (!current.householdId || !current.member?.memberId) {
      toast.error('Missing member information');
      return;
    }

    try {
      setEditMemberModal((prev) => ({
        ...prev,
        updating: true,
      }));

      const { householdId, member } = current;
      const { memberId, createdAt, updatedAt, ...payload } = member;

      await householdApi.updateMember(householdId, memberId, payload);
      toast.success('Member updated successfully');

      const normalizedUpdatedMember = normalizeMember({ ...member, ...payload });

      setMembersData((prev) => ({
        ...prev,
        [householdId]: (prev[householdId] || [])
          .map((item) => (item.memberId === memberId ? normalizedUpdatedMember : item))
          .sort(compareMemberNames),
      }));

      closeEditMember();
      await fetchPage();
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Failed to update member');
      setEditMemberModal((prev) => ({
        ...prev,
        updating: false,
      }));
    }
  }, [closeEditMember, editMemberModal, fetchPage]);

  const handleUploadHouseholdData = useCallback(() => {
    setUploadModalOpen(true);
  }, []);

  const handleAddHouseholdClick = useCallback(() => {
    router.push('/household/quick-add');
  }, [router]);

  const handleUploadSuccess = useCallback(async () => {
    setPage(1);
    await fetchPage();
  }, [fetchPage]);

  const summary = useMemo(
    () => ({
      totalHouseholds,
      totalResidents,
      totalPages,
      hasNextPage,
      hasPrevPage,
    }),
    [totalHouseholds, totalResidents, totalPages, hasNextPage, hasPrevPage]
  );

  return {
    loading,
    submitting,
    households: items,
    filteredHouseholds: items,
    expandedHouseholds,
    membersData,
    loadingMembers,

    page,
    totalPages,
    totalHouseholds,
    totalResidents,
    hasNextPage,
    hasPrevPage,
    summary,

    searchInput,
    setSearchInput,
    handleSearchSubmit,
    setPage,
    toggleExpanded,

    handleDeleteHousehold,
    handleDeleteMember,
    handleEditMember,
    handleEditFieldChange,
    handleSaveEditMember,
    handleAddHouseholdClick,

    editMemberModal,
    closeEditMember,

    uploadModalOpen,
    setUploadModalOpen,
    handleUploadSuccess,
    handleUploadHouseholdData,
  };
}
