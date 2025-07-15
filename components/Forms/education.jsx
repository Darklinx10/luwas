'use client';

import { useState } from 'react';
import { db } from '@/firebase/config';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

/**
 * Education & Literacy form
 * @param {string} householdId - Firestore household document ID
 * @param {Array} members - Array of household members [{ id, firstName, ... }]
 * @param {function} goToNext - Callback to proceed to the next form section
 */
export default function EducationAndLiteracy({ householdId, members, goToNext }) {
  // ✅ Local form state for each member
  const [forms, setForms] = useState(() =>
    (members || []).map((member) => ({
      memberId: member.id,
      literacy: '',
      highestGrade: '',
      isAttendingSchool: '',
      schoolName: '',
      gradeLevel: '',
      reasonNotAttending: '',
      bachelor: '',
      master: '',
      doctorate: '',
      isTVETGraduate: '',
      isCurrentlyInTVET: '',
      tvetTrainingType: '',
    }))
  );

  // ✅ Update local form state per member
  const handleChange = (index, e) => {
    const { name, value } = e.target;
    const updated = [...forms];
    updated[index][name] = value;
    setForms(updated);
  };

  // ✅ Save all members’ education data to Firestore
  const handleSubmit = async (e) => {
  e.preventDefault();

    try {
      const saveTasks = forms.map(async (form) => {
        const memberRef = doc(db, 'households', householdId, 'members', form.memberId);

        // ✅ Save only education details
        const eduRef = doc(memberRef, 'education', 'main');
        await setDoc(eduRef, form);
      });

      await Promise.all(saveTasks);

      // ✅ Save education summary to root household doc
      await updateDoc(doc(db, 'households', householdId), {
        educationData: forms,
      });

      toast.success('Education & Literacy info saved!');
      goToNext();
    } catch (error) {
      console.error('❌ Error saving education data:', error);
      toast.error('Failed to save education data.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6 pr-2">
      <h2 className="text-lg font-semibold text-green-600">Education & Literacy (for each household member)</h2>

      {forms.map((form, index) => {
        const member = members.find((m) => m.id === form.memberId) || {};

        return (
          <fieldset key={form.memberId} className="border border-gray-300 rounded p-4 space-y-4">
            <legend className="text-sm font-semibold text-gray-600 px-2">
              {`Member ${index + 1}: ${member.firstName || ''} ${member.lastName || ''}`}
            </legend>

            <div>
              <label className="block font-medium">Can read and write a simple message?</label>
              <select
                name="literacy"
                value={form.literacy}
                onChange={(e) => handleChange(index, e)}
                className="border p-2 rounded w-full"
              >
                <option value="">Select</option>
                <option>Yes</option>
                <option>No</option>
              </select>
            </div>

            <div>
              <label className="block font-medium">Highest grade completed</label>
              <select
                name="highestGrade"
                value={form.highestGrade}
                onChange={(e) => handleChange(index, e)}
                className="border p-2 rounded w-full"
              >
                <option value="">Select</option>
                <option>Level 1 – Primary Education (Elementary)</option>
                <option>Level 2 – Lower Secondary (Junior High School)</option>
                <option>Level 3 – Upper Secondary (Senior High School)</option>
                <option>Level 4 – Post Secondary</option>
                <option>Level 5 – Short Cycle Tertiary</option>
                <option>Level 6 – Bachelor Level</option>
                <option>Level 7 – Master Level</option>
                <option>Level 8 – Doctoral Level</option>
              </select>
            </div>

            <div>
              <label className="block font-medium">Currently attending school?</label>
              <select
                name="isAttendingSchool"
                value={form.isAttendingSchool}
                onChange={(e) => handleChange(index, e)}
                className="border p-2 rounded w-full"
              >
                <option value="">Select</option>
                <option>Yes</option>
                <option>No</option>
              </select>
            </div>

            {form.isAttendingSchool === 'Yes' && (
              <>
                <div>
                  <label className="block font-medium">School type</label>
                  <select
                    name="schoolName"
                    value={form.schoolName}
                    onChange={(e) => handleChange(index, e)}
                    className="border p-2 rounded w-full"
                  >
                    <option value="">Select school type</option>
                    <option>Public</option>
                    <option>Private</option>
                    <option>Home School</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium">Current grade or year</label>
                  <select
                    name="gradeLevel"
                    value={form.gradeLevel}
                    onChange={(e) => handleChange(index, e)}
                    className="border p-2 rounded w-full"
                  >
                    <option value="">Select</option>
                    <option>Level 1 – Primary</option>
                    <option>Level 2 – Junior High</option>
                    <option>Level 3 – Senior High</option>
                    <option>Level 4 – Post Secondary</option>
                    <option>Level 5 – Short Cycle Tertiary</option>
                    <option>Level 6 – Bachelor</option>
                    <option>Level 7 – Master</option>
                    <option>Level 8 – Doctoral</option>
                  </select>
                </div>
              </>
            )}

            {form.isAttendingSchool === 'No' && (
              <div>
                <label className="block font-medium">Reason for not attending school</label>
                <select
                  name="reasonNotAttending"
                  value={form.reasonNotAttending}
                  onChange={(e) => handleChange(index, e)}
                  className="border p-2 rounded w-full"
                >
                  <option value="">Select reason</option>
                  {[
                    'Accessibility of school',
                    'Disability',
                    'Illness',
                    'Pregnancy',
                    'Financial concern',
                    'Marriage',
                    'Employment',
                    'Finished schooling',
                    'Lack of personal interest',
                    'Looking for work',
                    'Fear of COVID-19',
                    'Too young',
                    'Bullying',
                    'Family matters',
                    'Weak internet',
                    'Modular not preferred',
                    'Requirements problem',
                    'Others',
                  ].map((reason, i) => (
                    <option key={i}>{reason}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block font-medium">Graduate of TVET?</label>
              <select
                name="isTVETGraduate"
                value={form.isTVETGraduate}
                onChange={(e) => handleChange(index, e)}
                className="border p-2 rounded w-full"
              >
                <option value="">Select</option>
                <option>Yes</option>
                <option>No</option>
              </select>
            </div>

            <div>
              <label className="block font-medium">Currently in TVET?</label>
              <select
                name="isCurrentlyInTVET"
                value={form.isCurrentlyInTVET}
                onChange={(e) => handleChange(index, e)}
                className="border p-2 rounded w-full"
              >
                <option value="">Select</option>
                <option>Yes</option>
                <option>No</option>
              </select>
            </div>

            <div>
              <label className="block font-medium">Skills development training attended</label>
              <select
                name="tvetTrainingType"
                value={form.tvetTrainingType}
                onChange={(e) => handleChange(index, e)}
                className="border p-2 rounded w-full"
              >
                <option value="">Select training type</option>
                <option>Welding</option>
                <option>Carpentry</option>
                <option>Electrical Installation</option>
                <option>Computer Servicing</option>
                <option>Housekeeping</option>
                <option>Dressmaking</option>
                <option>Automotive</option>
                <option>Driving NC II</option>
                <option>Food & Beverage</option>
                <option>Other</option>
              </select>
            </div>
          </fieldset>
        );
      })}

      <div className="pt-6 flex justify-end">
        <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 cursor-pointer">
          Save & Continue &gt;
        </button>
      </div>
    </form>
  );
}
