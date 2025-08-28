'use client';

import { useState } from 'react';
import { db } from '@/firebase/config';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

/**
 * EconomicCharacteristics Form
 * @param {string} householdId - Firestore household ID
 * @param {Array} members - Array of members [{ id, firstName, lastName }]
 * @param {function} goToNext - Next page callback
 */
export default function EconomicCharacteristics({ householdId, members, goToNext }) {
  const [isSaving, setIsSaving] = useState(false);
  const [forms, setForms] = useState(() =>
    (members || []).map((member) => ({
      memberId: member.id,
      firstName: member.firstName,
      lastName: member.lastName,
      workedPastWeek: '',
      workArrangement: '',
      onlinePlatform: '',
      occupation: '',
      industry: '',
      location: '',
      employmentNature: '',
      classOfWorker: '',
      hoursPerDay: '',
      workingDays: '',
      basicPay: '',
      reasonForLessWork: '',
      lookedForWork: '',
      firstTimeLookingSince15: '',
      jobSearchMethod: '',
      weeksSearching: '',
      lastOccupation: '',
      lastIndustry: '',
      ownsAgriLand: '',
      operatedLand: '',
      legalDocs: '',
      nameOnDoc: '',
      rightToSell: '',
      rightToBequeath: '',
    }))
  );

  const handleChange = (index, e) => {
    const { name, value } = e.target;
    const updatedForms = [...forms];
    updatedForms[index][name] = value;
    setForms(updatedForms);
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
    setIsSaving(true);
    try {
      const saveTasks = forms.map(async (form) => {
        const memberRef = doc(db, 'households', householdId, 'members', form.memberId);

        // Save individual economic data
        const econRef = doc(memberRef, 'economic', 'main');
        await setDoc(econRef, form);
      });

      await Promise.all(saveTasks);

      // Save summary to household document
      await updateDoc(doc(db, 'households', householdId), {
        economicData: forms,
      });

      toast.success('Economic characteristics saved!');
      if (goToNext) goToNext();
    } catch (err) {
      console.error('❌ Error saving economic data:', err);
      toast.error('Failed to save economic data.');
    } finally {
      setIsSaving(false); 
    } 
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6 pr-2">
      <h2 className="text-lg font-semibold text-green-600">Economic Characteristics (per member)</h2>

      {forms.map((form, index) => (
        <fieldset key={form.memberId} className="border border-gray-300 rounded p-4 space-y-4">
          <legend className="text-sm font-semibold text-gray-600 px-2">
            Member {index + 1}: {form.firstName} {form.lastName}
          </legend>

          <h3>For persons who ever work ever worked or had a job/business during the past week</h3>

          {/* Q1 */}
          <div>
            <label className="block font-medium" htmlFor='workedPastWeek'>
              Any work for at least 1 hour (including from home)?
            </label>
            <select
              id='workedPastWeek'
              name="workedPastWeek"
              value={form.workedPastWeek}
              onChange={(e) => handleChange(index, e)}
              className="border p-2 rounded w-full"
            >
              <option value="">Select</option>
              <option>Yes</option>
              <option>No</option>
            </select>
          </div>

          {form.workedPastWeek === 'Yes' && (
            <>
              {/* Q2 */}
              <div>
                <label className="block font-medium" htmlFor='workArrangement'>Work arrangement</label>
                <select
                  id='workArrangement'
                  name="workArrangement"
                  value={form.workArrangement}
                  onChange={(e) => handleChange(index, e)}
                  className="border p-2 rounded w-full"
                >
                  <option value="">Select</option>
                  <option>Default place of work</option>
                  <option>Work from home</option>
                  <option>Home-based work</option>
                  <option>Short-term/Casual</option>
                  <option>Job rotation</option>
                  <option>Different employers</option>
                  <option>Mixed arrangement</option>
                  <option>Reduced hours</option>
                </select>
              </div>

              {/* Q3 */}
              <div>
                <label className="block font-medium" htmlFor='onlinePlatform'>Engaged in online/mobile platform?</label>
                <select
                  id='onlinePlatform'
                  name="onlinePlatform"
                  value={form.onlinePlatform}
                  onChange={(e) => handleChange(index, e)}
                  className="border p-2 rounded w-full"
                >
                  <option value="">Select</option>
                  <option>Yes</option>
                  <option>No</option>
                </select>
              </div>

              {/* Q4 */}
              <label className="block mb-2" htmlFor='location'>
                <span className="font-medium">Work Location (e.g., City, Province)</span>
                <input
                  id='location'
                  name="location"
                  value={form.location}
                  onChange={(e) => handleChange(index, e)}
                  placeholder="Work location (e.g., City, Province)"
                  className="border p-2 rounded w-full mt-1"
                />
              </label>

              {/* Q5 */}
              <label className="block mb-2" htmlFor='occupation'>
                <span className="font-medium">Primary Occupation</span>
                <input
                  id='occupation'
                  name="occupation"
                  value={form.occupation}
                  onChange={(e) => handleChange(index, e)}
                  placeholder="Primary occupation"
                  className="border p-2 rounded w-full mt-1"
                />
              </label>

              {/* Q6 */}
              <label className="block mb-2" htmlFor='industry'>
                <span className="font-medium">Industry</span>
                <input
                  id='industry'
                  name="industry"
                  value={form.industry}
                  onChange={(e) => handleChange(index, e)}
                  placeholder="Industry"
                  className="border p-2 rounded w-full mt-1"
                />
              </label>

              {/* Q7 & Q8 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <select
                  id='employmentNature'
                  name="employmentNature"
                  value={form.employmentNature}
                  onChange={(e) => handleChange(index, e)}
                  className="border p-2 rounded w-full"
                >
                  <option value="">Employment Nature</option>
                  <option>Permanent</option>
                  <option>Temporary</option>
                  <option>Casual</option>
                  <option>Other</option>
                </select>

                <select
                  id='classOfWorker'
                  name="classOfWorker"
                  value={form.classOfWorker}
                  onChange={(e) => handleChange(index, e)}
                  className="border p-2 rounded w-full"
                >
                  <option value="">Class of Worker</option>
                  <option>Private household</option>
                  <option>Private establishment</option>
                  <option>Government</option>
                  <option>Self-employed</option>
                  <option>Employer</option>
                  <option>Worked without pay</option>
                </select>
              </div>

              {/* Q9, Q10, Q11 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <input
                  id='hoursPerDay'
                  name="hoursPerDay"
                  value={form.hoursPerDay}
                  onChange={(e) => handleChange(index, e)}
                  placeholder="Hours/day"
                  className="border p-2 rounded w-full"
                />
                <input
                  id='workingDays'
                  name="workingDays"
                  value={form.workingDays}
                  onChange={(e) => handleChange(index, e)}
                  placeholder="Working days/week"
                  className="border p-2 rounded w-full"
                />
                <input
                  id='basicPay'
                  name="basicPay"
                  value={form.basicPay}
                  onChange={(e) => handleChange(index, e)}
                  placeholder="Basic pay"
                  className="border p-2 rounded w-full"
                />
              </div>
            </>
          )}

          {form.workedPastWeek === 'No' && (
            <>
              {/* Q12 */}
              <select
                id='reasonForLessWork'
                name="reasonForLessWork"
                value={form.reasonForLessWork}
                onChange={(e) => handleChange(index, e)}
                className="border p-2 rounded w-full"
              >
                <option value="">Reason for less/no work</option>
                <option>COVID‑19 pandemic</option>
                <option>Poor business condition</option>
                <option>Looking for work</option>
                <option>Training</option>
                <option>Others</option>
              </select>

              {/* Q13 */}
              <select
                id='lookedForWork'
                name="lookedForWork"
                value={form.lookedForWork}
                onChange={(e) => handleChange(index, e)}
                className="border p-2 rounded w-full"
              >
                <option value="">Looked for work?</option>
                <option>Yes</option>
                <option>No</option>
              </select>

              {/* Q14 */}
              <select
                id='firstTimeLookingSince15'
                name="firstTimeLookingSince15"
                value={form.firstTimeLookingSince15}
                onChange={(e) => handleChange(index, e)}
                className="border p-2 rounded w-full"
              >
                <option value="">First time looking since age 15?</option>
                <option>Yes</option>
                <option>No</option>
              </select>

              {/* Q15 – Q17 */}
              <input
                id='jobSearchMethod'
                name="jobSearchMethod"
                value={form.jobSearchMethod}
                onChange={(e) => handleChange(index, e)}
                placeholder="Job search method"
                className="border p-2 rounded w-full"
              />
              <input
                id='weeksSearching'
                name="weeksSearching"
                value={form.weeksSearching}
                onChange={(e) => handleChange(index, e)}
                placeholder="Weeks searching"
                className="border p-2 rounded w-full"
              />
              <input
                id='lastOccupation'
                name="lastOccupation"
                value={form.lastOccupation}
                onChange={(e) => handleChange(index, e)}
                placeholder="Last occupation"
                className="border p-2 rounded w-full"
              />
              <input
                name="lastIndustry"
                value={form.lastIndustry}
                onChange={(e) => handleChange(index, e)}
                placeholder="Last industry"
                className="border p-2 rounded w-full"
              />
            </>
          )}

          {/* Q18 – Q23: Agricultural Questions */}
          {[
            { name: 'ownsAgriLand', label: 'Own agri land?' },
            { name: 'operatedLand', label: 'Operated land in past 12 months?' },
            { name: 'legalDocs', label: 'Has legal documents?' },
            { name: 'nameOnDoc', label: 'Is name on document?' },
            { name: 'rightToSell', label: 'Right to sell?' },
            { name: 'rightToBequeath', label: 'Right to bequeath?' },
          ].map((field, i) => (
            <div key={field.name}>
              <label className="block font-medium">{`Q${18 + i}: ${field.label}`}</label>
              <select
                name={field.name}
                value={form[field.name]}
                onChange={(e) => handleChange(index, e)}
                className="border p-2 rounded w-full"
              >
                <option value="">Select</option>
                <option>Yes</option>
                <option>No</option>
                {['rightToSell', 'rightToBequeath'].includes(field.name) && (
                  <>
                    <option>Yes, jointly</option>
                    <option>Dont know</option>
                    <option>Prefer not to answer</option>
                  </>
                )}
              </select>
            </div>
          ))}
        </fieldset>
      ))}

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
            <>Save &amp; Continue &gt;</>
          )}
        </button>
      </div>
    </form>
  );
}