'use client';

import { useEffect, useState } from 'react';
import RequiredField from '@/components/Required';
import { toast } from 'react-toastify';

const inputClass =
  'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';

const FormField = ({ label, htmlFor, children }) => (
  <div className="flex flex-col">
    <label htmlFor={htmlFor} className="mb-1.5 text-sm font-medium text-slate-700">
      {label}
    </label>
    {children}
  </div>
);

export default function MembersForm({
  members,
  onMembersChange,
  onSubmit,
  onBack,
  onCancel,
  isSaving,
  focusedMemberId = '',
}) {
  const [showErrors, setShowErrors] = useState({});

  useEffect(() => {
    if (!focusedMemberId) return;

    const target = document.getElementById(`member-card-${focusedMemberId}`);
    if (!target) return;

    target.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }, [focusedMemberId, members.length]);

  const handleAddMember = () => {
    onMembersChange([
      ...members,
      {
        id: Date.now(),
        lastName: '',
        firstName: '',
        middleName: '',
        suffix: '',
        relation: '',
        sex: '',
        birthDate: '',
        age: '',
        education: '',
        occupation: '',
        otherInfo: '',
        isPWD: false,
      },
    ]);
  };

  const handleMemberChange = (memberId, field, value) => {
    onMembersChange(
      members.map((member) =>
        member.id === memberId ? { ...member, [field]: value } : member
      )
    );
  };

  const handleRemoveMember = (memberId) => {
    onMembersChange(members.filter((member) => member.id !== memberId));
  };

  const validateMembers = () => {
    const errors = {};

    members.forEach((member, index) => {
      if (!member.firstName) errors[`member-${index}-firstName`] = true;
      if (!member.relation) errors[`member-${index}-relation`] = true;
    });

    setShowErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateMembers()) {
      toast.error('Please fill required member fields');
      return;
    }
    onSubmit();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-emerald-700">Family Members</h2>
        <p className="mt-1 text-sm text-slate-500">
          Add household members and complete the key demographic fields. Households
          can also be saved with only the household head.
        </p>
      </div>

      {members.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
          <p className="text-sm text-slate-500">
            No non-head members added yet. You can save the household as-is or add
            members below.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {members.map((member, index) => (
            <div
              id={`member-card-${member.memberId || member.id}`}
              key={member.id}
              className={`rounded-2xl border bg-slate-50 p-4 ${
                String(focusedMemberId || '') === String(member.memberId || member.id)
                  ? 'border-emerald-300 ring-2 ring-emerald-100'
                  : 'border-slate-200'
              }`}
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-800">
                    Family Member {index + 1}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Member details and household relation
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveMember(member.id)}
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-100"
                >
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <RequiredField
                  htmlFor={`member-${member.id}-firstName`}
                  label="First Name"
                  required
                  showError={showErrors[`member-${index}-firstName`]}
                >
                  <input
                    id={`member-${member.id}-firstName`}
                    type="text"
                    value={member.firstName}
                    onChange={(e) => handleMemberChange(member.id, 'firstName', e.target.value)}
                    className={inputClass}
                    placeholder="Enter first name"
                    autoFocus={
                      String(focusedMemberId || '') === String(member.memberId || member.id)
                    }
                  />
                </RequiredField>

                <FormField label="Last Name" htmlFor={`member-${member.id}-lastName`}>
                  <input
                    id={`member-${member.id}-lastName`}
                    type="text"
                    value={member.lastName}
                    onChange={(e) => handleMemberChange(member.id, 'lastName', e.target.value)}
                    className={inputClass}
                    placeholder="Optional"
                  />
                </FormField>

                <FormField label="Middle Name" htmlFor={`member-${member.id}-middleName`}>
                  <input
                    id={`member-${member.id}-middleName`}
                    type="text"
                    value={member.middleName}
                    onChange={(e) => handleMemberChange(member.id, 'middleName', e.target.value)}
                    className={inputClass}
                    placeholder="Optional"
                  />
                </FormField>

                <FormField label="Suffix" htmlFor={`member-${member.id}-suffix`}>
                  <input
                    id={`member-${member.id}-suffix`}
                    type="text"
                    value={member.suffix}
                    onChange={(e) => handleMemberChange(member.id, 'suffix', e.target.value)}
                    className={inputClass}
                    placeholder="Jr, Sr, I"
                  />
                </FormField>

                <RequiredField
                  htmlFor={`member-${member.id}-relation`}
                  label="Relation to Head"
                  required
                  showError={showErrors[`member-${index}-relation`]}
                >
                  <select
                    id={`member-${member.id}-relation`}
                    value={member.relation}
                    onChange={(e) => handleMemberChange(member.id, 'relation', e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select Relation</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Child">Child</option>
                    <option value="Parent">Parent</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Grandchild">Grandchild</option>
                    <option value="In-law">In-law</option>
                    <option value="Other">Other</option>
                  </select>
                </RequiredField>

                <FormField label="Sex" htmlFor={`member-${member.id}-sex`}>
                  <select
                    id={`member-${member.id}-sex`}
                    value={member.sex}
                    onChange={(e) => handleMemberChange(member.id, 'sex', e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </FormField>

                <FormField label="Birth Date" htmlFor={`member-${member.id}-birthDate`}>
                  <input
                    id={`member-${member.id}-birthDate`}
                    type="date"
                    value={member.birthDate}
                    onChange={(e) => handleMemberChange(member.id, 'birthDate', e.target.value)}
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Age" htmlFor={`member-${member.id}-age`}>
                  <input
                    id={`member-${member.id}-age`}
                    type="number"
                    value={member.age}
                    onChange={(e) => handleMemberChange(member.id, 'age', e.target.value)}
                    className={inputClass}
                    placeholder="Optional"
                  />
                </FormField>

                <FormField label="Education" htmlFor={`member-${member.id}-education`}>
                  <input
                    id={`member-${member.id}-education`}
                    type="text"
                    value={member.education}
                    onChange={(e) => handleMemberChange(member.id, 'education', e.target.value)}
                    className={inputClass}
                    placeholder="e.g. High School"
                  />
                </FormField>

                <FormField label="Occupation" htmlFor={`member-${member.id}-occupation`}>
                  <input
                    id={`member-${member.id}-occupation`}
                    type="text"
                    value={member.occupation}
                    onChange={(e) => handleMemberChange(member.id, 'occupation', e.target.value)}
                    className={inputClass}
                    placeholder="e.g. Student"
                  />
                </FormField>

                <div className="sm:col-span-2">
                  <FormField
                    label="Additional Information"
                    htmlFor={`member-${member.id}-otherInfo`}
                  >
                    <input
                      id={`member-${member.id}-otherInfo`}
                      type="text"
                      value={member.otherInfo}
                      onChange={(e) => handleMemberChange(member.id, 'otherInfo', e.target.value)}
                      className={inputClass}
                      placeholder="PWD, senior citizen, pregnant, etc."
                    />
                  </FormField>
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor={`member-${member.id}-isPWD`}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                  >
                    <input
                      id={`member-${member.id}-isPWD`}
                      type="checkbox"
                      checked={Boolean(member.isPWD)}
                      onChange={(e) => handleMemberChange(member.id, 'isPWD', e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Mark this member as a Person with Disability (PWD)</span>
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={handleAddMember}
        className="w-full rounded-xl border-2 border-emerald-600 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
      >
        Add Family Member
      </button>

      <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          disabled={isSaving}
        >
          Back
        </button>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Complete'}
          </button>
        </div>
      </div>
    </div>
  );
}
