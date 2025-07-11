'use client';

import { useState } from 'react';
import { db } from '@/firebase/config';
import { collection, addDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

export default function DemographicCharacteristics({ householdId, goToNext }) {
  const [form, setForm] = useState({
    lastName: '',
    firstName: '',
    suffix: '',
    middleName: '',
    age: '',
    relationshipToHead: '',
    nuclearRelation: '',
    birthdate: '',
    sex: '',
    nuclearBelonging: '',
    birthRegistered: '',
    maritalStatus: '',
    ethnicity: '',
    religion: '',
    hasNationalID: '',
    philsysNumber: '',
    hasBiometric: '',
    hasLGUID: '',
    lguIdNumber: '',
    soloParent: '',
    soloParentId: '',
    seniorCitizenId: '',
    difficulties: {},
  });

  const difficultyOptions = [
    'Seeing (even with glasses)',
    'Hearing (even with hearing aid)',
    'Walking/climbing stairs',
    'Remembering/concentrating',
    'Self-caring (washing/dressing)',
    'Communicating (usual language)',
  ];

  const handleChange = (field) => (e) => {
    setForm((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleDifficultyChange = (question) => (e) => {
    setForm((prev) => ({
      ...prev,
      difficulties: {
        ...prev.difficulties,
        [question]: e.target.value,
      },
    }));
  };

  const handleAutofill = (e) => {
    const value = e.target.value;
    setForm((prev) => ({
      ...prev,
      relationshipToHead: value,
      ...(value === 'Head'
        ? {
            lastName: 'Dela Cruz',
            firstName: 'Juan',
            suffix: '',
            middleName: 'Reyes',
            age: '40',
          }
        : {}),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'households', householdId, 'demographicCharacteristics'), {
        ...form,
      });
      toast.success('Demographic information saved!');
      goToNext(); // Go to next section
    } catch (error) {
      console.error('Error saving form:', error);
      toast.error('Failed to save data.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pr-2">
      <h2 className="text-lg font-semibold text-green-600">For all Household Members</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { id: 'lastName', label: 'Last Name' },
          { id: 'firstName', label: 'First Name' },
          { id: 'suffix', label: 'Suffix' },
          { id: 'middleName', label: 'Middle Name' },
        ].map(({ id, label }) => (
          <label key={id} className="flex flex-col">
            {label}
            <input
              id={id}
              name={id}
              type="text"
              placeholder={label}
              value={form[id]}
              onChange={handleChange(id)}
              className="border p-2 rounded w-full"
              required
            />
          </label>
        ))}

        <label className="flex flex-col">
          Relationship to Head
          <select
            id="relationshipToHead"
            value={form.relationshipToHead}
            onChange={handleAutofill}
            className="border p-2 rounded w-full"
            required
          >
            <option value="">Select relationship</option>
            <option>Head</option>
            <option>Spouse</option>
            <option>Child</option>
            <option>Partner</option>
            <option>Other Relative</option>
            <option>Nonrelative</option>
          </select>
        </label>

        <label className="flex flex-col">
          Relationship to Head of Nuclear Family
          <select
            value={form.nuclearRelation}
            onChange={handleChange('nuclearRelation')}
            className="border p-2 rounded w-full"
            required
          >
            <option value="">Select nuclear relationship</option>
            <option>Head</option>
            <option>Spouse</option>
            <option>Child</option>
          </select>
        </label>

        <label className="flex flex-col">
          Birthdate
          <input
            type="date"
            value={form.birthdate}
            onChange={handleChange('birthdate')}
            className="border p-2 rounded w-full"
            required
          />
        </label>

        <label className="flex flex-col">
          Sex
          <select
            value={form.sex}
            onChange={handleChange('sex')}
            className="border p-2 rounded w-full"
            required
          >
            <option value="">Select sex</option>
            <option>Male</option>
            <option>Female</option>
          </select>
        </label>

        <label className="flex flex-col">
          Age
          <input
            type="number"
            value={form.age}
            onChange={handleChange('age')}
            className="border p-2 rounded w-full"
            required
          />
        </label>

        <label className="flex flex-col">
          Nuclear Family Belonging
          <input
            type="text"
            placeholder="e.g., Nuclear A, B"
            value={form.nuclearBelonging}
            onChange={handleChange('nuclearBelonging')}
            className="border p-2 rounded w-full"
          />
        </label>
      </div>

      <h2 className="text-lg font-semibold text-green-600 pt-4">Legal & Cultural</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="flex flex-col">
          Birth Registered?
          <select
            value={form.birthRegistered}
            onChange={handleChange('birthRegistered')}
            className="border p-2 rounded w-full"
            required
          >
            <option value="">Select answer</option>
            <option>Yes</option>
            <option>No</option>
            <option>Don't Know</option>
          </select>
        </label>

        <label className="flex flex-col">
          Marital Status
          <select
            value={form.maritalStatus}
            onChange={handleChange('maritalStatus')}
            className="border p-2 rounded w-full"
            required
          >
            <option value="">Select status</option>
            <option>Single</option>
            <option>Married</option>
            <option>Common Law/Live-in</option>
            <option>Widowed</option>
            <option>Separated</option>
            <option>Divorced</option>
            <option>Annulled</option>
            <option>Not Open to Share</option>
          </select>
        </label>

        <label className="flex flex-col">
          Ethnicity
          <input
            type="text"
            value={form.ethnicity}
            onChange={handleChange('ethnicity')}
            className="border p-2 rounded w-full"
          />
        </label>

        <label className="flex flex-col">
          Religion
          <input
            type="text"
            value={form.religion}
            onChange={handleChange('religion')}
            className="border p-2 rounded w-full"
          />
        </label>
      </div>

      <h2 className="text-lg font-semibold text-green-600 pt-4">Identification</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {['hasNationalID', 'hasBiometric', 'hasLGUID'].map((id) => (
          <label key={id} className="flex flex-col">
            {id === 'hasNationalID'
              ? 'Has National ID?'
              : id === 'hasBiometric'
              ? 'Has Biometric Validation?'
              : 'Has Municipal LGU ID?'}
            <select
              value={form[id]}
              onChange={handleChange(id)}
              className="border p-2 rounded w-full"
              required
            >
              <option value="">Select answer</option>
              <option>Yes</option>
              <option>No</option>
              <option>Don't Know</option>
            </select>
          </label>
        ))}

        <label className="flex flex-col">
          PhilSys Card Number (PCN)
          <input
            type="text"
            value={form.philsysNumber}
            onChange={handleChange('philsysNumber')}
            className="border p-2 rounded w-full"
          />
        </label>

        <label className="flex flex-col">
          LGU ID Number
          <input
            type="text"
            value={form.lguIdNumber}
            onChange={handleChange('lguIdNumber')}
            className="border p-2 rounded w-full"
          />
        </label>
      </div>

      <h2 className="text-lg font-semibold text-green-600 pt-4">For 10+ Years Old</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="flex flex-col">
          Solo Parent?
          <select
            value={form.soloParent}
            onChange={handleChange('soloParent')}
            className="border p-2 rounded w-full"
          >
            <option value="">Select answer</option>
            <option>Yes</option>
            <option>No</option>
          </select>
        </label>

        <label className="flex flex-col">
          Has Solo Parent ID?
          <select
            value={form.soloParentId}
            onChange={handleChange('soloParentId')}
            className="border p-2 rounded w-full"
          >
            <option value="">Select answer</option>
            <option>Yes</option>
            <option>No</option>
            <option>Don't Know</option>
          </select>
        </label>
      </div>

      <h2 className="text-lg font-semibold text-green-600 pt-4">For 60+ Years Old</h2>
      <label className="flex flex-col sm:w-1/2">
        Has Senior Citizen ID?
        <select
          value={form.seniorCitizenId}
          onChange={handleChange('seniorCitizenId')}
          className="border p-2 rounded w-full"
        >
          <option value="">Select answer</option>
          <option>Yes</option>
          <option>No</option>
          <option>Don't Know</option>
        </select>
      </label>

      <h2 className="text-lg font-semibold text-green-600 pt-4">For 5+ Years Old — Difficulties</h2>
      <div className="space-y-2">
        {difficultyOptions.map((q, idx) => (
          <label key={idx} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <span className="w-full sm:w-1/2">{q}</span>
            <select
              className="border p-2 rounded w-full sm:w-1/2"
              value={form.difficulties[q] || ''}
              onChange={handleDifficultyChange(q)}
            >
              <option value="">Select difficulty level</option>
              <option value="1">1 - No difficulty</option>
              <option value="2">2 - Some difficulty</option>
              <option value="3">3 - A lot of difficulty</option>
              <option value="4">4 - Cannot do at all</option>
            </select>
          </label>
        ))}
      </div>

      <div className="pt-6">
        <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
          Save & Continue &gt;
        </button>
      </div>
    </form>
  );
}
