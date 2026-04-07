'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/authContext';
import HouseholdForm from '@/features/Households/components/Forms/HouseholdForm';
import {
  createMember,
  deleteMember,
  fetchHousehold,
  fetchMembers,
  updateHousehold,
  updateMember,
} from '@/features/Households/services/householdApi';

function toInitialValues(household, members) {
  return {
    householdId: household.householdId,
    locationData: {
      barangay: household.barangay || '',
      sitio: household.sitio || '',
      homes: household.homes || [],
    },
    headData: {
      headLastName: household.headLastName || '',
      headFirstName: household.headFirstName || '',
      headMiddleName: household.headMiddleName || '',
      headSuffix: household.headSuffix || '',
      headAge: household.headAge ?? '',
      headSex: household.headSex || '',
      contactNumber: household.contactNumber || '',
    },
    members: members.map((member, index) => ({
      id: member.memberId || `member-${index}`,
      memberId: member.memberId || null,
      lastName: member.lastName || '',
      firstName: member.firstName || '',
      middleName: member.middleName || '',
      suffix: member.suffix || '',
      relation: member.relationshipToHead || member.relation || '',
      sex: member.sex || '',
      birthDate: member.birthDate || member.birthdate || '',
      age: member.age ?? '',
      education: member.education || '',
      occupation: member.occupation || '',
      otherInfo: member.otherInfo || '',
      isPWD: member.isPWD || false,
    })),
  };
}

function buildMemberPayload(member) {
  return {
    firstName: member.firstName || '',
    middleName: member.middleName || '',
    lastName: member.lastName || '',
    suffix: member.suffix || '',
    relationshipToHead: member.relation || '',
    sex: member.sex || '',
    birthDate: member.birthDate || '',
    age:
      member.age === '' || member.age === null || member.age === undefined
        ? 0
        : Number(member.age),
    education: member.education || '',
    occupation: member.occupation || '',
    otherInfo: member.otherInfo || '',
    isPWD: Boolean(member.isPWD),
  };
}

function PageLoader({ text = 'Loading household...' }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center">
        <svg
          className="mb-3 h-10 w-10 animate-spin text-emerald-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8z"
          />
        </svg>
        <p className="text-sm text-slate-500">{text}</p>
      </div>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm">
        <h2 className="text-lg font-semibold text-red-600">Failed to load household</h2>
        <p className="mt-2 text-sm text-slate-500">{message}</p>
      </div>
    </div>
  );
}

function AccessDenied() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-xl rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm">
        <h2 className="text-lg font-semibold text-red-600">Access Denied</h2>
        <p className="mt-2 text-sm text-slate-500">
          This page is restricted to Secretary and Admin users.
        </p>
      </div>
    </div>
  );
}

export default function EditHouseholdPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const params = useParams();
  const householdId = params?.householdId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [initialValues, setInitialValues] = useState(null);
  const [originalMembers, setOriginalMembers] = useState([]);

  const initialStep = useMemo(() => {
    if (typeof window === 'undefined') return 'location';
    return window.location.hash === '#members' ? 'members' : 'location';
  }, []);

  useEffect(() => {
    if (!user || !profile || !householdId) return;

    if (!['Brgy-Secretary', 'MDRRMC-Admin'].includes(profile.role)) {
      router.push('/');
      return;
    }

    let cancelled = false;

    async function loadHousehold() {
      setLoading(true);
      setError('');

      try {
        const [householdResult, membersResult] = await Promise.all([
          fetchHousehold(householdId),
          fetchMembers(householdId, { page: 1, limit: 100 }),
        ]);

        if (cancelled) return;

        const household = householdResult?.household;
        const members = membersResult?.members || [];

        if (!household) {
          throw new Error('Household not found');
        }

        setOriginalMembers(members);
        setInitialValues(toInitialValues(household, members));
      } catch (loadError) {
        if (cancelled) return;
        console.error('Failed to load household for editing:', loadError);
        setError(loadError.message || 'Failed to load household data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadHousehold();

    return () => {
      cancelled = true;
    };
  }, [householdId, profile, router, user]);

  const handleSubmit = async ({ payload, members }) => {
    const householdPayload = { ...payload };
    delete householdPayload.members;

    if (profile?.role === 'Brgy-Secretary') {
      delete householdPayload.barangay;
    }

    await updateHousehold(householdId, householdPayload);

    const originalById = new Map(
      originalMembers
        .filter((member) => member?.memberId)
        .map((member) => [member.memberId, member])
    );

    const submittedExistingIds = new Set();

    for (const member of members) {
      const memberPayload = buildMemberPayload(member);

      if (member.memberId && originalById.has(member.memberId)) {
        submittedExistingIds.add(member.memberId);
        await updateMember(householdId, member.memberId, memberPayload);
      } else {
        await createMember(householdId, memberPayload);
      }
    }

    for (const originalMember of originalMembers) {
      if (
        originalMember?.memberId &&
        !submittedExistingIds.has(originalMember.memberId)
      ) {
        await deleteMember(householdId, originalMember.memberId);
      }
    }

    return { householdId };
  };

  if (loading || !user) {
    return <PageLoader text="Loading household edit form..." />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (!['Brgy-Secretary', 'MDRRMC-Admin'].includes(profile?.role)) {
    return <AccessDenied />;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-4 md:py-6">
      <div className="mx-auto max-w-6xl px-4">
        <HouseholdForm
          userId={user?.uid}
          mode="edit"
          initialStep={initialStep}
          initialValues={initialValues}
          onSubmit={handleSubmit}
          onComplete={() => {
            router.push('/household');
          }}
          onCancel={() => router.back()}
        />
      </div>
    </div>
  );
}