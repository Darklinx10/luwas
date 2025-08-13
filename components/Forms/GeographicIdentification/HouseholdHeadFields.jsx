import React from 'react';
import RequiredField from '@/components/Required';

export default function HouseholdHeadFields({ form, handleChange, showErrors }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <RequiredField htmlFor="headLastName" label="Last Name" required showError={showErrors.headLastName}>
        <input
          id="headLastName"
          name="headLastName"
          type="text"
          value={form.headLastName}
          onChange={handleChange}
          placeholder="Enter Last Name"
          className="border p-2 rounded w-full"
        />
      </RequiredField>

      <RequiredField htmlFor="headFirstName" label="First Name" required showError={showErrors.headFirstName}>
        <input
          id="headFirstName"
          name="headFirstName"
          type="text"
          value={form.headFirstName}
          onChange={handleChange}
          placeholder="Enter First Name"
          className="border p-2 rounded w-full"
        />
      </RequiredField>

      <div className="flex flex-col">
        <label htmlFor="headSuffix">Suffix</label>
        <input
          id="headSuffix"
          name="headSuffix"
          type="text"
          value={form.headSuffix}
          onChange={handleChange}
          placeholder="e.g., Jr., Sr., III"
          className="border p-2 rounded w-full"
        />
      </div>

      <div className="flex flex-col">
        <label htmlFor="headMiddleName">Middle Name</label>
        <input
          id="headMiddleName"
          name="headMiddleName"
          type="text"
          value={form.headMiddleName}
          onChange={handleChange}
          placeholder="Enter Middle Name"
          className="border p-2 rounded w-full"
        />
      </div>

      <RequiredField htmlFor="headSex" label="Sex" required showError={showErrors.headSex}>
        <select
          id="headSex"
          name="headSex"
          value={form.headSex}
          onChange={handleChange}
          className="border p-2 rounded w-full"
        >
          <option value="">Select Sex</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
      </RequiredField>

      <RequiredField htmlFor="headAge" label="Age" required showError={showErrors.headAge}>
        <input
          id="headAge"
          name="headAge"
          type="number"
          value={form.headAge}
          onChange={handleChange}
          placeholder="Enter Age"
          className="border p-2 rounded w-full"
          min={0}
        />
      </RequiredField>
    </div>
  );
}
