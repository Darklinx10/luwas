
'use client';

import { useState } from 'react';
import { db, auth } from '@/firebase/config';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';
import { calculateAge } from '@/app/utils/calculateAge';
import { selectFields, difficultyOptions } from './constant/selectOptions';
import MemberField from './MemberFields';

export default function DemographicCharacteristics({ householdId, goToNext, setSavedMembers }) {
  const [isSaving, setIsSaving] = useState(false);
  const [members, setMembers] = useState([{
    id: uuidv4(),
    lastName: '', firstName: '', middleName: '', suffix: '', relationshipToHead: '', nuclearRelation: '',
    birthdate: '', sex: '', age: '', nuclearBelonging: '', birthRegistered: '', maritalStatus: '', ethnicity: '', religion: '',
    hasNationalID: '', philsysNumber: '', hasBiometric: '', hasLGUID: '', lguIdNumber: '', soloParent: '', soloParentId: '', seniorCitizenId: '',
    contactNumber: '', difficulties: {}
  }]);

  const handleMemberChange = (index, field) => (e) => {
    const newMembers = [...members];
    newMembers[index][field] = e.target.value;
    if (field === 'birthdate') newMembers[index].age = calculateAge(e.target.value)?.toString() || '';
    setMembers(newMembers);
  };

  const handleDifficultyChange = (index, question) => (e) => {
    const newMembers = [...members];
    newMembers[index].difficulties[question] = e.target.value;
    setMembers(newMembers);
  };

  const addMember = () => setMembers(prev => [...prev, { ...members[0], id: uuidv4(), difficulties: {} }]);
  const removeMember = (index) => setMembers(members.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const user = auth.currentUser;
    if (!user) return toast.error('User not authenticated.') && setIsSaving(false);

    try {
      const saveTasks = members.map(async member => {
        const cleanedMember = { ...member, uid: user.uid, age: Number(member.age) || 0 };
        const memberRef = doc(db, 'households', householdId, 'members', member.id);
        await setDoc(memberRef, cleanedMember);
        await setDoc(doc(memberRef, 'demographicCharacteristics', 'main'), { ...cleanedMember }, { merge: true });
      });
      await Promise.all(saveTasks);
      await updateDoc(doc(db, 'households', householdId), { demographicCharacteristics: members });
      setSavedMembers?.(members);
      toast.success('Demographic information saved!');
      goToNext();
    } catch (error) {
      console.error('❌ Error saving demographic info:', error);
      toast.error('Failed to save data.');
    } finally { setIsSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pr-2">
      <h2 className="text-lg font-semibold text-green-600">For all Household Members</h2>

      {members.map((member, index) => (
        <div key={member.id}>
          <MemberField
            member={member}
            index={index}
            handleMemberChange={handleMemberChange}
            handleDifficultyChange={handleDifficultyChange}
            selectFields={selectFields}
            difficultyOptions={difficultyOptions}
          />
          {members.length > 1 && (
            <button type="button" onClick={() => removeMember(index)} className="text-red-600 text-sm hover:underline">Remove Member</button>
          )}
        </div>
      ))}

      <button type="button" onClick={addMember} className="text-green-600 font-medium hover:underline cursor-pointer">+ Add another member</button>

      <div className="pt-6 flex justify-end">
        <button
          type="submit"
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
          disabled={isSaving}
        >
          {isSaving ? <>Saving...</> : <>Save & Continue &gt;</>}
        </button>
      </div>
    </form>
  );
}
