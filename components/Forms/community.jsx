'use client';

import { useState } from 'react';
import { db } from '@/firebase/config';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

/**
 * Community & Political Participation Form
 * @param {string} householdId - Firestore household document ID
 * @param {Array} members - Array of household members [{ id, firstName, lastName }]
 * @param {function} goToNext - Callback to proceed to the next form
 */
export default function CommunityAndPolitical({ householdId, members, goToNext }) {
  const [isSaving, setIsSaving] = useState(false);
  const [forms, setForms] = useState(() =>
    (members || []).map((member) => ({
      memberId: member.id,
      registeredVoter: '',
      votedLastElection: '',
      voluntaryWorkPastMonths: '',
      voluntaryWorkToWhom: '',
      donatedGoodsPastMonths: '',
      preparedGoodsForDonation: '',
      helpProvided1: '',
      spentMoreThanOneHour: '',
      volunteeredLast12Months: '',
      helpProvided2: '',
      lguInvolvement: '',
    }))
  );

  // Handle select change for each member form
  const handleChange = (index, e) => {
    const { name, value } = e.target;
    const updated = [...forms];
    updated[index][name] = value;
    setForms(updated);
  };

  // Submit handler saves all member forms to Firestore
  const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSaving(true);
  try {
    const saveTasks = forms.map(async (form) => {
      const memberRef = doc(db, 'households', householdId, 'members', form.memberId);

      // ✅ Save individual community & political data
      const formRef = doc(memberRef, 'communityAndPolitical', 'main');
      await setDoc(formRef, form);
    });

    await Promise.all(saveTasks);

    // ✅ Save summary to household document
    await updateDoc(doc(db, 'households', householdId), {
      communityAndPoliticalData: forms,
    });

    toast.success('Community & Political data saved!');
    if (goToNext) goToNext();
  } catch (error) {
    console.error('❌ Error saving data:', error);
    toast.error('Failed to save data.');
  } finally {
      setIsSaving(false); 
    }
};

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6 pr-2">
      <h2 className="text-lg font-semibold text-green-600">Community & Political Participation</h2>

      {forms.map((form, index) => {
        const member = members.find((m) => m.id === form.memberId) || {};
        return (
          <fieldset key={form.memberId} className="border border-gray-300 rounded p-4 space-y-4">
            <legend className="text-sm font-semibold text-gray-600 px-2">
              Member {index + 1}: {member.firstName || ''} {member.lastName || ''}
            </legend>

            {/* Question 1 */}
            <label className="block">
              <span className="font-medium">Are you a registered voter?</span>
              <select
                name="registeredVoter"
                value={form.registeredVoter}
                onChange={(e) => handleChange(index, e)}
                className="border p-2 rounded w-full mt-1"
                required
              >
                <option value="">-- Select --</option>
                <option>Yes</option>
                <option>No</option>
              </select>
            </label>

            {/* Question 2 */}
            <label className="block">
              <span className="font-medium">Did you vote in the last election?</span>
              <select
                name="votedLastElection"
                value={form.votedLastElection}
                onChange={(e) => handleChange(index, e)}
                className="border p-2 rounded w-full mt-1"
                required
              >
                <option value="">-- Select --</option>
                <option>Yes</option>
                <option>No</option>
              </select>
            </label>

            {/* Question 3 */}
            <label className="block">
              <span className="font-medium">
                In the past few months, did you do voluntary work or spend any time helping?
              </span>
              <select
                name="voluntaryWorkPastMonths"
                value={form.voluntaryWorkPastMonths}
                onChange={(e) => handleChange(index, e)}
                className="border p-2 rounded w-full mt-1"
                required
              >
                <option value="">-- Select --</option>
                <option>Yes</option>
                <option>No</option>
              </select>
            </label>

            {/* Question 4 */}
            <label className="block">
              <span className="font-medium">To whom did you do voluntary work or spend any time helping?</span>
              <select
                name="voluntaryWorkToWhom"
                value={form.voluntaryWorkToWhom}
                onChange={(e) => handleChange(index, e)}
                className="border p-2 rounded w-full mt-1"
                required={form.voluntaryWorkPastMonths === 'Yes'}
                disabled={form.voluntaryWorkPastMonths !== 'Yes'}
              >
                <option value="">-- Select options --</option>
                <option>Friends, Neighbors, Strangers</option>
                <option>Organizations, Associations, Clubs, Institutions</option>
                <option>Community</option>
                <option>Nature, Wild/Street Animals</option>
              </select>
            </label>

            {/* Question 5 */}
            <label className="block">
              <span className="font-medium">
                In the past few months, did you spend any time buying, collecting, or distributing donated products or goods?
              </span>
              <select
                name="donatedGoodsPastMonths"
                value={form.donatedGoodsPastMonths}
                onChange={(e) => handleChange(index, e)}
                className="border p-2 rounded w-full mt-1"
                required
              >
                <option value="">-- Select --</option>
                <option>Yes</option>
                <option>No</option>
              </select>
            </label>

            {/* Question 6 */}
            <label className="block">
              <span className="font-medium">
                Did you spend any time preparing products or goods to be donated?
              </span>
              <select
                name="preparedGoodsForDonation"
                value={form.preparedGoodsForDonation}
                onChange={(e) => handleChange(index, e)}
                className="border p-2 rounded w-full mt-1"
                required
              >
                <option value="">-- Select --</option>
                <option>Yes</option>
                <option>No</option>
              </select>
            </label>

            {/* Question 7 */}
            <label className="block">
              <span className="font-medium">What kind of help did you provide?</span>
              <span className="text-xs italic block mb-1">Name all activities you remember</span>
              <select
                name="helpProvided1"
                value={form.helpProvided1}
                onChange={(e) => handleChange(index, e)}
                className="border p-2 rounded w-full"
                required
              >
                <option value="">-- Select activity --</option>
                <option>Environmental Volunteer Work</option>
                <option>Participation in Brigada Eskwela</option>
                <option>Brigada Pag-asa</option>
                <option>Volunteer Educator</option>
                <option>Assist in Neighborhood Beautification</option>
                <option>Serve as Bantay Dagat</option>
                <option>Other</option>
              </select>
            </label>

            {/* Question 8 */}
            <label className="block">
              <span className="font-medium">Did you spend more than 1 hour on this in the past month?</span>
              <select
                name="spentMoreThanOneHour"
                value={form.spentMoreThanOneHour}
                onChange={(e) => handleChange(index, e)}
                className="border p-2 rounded w-full mt-1"
                required
              >
                <option value="">-- Select --</option>
                <option>Yes</option>
                <option>No</option>
              </select>
            </label>

            {/* Question 9 */}
            <label className="block">
              <span className="font-medium">In the past 12 months, did you volunteer or provide unpaid help?</span>
              <select
                name="volunteeredLast12Months"
                value={form.volunteeredLast12Months}
                onChange={(e) => handleChange(index, e)}
                className="border p-2 rounded w-full mt-1"
                required
              >
                <option value="">-- Select --</option>
                <option>Yes</option>
                <option>No</option>
              </select>
            </label>

            {/* Question 10 */}
            <label className="block">
              <span className="font-medium">What help did you provide in that 12-month period?</span>
              <span className="text-xs italic block mb-1">Name all activities you remember</span>
              <select
                name="helpProvided2"
                value={form.helpProvided2}
                onChange={(e) => handleChange(index, e)}
                className="border p-2 rounded w-full"
                required={form.volunteeredLast12Months === 'Yes'}
                disabled={form.volunteeredLast12Months !== 'Yes'}
              >
                <option value="">-- Select activity --</option>
                <option>Environmental Volunteer Work</option>
                <option>Participation in Brigada Eskwela</option>
                <option>Brigada Pag-asa</option>
                <option>Volunteer Educator</option>
                <option>Assist in Neighborhood Beautification</option>
                <option>Serve as Bantay Dagat</option>
                <option>Other</option>
              </select>
            </label>

            {/* Question 11 */}
            <label className="block">
              <span className="font-medium">Are you a barangay or LGU volunteer?</span>
              <select
                name="lguInvolvement"
                value={form.lguInvolvement}
                onChange={(e) => handleChange(index, e)}
                className="border p-2 rounded w-full mt-1"
                required
              >
                <option value="">-- Select role --</option>
                <option>Barangay Tanod</option>
                <option>Barangay Health Worker</option>
                <option>Barangay Nutrition Scholar</option>
                <option>Volunteer Educator</option>
                <option>City/Municipal LGU Volunteer</option>
                <option>Province LGU Volunteer</option>
                <option>Brigada Pag-asa</option>
                <option>Environmental Volunteer Work</option>
                <option>Serve as Bantay Dagat</option>
                <option>Assist in Neighborhood Beautification</option>
                <option>Not a Barangay or LGU Volunteer</option>
              </select>
            </label>
          </fieldset>
        );
      })}

      {/* ✅ Submit button */}
      <div className="pt-6 flex justify-end">
        <button
          type="submit"
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 cursor-pointer flex items-center gap-2 disabled:opacity-50"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <svg
                className="animate-spin h-4 w-4 text-white"
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
