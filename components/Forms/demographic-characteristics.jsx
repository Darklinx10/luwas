'use client';

import { useState } from 'react';
import { db, auth } from '@/firebase/config';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';

export default function DemographicCharacteristics({ householdId, goToNext, setSavedMembers }) {
  // 👨‍👩‍👧‍👦 Initialize one member with default values
  const [members, setMembers] = useState([
    {
      id: uuidv4(),
      lastName: '',
      firstName: '',
      middleName: '',
      suffix: '',
      relationshipToHead: '',
      nuclearRelation: '',
      birthdate: '',
      sex: '',
      age: '',
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
      difficulties: {}, // for 5+ years old
    },
  ]);

  // 🧠 Disability categories for 5+ years old
  const difficultyOptions = [
    'Seeing (even with glasses)',
    'Hearing (even with hearing aid)',
    'Walking/climbing stairs',
    'Remembering/concentrating',
    'Self-caring (washing/dressing)',
    'Communicating (usual language)',
  ];

  // 📋 Dropdown fields and options
  const selectFields = {
    relationshipToHead: ['', 'Head', 'Spouse', 'Son', 'Daughter', 'Brother', 'Sister', 'Father', 'Mother', 'Father-in-law', 'Mother-in-law', 'Sister', 'Brother-in-law', 'Sister-in-law', 'Uncle', 'Aunt', 'Nephew', 'Niece', 'Other Relative', 'Border', 'Domestic Helper', 'Nonrelative'],
    nuclearRelation: ['', 'None', 'Family Head', 'Spouse', 'Partner', 'Son', 'Daughter', 'Brother', 'Sister', 'Father', 'Mother',  'Other'],
    sex: ['', 'Male', 'Female'],
    birthRegistered: ['', 'Yes', 'No', "Don't Know"],
    maritalStatus: ['', 'Single', 'Married', 'Common Law/Live-in', 'Widowed', 'Separated', 'Divorced', 'Annulled', 'Not Open to Share'],
    hasNationalID: ['', 'Yes', 'No', "Don't Know"],
    hasBiometric: ['', 'Yes', 'No', "Don't Know"],
    hasLGUID: ['', 'Yes', 'No', "Don't Know"],
    soloParent: ['', 'Yes', 'No'],
    soloParentId: ['', 'Yes', 'No', "Don't Know"],
    seniorCitizenId: ['', 'Yes', 'No', "Don't Know"]
  };

  // 🖊️ Handle basic field change
  const handleMemberChange = (index, field) => (e) => {
    const newMembers = [...members];
    newMembers[index][field] = e.target.value;
    setMembers(newMembers);
  };

  // 👁️ Handle disability/difficulty field change
  const handleDifficultyChange = (index, question) => (e) => {
    const newMembers = [...members];
    newMembers[index].difficulties[question] = e.target.value;
    setMembers(newMembers);
  };

  // ➕ Add member
  const addMember = () => {
    setMembers((prev) => [
      ...prev,
      {
        id: uuidv4(),
        lastName: '',
        firstName: '',
        middleName: '',
        suffix: '',
        relationshipToHead: '',
        nuclearRelation: '',
        birthdate: '',
        sex: '',
        age: '',
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
      },
    ]);
  };

  // ❌ Remove member
  const removeMember = (index) => {
    setMembers(members.filter((_, i) => i !== index));
  };

    const handleSubmit = async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) {
      toast.error('User not authenticated.');
      return;
    }

    try {
      const saveTasks = members.map(async (member) => {
        const memberRef = doc(db, 'households', householdId, 'members', member.id);

        // Step 1: Save base member info
        await setDoc(memberRef, {
          firstName: member.firstName,
          lastName: member.lastName,
          middleName: member.middleName,
          suffix: member.suffix,
          uid: user.uid,
        });

        // Step 2: Save demographic details
        const demoRef = doc(memberRef, 'demographicCharacteristics', 'main');
        await setDoc(demoRef, member);
      });

      await Promise.all(saveTasks);

      // ✅ Save demographic summary in household root
      await updateDoc(doc(db, 'households', householdId), {
        demographicCharacteristics: members,
      });

      // ⬆️ Pass to parent
      if (setSavedMembers) {
        setSavedMembers(members);
      }

      toast.success('Demographic information saved!');
      goToNext();
    } catch (error) {
      console.error('❌ Error saving demographic info:', error);
      toast.error('Failed to save data.');
    }
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-6 pr-2">
      <h2 className="text-lg font-semibold text-green-600">For all Household Members</h2>


      {members.map((member, index) => (
        <fieldset key={member.id} className="border border-gray-300 rounded p-4 mb-4 space-y-4">
          <legend className="text-sm font-semibold text-gray-600 px-2">
            Household Member {index + 1}
          </legend>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Text Inputs */}
            {[
              { id: 'lastName', label: 'Last Name' },
              { id: 'firstName', label: 'First Name' },
              { id: 'middleName', label: 'Middle Name' },
              { id: 'suffix', label: 'Suffix' },
              { id: 'birthdate', label: 'Birthdate', type: 'date' },
              { id: 'age', label: 'Age', type: 'number' },
              { id: 'ethnicity', label: 'Ethnicity' },
              { id: 'religion', label: 'Religion' },
              { id: 'philsysNumber', label: 'PhilSys Card Number (PCN)' },
              { id: 'lguIdNumber', label: 'LGU ID Number' },
              { id: 'nuclearBelonging', label: 'In whitch Nuclear Family Belong?' },
            ].map(({ id, label, type = 'text' }) => (
              <label key={id} className="flex flex-col">
                {label}
                <input
                  type={type}
                  value={member[id]}
                  onChange={handleMemberChange(index, id)}
                  className="border p-2 rounded w-full"
                  required={!['middleName', 'suffix', 'philsysNumber', 'lguIdNumber'].includes(id)}
                />
              </label>
            ))}

            {/* Select Dropdowns */}
            {[
              'relationshipToHead',
              'nuclearRelation',
              'sex',
              'birthRegistered',
              'maritalStatus',
              'hasNationalID',
              'hasBiometric',
              'hasLGUID',
            ].map((id) => (
              <label key={id} className="flex flex-col">
                {id.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                <select
                  value={member[id] || ''}
                  onChange={handleMemberChange(index, id)}
                  className="border p-2 rounded w-full"
                  required
                >
                  {selectFields[id].map((opt, i) => (
                    <option key={i} value={opt}>
                      {opt || 'Select answer'}
                    </option>
                  ))}
                </select>
              </label>
            ))}

            {/* 10+ years */}
            <p className="sm:col-span-2 font-semibold pt-2">For 10 years old and over</p>
            {['soloParent', 'soloParentId'].map((id) => (
              <label key={id} className="flex flex-col">
                {id.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                <select
                  value={member[id] || ''}
                  onChange={handleMemberChange(index, id)}
                  className="border p-2 rounded w-full"
                >
                  {selectFields[id].map((opt, i) => (
                    <option key={i} value={opt}>
                      {opt || 'Select answer'}
                    </option>
                  ))}
                </select>
              </label>
            ))}

            {/* 60+ years */}
            <p className="sm:col-span-2 font-semibold pt-2">For 60 years old and over</p>
            <label className="flex flex-col">
              Senior Citizen Id
              <select
                value={member.seniorCitizenId || ''}
                onChange={handleMemberChange(index, 'seniorCitizenId')}
                className="border p-2 rounded w-full"
              >
                {selectFields.seniorCitizenId.map((opt, i) => (
                  <option key={i} value={opt}>
                    {opt || 'Select answer'}
                  </option>
                ))}
              </select>
            </label>

            {/* Disability (5+ years) */}
            <p className="sm:col-span-2 font-semibold pt-2">For all persons 5 years old and over</p>
            {difficultyOptions.map((q, dIdx) => (
              <label key={dIdx} className="flex flex-col">
                {q}
                <select
                  className="border p-2 rounded w-full"
                  value={member.difficulties[q] || ''}
                  onChange={handleDifficultyChange(index, q)}
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

          {/* Remove button (if more than one member) */}
          {members.length > 1 && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => removeMember(index)}
                className="text-red-600 text-sm hover:underline"
              >
                Remove Member
              </button>
            </div>
          )}
        </fieldset>
      ))}

      {/* Add another member button */}
      <button
        type="button"
        onClick={addMember}
        className="text-green-600 font-medium hover:underline"
      >
        + Add another member
      </button>

      {/* Submit button */}
      <div className="pt-6 flex justify-end">
        <button
          type="submit"
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
        >
          Save & Continue &gt;
        </button>
      </div>
    </form>
  );
}
