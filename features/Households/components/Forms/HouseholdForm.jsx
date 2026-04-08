'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { normalizePerson, buildFullName } from '@/lib/utils/nameNormalizer';
import { createHousehold } from '@/features/Households/services/householdApi';
import LocationForm from './LocationForm';
import HeadForm from './HeadForm';
import MembersForm from './MembersForm';

const DEFAULT_LOCATION_DATA = {
  region: '',
  province: '',
  city: '',
  barangay: '',
  sitio: '',
  zipcode: '',
  homes: [{ label: 'Primary Home', latitude: '', longitude: '' }],
};

const DEFAULT_HEAD_DATA = {
  headLastName: '',
  headFirstName: '',
  headMiddleName: '',
  headSuffix: '',
  headAge: '',
  headSex: '',
  contactNumber: '',
};

function normalizeInitialHomes(homes = []) {
  if (!Array.isArray(homes) || homes.length === 0) {
    return DEFAULT_LOCATION_DATA.homes.map((home) => ({ ...home }));
  }

  return homes.map((home, index) => ({
    label: home?.label || (index === 0 ? 'Primary Home' : `Secondary Home ${index}`),
    latitude: home?.latitude || '',
    longitude: home?.longitude || '',
  }));
}

function buildInitialLocationData(initialValues) {
  return {
    ...DEFAULT_LOCATION_DATA,
    ...initialValues?.locationData,
    barangay: initialValues?.locationData?.barangay || initialValues?.barangay || '',
    sitio: initialValues?.locationData?.sitio || initialValues?.sitio || '',
    homes: normalizeInitialHomes(initialValues?.locationData?.homes || initialValues?.homes),
  };
}

function buildInitialHeadData(initialValues) {
  return {
    ...DEFAULT_HEAD_DATA,
    ...initialValues?.headData,
    headLastName: initialValues?.headData?.headLastName || initialValues?.headLastName || '',
    headFirstName: initialValues?.headData?.headFirstName || initialValues?.headFirstName || '',
    headMiddleName: initialValues?.headData?.headMiddleName || initialValues?.headMiddleName || '',
    headSuffix: initialValues?.headData?.headSuffix || initialValues?.headSuffix || '',
    headAge: initialValues?.headData?.headAge ?? initialValues?.headAge ?? '',
    headSex: initialValues?.headData?.headSex || initialValues?.headSex || '',
    contactNumber: initialValues?.headData?.contactNumber || initialValues?.contactNumber || '',
  };
}

function buildInitialMembers(initialValues) {
  if (!Array.isArray(initialValues?.members) || initialValues.members.length === 0) {
    return [];
  }

  return initialValues.members.map((member, index) => ({
    id: member.id || member.memberId || `member-${index}`,
    memberId: member.memberId || member.id || null,
    lastName: member.lastName || '',
    firstName: member.firstName || '',
    middleName: member.middleName || '',
    suffix: member.suffix || '',
    relation: member.relation || member.relationshipToHead || '',
    sex: member.sex || '',
    birthDate: member.birthDate || member.birthdate || '',
    age: member.age ?? '',
    education: member.education || '',
    occupation: member.occupation || '',
    otherInfo: member.otherInfo || '',
    isPWD: member.isPWD || false,
  }));
}

function buildNormalizedMemberPayload(member = {}) {
  const normalizedMember = normalizePerson(
    member.firstName,
    member.middleName,
    member.lastName,
    member.suffix
  );

  let memberAge = member.age;
  if (member.birthDate && !memberAge) {
    const birth = new Date(member.birthDate);
    const today = new Date();
    memberAge = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      memberAge--;
    }
  }

  return {
    memberId: member.memberId || null,
    firstName: normalizedMember.firstName || '',
    lastName: normalizedMember.lastName || '',
    middleName: normalizedMember.middleName || '',
    suffix: normalizedMember.suffix || '',
    fullName: buildFullName(
      normalizedMember.firstName,
      normalizedMember.middleName,
      normalizedMember.lastName,
      normalizedMember.suffix
    ),
    relationshipToHead: member.relation || '',
    sex: member.sex || '',
    birthDate: member.birthDate || '',
    age: parseInt(memberAge, 10) || 0,
    education: member.education || '',
    occupation: member.occupation || '',
    isPWD: Boolean(member.isPWD),
    otherInfo: member.otherInfo || '',
  };
}

const STEPS = [
  { key: 'location', label: 'Family Location' },
  { key: 'head', label: 'Head Information' },
  { key: 'members', label: 'Family Members' },
];

export default function HouseholdForm({
  userId,
  onComplete,
  onCancel: onCancelProp,
  initialValues = null,
  initialStep = 'location',
  mode = 'create',
  onSubmit: onSubmitProp,
  selectedMemberId = '',
}) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isSaving, setIsSaving] = useState(false);
  const [locationData, setLocationData] = useState(() => buildInitialLocationData(initialValues));
  const [headData, setHeadData] = useState(() => buildInitialHeadData(initialValues));
  const [members, setMembers] = useState(() => buildInitialMembers(initialValues));

  useEffect(() => {
    setLocationData(buildInitialLocationData(initialValues));
    setHeadData(buildInitialHeadData(initialValues));
    setMembers(buildInitialMembers(initialValues));
  }, [initialValues]);

  useEffect(() => {
    setCurrentStep(initialStep || 'location');
  }, [initialStep]);

  const handleCancel = () => {
    if (onCancelProp) onCancelProp();
    else window.history.back();
  };

  const handleMembersSubmit = async () => {
    setIsSaving(true);

    try {
      const normalizedHead = normalizePerson(
        headData.headFirstName,
        headData.headMiddleName,
        headData.headLastName,
        headData.headSuffix
      );

      const homesWithCoords = locationData.homes.filter(
        (home) => home.latitude && home.longitude
      );

      const normalizedMembers = members.map((member) =>
        buildNormalizedMemberPayload(member)
      );

      const payload = {
        headFirstName: normalizedHead.firstName || '',
        headMiddleName: normalizedHead.middleName || '',
        headLastName: normalizedHead.lastName || '',
        headSuffix: normalizedHead.suffix || '',
        headSex: headData.headSex || '',
        headAge: headData.headAge ? Number(headData.headAge) : 0,
        contactNumber: headData.contactNumber || '',
        barangay: locationData.barangay || '',
        sitio: locationData.sitio || '',
        homes: homesWithCoords,
        members: normalizedMembers,
      };

      const result = onSubmitProp
        ? await onSubmitProp({
            payload,
            locationData,
            headData,
            members,
            normalizedMembers,
          })
        : await createHousehold(payload);

      const resolvedHouseholdId = result?.householdId || initialValues?.householdId;

      if (resolvedHouseholdId) {
        toast.success(
          mode === 'edit'
            ? 'Household updated successfully!'
            : 'Household created successfully!'
        );

        if (onComplete) onComplete(resolvedHouseholdId);
        else handleCancel();
      } else {
        toast.error(
          mode === 'edit'
            ? 'Failed to update household - unexpected response'
            : 'Failed to create household - unexpected response'
        );
      }
    } catch (error) {
      console.error('Error saving household:', error);
      toast.error(error.message || 'Failed to save household data');
    } finally {
      setIsSaving(false);
    }
  };

  const currentStepIndex = STEPS.findIndex((step) => step.key === currentStep);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 bg-slate-50 p-4 md:p-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm text-slate-400">
              Home / Households / {mode === 'edit' ? 'Edit Household' : 'Add Household'}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-800">
              {mode === 'edit' ? 'Edit Household' : 'Household Registration'}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {mode === 'edit'
                ? 'Update household details, mapped homes, and family members.'
                : 'Register a new household, define mapped homes, and add family members.'}
            </p>
          </div>

          <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
            Step {currentStepIndex + 1} of {STEPS.length}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {STEPS.map((step, index) => {
            const isActive = step.key === currentStep;
            const isCompleted = index < currentStepIndex;

            return (
              <div key={step.key} className="flex flex-1 items-center">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${isActive
                        ? 'bg-emerald-600 text-white'
                        : isCompleted
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                  >
                    {index + 1}
                  </div>

                  <div>
                    <p
                      className={`text-sm font-medium ${isActive ? 'text-slate-800' : 'text-slate-500'
                        }`}
                    >
                      {step.label}
                    </p>
                  </div>
                </div>

                {index < STEPS.length - 1 && (
                  <div className="mx-4 hidden h-px flex-1 bg-slate-200 md:block" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {currentStep === 'location' && (
          <LocationForm
            locationData={locationData}
            onLocationChange={setLocationData}
            onNext={() => setCurrentStep('head')}
            onCancel={handleCancel}
            isSaving={isSaving}
          />
        )}

        {currentStep === 'head' && (
          <HeadForm
            headData={headData}
            onHeadChange={setHeadData}
            onNext={() => setCurrentStep('members')}
            onBack={() => setCurrentStep('location')}
            onCancel={handleCancel}
            isSaving={isSaving}
          />
        )}

        {currentStep === 'members' && (
          <MembersForm
            members={members}
            onMembersChange={setMembers}
            onSubmit={handleMembersSubmit}
            onBack={() => setCurrentStep('head')}
            onCancel={handleCancel}
            isSaving={isSaving}
            focusedMemberId={selectedMemberId}
          />
        )}
      </div>
    </div>
  );
}
