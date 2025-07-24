'use client';

import { useState } from 'react';
import { db, auth } from '@/firebase/config';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';

export default function DemographicCharacteristics({ householdId, goToNext, setSavedMembers }) {
  const [isSaving, setIsSaving] = useState(false);

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
      contactNumber: '',
      difficulties: {},
    },
  ]);

  const difficultyOptions = [
    'Seeing (even with glasses)',
    'Hearing (even with hearing aid)',
    'Walking/climbing stairs',
    'Remembering/concentrating',
    'Self-caring (washing/dressing)',
    'Communicating (usual language)',
  ];

  const selectFields = {
    relationshipToHead: ['', 'Head', 'Spouse', 'Son', 'Daughter', 'Brother', 'Sister', 'Father', 'Mother', 'Father-in-law', 'Mother-in-law', 'Brother-in-law', 'Sister-in-law', 'Uncle', 'Aunt', 'Nephew', 'Niece', 'Other Relative', 'Border', 'Domestic Helper', 'Nonrelative'],
    nuclearRelation: ['', 'None', 'Family Head', 'Spouse', 'Partner', 'Son', 'Daughter', 'Brother', 'Sister', 'Father', 'Mother', 'Other'],
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

  const handleMemberChange = (index, field) => (e) => {
    const newMembers = [...members];
    newMembers[index][field] = e.target.value;
    setMembers(newMembers);
  };

  const handleDifficultyChange = (index, question) => (e) => {
    const newMembers = [...members];
    newMembers[index].difficulties[question] = e.target.value;
    setMembers(newMembers);
  };

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
        contactNumber: '',
        difficulties: {},
      },
    ]);
  };

  const removeMember = (index) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    const user = auth.currentUser;

    if (!user) {
      toast.error('User not authenticated.');
      setIsSaving(false);
      return;
    }

    try {
      const saveTasks = members.map(async (member) => {
        const memberRef = doc(db, 'households', householdId, 'members', member.id);

        const cleanedMember = {
          firstName: member.firstName,
          lastName: member.lastName,
          middleName: member.middleName,
          suffix: member.suffix || '',
          uid: user.uid,
          sex: member.sex,
          age: Number(member.age),
          relationshipToHead: member.relationshipToHead || '',
          updatedAt: new Date(), // <-- Firestore timestamp
        };

        // Save to /members/{id}
        await setDoc(memberRef, cleanedMember);

        // Save to /members/{id}/demographicCharacteristics/main
        const demoRef = doc(memberRef, 'demographicCharacteristics', 'main');
        await setDoc(demoRef, {
          ...cleanedMember,
        }, { merge: true }); // <-- merge to avoid overwriting extra fields
      });

      await Promise.all(saveTasks);

      // Save all members to the parent household document (optional flat list)
      await updateDoc(doc(db, 'households', householdId), {
        demographicCharacteristics: members,
      });

      setSavedMembers?.(members);
      toast.success('Demographic information saved!');
      goToNext();
    } catch (error) {
      console.error('❌ Error saving demographic info:', error);
      toast.error('Failed to save data.');
    } finally {
      setIsSaving(false);
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
            {[
              { id: 'lastName', label: 'Last Name', placeholder: 'Enter your Last Name' },
              { id: 'firstName', label: 'First Name', placeholder: 'Enter your First Name' },
              { id: 'middleName', label: 'Middle Name', placeholder: 'Enter your Middle Name' },
              { id: 'suffix', label: 'Suffix', placeholder: 'Enter your Suffix' },
              { id: 'birthdate', label: 'Birthdate', type: 'date' },
              { id: 'age', label: 'Age', type: 'number' },
              {
                id: 'contactNumber',
                label: 'Contact Number',
                type: 'tel',
                pattern: '^09\\d{9}$',
                maxLength: 11,
                placeholder: 'e.g., 09123456789',
                title: 'Enter an 11-digit number starting with 09'
              },
              { id: 'ethnicity', label: 'Ethnicity', placeholder: 'Enter your Ethnicity' },
              { id: 'religion', label: 'Religion', placeholder: 'Enter your Religion' },
              { id: 'philsysNumber', label: 'PhilSys Card Number (PCN)', placeholder: 'Enter your PhilSys Card Number' },
              { id: 'lguIdNumber', label: 'LGU ID Number', placeholder: 'Enter your LGU ID Number' },
              { id: 'nuclearBelonging', label: 'In which Nuclear Family Belong?' },
            ].map(({ id, label, type = 'text', ...props }) => (
              <label key={id} htmlFor={`${id}-${index}`} className="flex flex-col">
                {label}
                <input
                  id={`${id}-${index}`}
                  name={id}
                  type={type}
                  value={member[id] ?? ''}
                  onChange={handleMemberChange(index, id)}
                  className="border p-2 rounded w-full"
                  required={!['middleName', 'suffix', 'philsysNumber', 'lguIdNumber'].includes(id)}
                  {...props}
                />
              </label>
            ))}

            {[
              'relationshipToHead',
              'nuclearRelation',
              'sex',
              'birthRegistered',
              'maritalStatus',
              'hasNationalID',
              'hasBiometric',
              'hasLGUID',
              'soloParent',
              'soloParentId',
              'seniorCitizenId',
            ].map((id) => (
              <label key={id} htmlFor={`${id}-${index}`} className="flex flex-col">
                {id.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                <select
                  id={`${id}-${index}`}
                  name={id}
                  value={member[id] ?? ''}
                  onChange={handleMemberChange(index, id)}
                  className="border p-2 rounded w-full"
                  required
                >
                  {selectFields[id].map((opt, i) => (
                    <option key={i} value={opt}>{opt || 'Select answer'}</option>
                  ))}
                </select>
              </label>
            ))}

            <p className="text-green-700 sm:col-span-2 font-semibold pt-2">For all persons 5 years old and over</p>
            {difficultyOptions.map((q, dIdx) => {
              const id = `difficulty-${index}-${dIdx}`;
              return (
                <label key={id} htmlFor={id} className="flex flex-col">
                  {q}
                  <select
                    id={id}
                    name={id}
                    className="border p-2 rounded w-full"
                    value={member.difficulties[q] ?? ''}
                    onChange={handleDifficultyChange(index, q)}
                  >
                    <option value="">Select difficulty level</option>
                    <option value="No difficulty">No difficulty</option>
                    <option value="Some difficulty">Some difficulty</option>
                    <option value="A lot of difficulty">A lot of difficulty</option>
                    <option value="Cannot do at all">Cannot do at all</option>
                  </select>
                </label>
              );
            })}
          </div>

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

      <button
        type="button"
        onClick={addMember}
        className="text-green-600 font-medium hover:underline cursor-pointer"
      >
        + Add another member
      </button>

      <div className="pt-6 flex justify-end">
        <button
          type="submit"
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 cursor-pointer flex items-center gap-2 disabled:opacity-50"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Saving...
            </>
          ) : (
            <>Save & Continue &gt;</>
          )}
        </button>
      </div>
    </form>
  );
}
