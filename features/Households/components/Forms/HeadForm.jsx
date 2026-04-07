'use client';

import RequiredField from '@/components/Required';
import { useState } from 'react';
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

export default function HeadForm({
  headData,
  onHeadChange,
  onNext,
  onBack,
  onCancel,
  isSaving,
}) {
  const [showErrors, setShowErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    onHeadChange({ ...headData, [name]: value });
    setShowErrors((prev) => ({ ...prev, [name]: false }));
  };

  const validateHead = () => {
    const errors = {};

    if (!headData.headLastName) errors.headLastName = true;
    if (!headData.headFirstName) errors.headFirstName = true;
    if (!headData.headSex) errors.headSex = true;
    if (headData.headAge === '' || headData.headAge === null) errors.headAge = true;
    if (!headData.contactNumber) errors.contactNumber = true;

    setShowErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (!validateHead()) {
      toast.error('Please fill all required fields');
      return;
    }
    onNext();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-emerald-700">Head of Family Information</h2>
        <p className="mt-1 text-sm text-slate-500">
          Enter the primary identity and contact details of the household head.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <RequiredField
          htmlFor="headLastName"
          label="Last Name"
          required
          showError={showErrors.headLastName}
        >
          <input
            id="headLastName"
            name="headLastName"
            type="text"
            value={headData.headLastName}
            onChange={handleChange}
            className={inputClass}
            placeholder="Enter last name"
          />
        </RequiredField>

        <RequiredField
          htmlFor="headFirstName"
          label="First Name"
          required
          showError={showErrors.headFirstName}
        >
          <input
            id="headFirstName"
            name="headFirstName"
            type="text"
            value={headData.headFirstName}
            onChange={handleChange}
            className={inputClass}
            placeholder="Enter first name"
          />
        </RequiredField>

        <FormField label="Middle Name" htmlFor="headMiddleName">
          <input
            id="headMiddleName"
            name="headMiddleName"
            type="text"
            value={headData.headMiddleName}
            onChange={handleChange}
            className={inputClass}
            placeholder="Optional"
          />
        </FormField>

        <FormField label="Suffix" htmlFor="headSuffix">
          <input
            id="headSuffix"
            name="headSuffix"
            type="text"
            value={headData.headSuffix}
            onChange={handleChange}
            className={inputClass}
            placeholder="Jr, Sr, I, etc."
          />
        </FormField>

        <RequiredField
          htmlFor="headSex"
          label="Sex"
          required
          showError={showErrors.headSex}
        >
          <select
            id="headSex"
            name="headSex"
            value={headData.headSex}
            onChange={handleChange}
            className={inputClass}
          >
            <option value="">Select sex</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </RequiredField>

        <RequiredField
          htmlFor="headAge"
          label="Age"
          required
          showError={showErrors.headAge}
        >
          <input
            id="headAge"
            name="headAge"
            type="number"
            value={headData.headAge}
            onChange={handleChange}
            className={inputClass}
            placeholder="Enter age"
            min="0"
            max="120"
          />
        </RequiredField>

        <RequiredField
          htmlFor="contactNumber"
          label="Contact Number"
          required
          showError={showErrors.contactNumber}
        >
          <input
            id="contactNumber"
            name="contactNumber"
            type="tel"
            value={headData.contactNumber}
            onChange={handleChange}
            className={inputClass}
            placeholder="09123456789"
          />
        </RequiredField>
      </div>

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
            onClick={handleNext}
            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSaving}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}