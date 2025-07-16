'use client';

import { useState } from 'react';
import { db } from '@/firebase/config';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

/**
 * Migration component
 * @param {string} householdId - Firestore household document ID
 * @param {Array} members - Array of household members [{ id, firstName, ... }]
 * @param {function} goToNext - Callback to go to next step
 */
export default function Migration({ householdId, members, goToNext }) {
  const [isSaving, setIsSaving] = useState(false);
  // ✅ Initialize one migration form per member
  const [forms, setForms] = useState(() =>
    (members || []).map((member) => ({
      memberId: member.id,
      motherProvince: '',
      motherCity: '',
      motherCountry: '',
      prevProvince: '',
      prevCity: '',
      prevCountry: '',
      sixMoProvince: '',
      sixMoCity: '',
      sixMoCountry: '',
      reasonForMoving: '',
      isOFW: '',
      ofwType: '',
      departureDate: '',
      monthsAbroad: '',
    }))
  );

  // ✅ Handle form input changes
  const handleChange = (index, e) => {
    const { name, value } = e.target;
    const updatedForms = [...forms];
    updatedForms[index][name] = value;
    setForms(updatedForms);
  };

  // ✅ Handle form submission and write to Firestore
  const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSaving(true);

    try {
      const saveTasks = forms.map(async (form) => {
        const memberRef = doc(db, 'households', householdId, 'members', form.memberId);

        // ✅ Save only migration details
        const migrationRef = doc(memberRef, 'migration', 'main');
        await setDoc(migrationRef, form);
      });

      await Promise.all(saveTasks);

      // ✅ Save migration summary to root household doc
      await updateDoc(doc(db, 'households', householdId), {
        migrationData: forms,
      });

      toast.success('Migration information saved!');
      goToNext();
    } catch (error) {
      console.error('❌ Error saving migration data:', error);
      toast.error('Failed to save migration data.');
    }
      finally {
        setIsSaving(false); 
      }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pr-2">
      <h2 className="text-lg font-semibold text-green-600">
        Migration Information (For all household members 5 years old and over)
      </h2>

      {forms.map((form, index) => (
        <fieldset key={form.memberId} className="border border-gray-300 rounded p-4 space-y-6">
          <legend className="text-sm font-semibold text-gray-600 px-2">
            Household Member {index + 1}{' '}
            <span className="font-normal text-gray-500">
              ({members[index]?.firstName || 'Unknown'})
            </span>
          </legend>

          {/* Mother's Address at Birth */}
          <div>
            <h3 className="font-semibold">Mother’s Address at Birth</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                name="motherProvince"
                value={form.motherProvince}
                onChange={(e) => handleChange(index, e)}
                placeholder="Province"
                className="border p-2 rounded"
              />
              <input
                name="motherCity"
                value={form.motherCity}
                onChange={(e) => handleChange(index, e)}
                placeholder="City/Municipality"
                className="border p-2 rounded"
              />
              <input
                name="motherCountry"
                value={form.motherCountry}
                onChange={(e) => handleChange(index, e)}
                placeholder="Country"
                className="border p-2 rounded"
              />
            </div>
          </div>

          {/* Residence 5 Years Ago */}
          <div>
            <h3 className="font-semibold">Residence 5 Years Ago</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                name="prevProvince"
                value={form.prevProvince}
                onChange={(e) => handleChange(index, e)}
                placeholder="Province"
                className="border p-2 rounded"
              />
              <input
                name="prevCity"
                value={form.prevCity}
                onChange={(e) => handleChange(index, e)}
                placeholder="City/Municipality"
                className="border p-2 rounded"
              />
              <input
                name="prevCountry"
                value={form.prevCountry}
                onChange={(e) => handleChange(index, e)}
                placeholder="Country"
                className="border p-2 rounded"
              />
            </div>
          </div>

          {/* Residence 6 Months Ago */}
          <div>
            <h3 className="font-semibold">Residence 6 Months Ago</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                name="sixMoProvince"
                value={form.sixMoProvince}
                onChange={(e) => handleChange(index, e)}
                placeholder="Province"
                className="border p-2 rounded"
              />
              <input
                name="sixMoCity"
                value={form.sixMoCity}
                onChange={(e) => handleChange(index, e)}
                placeholder="City/Municipality"
                className="border p-2 rounded"
              />
              <input
                name="sixMoCountry"
                value={form.sixMoCountry}
                onChange={(e) => handleChange(index, e)}
                placeholder="Country"
                className="border p-2 rounded"
              />
            </div>
          </div>

          {/* Reason for Moving */}
          <div className="flex flex-col">
            <label>Reason for Moving or Staying</label>
            <select
              name="reasonForMoving"
              value={form.reasonForMoving}
              onChange={(e) => handleChange(index, e)}
              className="border p-2 rounded"
            >
              <option value="">Select reason</option>
              <option>01 - School</option>
              <option>02 - Employment/Job Change</option>
              <option>03 - Family Business</option>
              <option>04 - Finished Contract</option>
              <option>05 - Retirement</option>
              <option>06 - Housing-related</option>
              <option>07 - Living Environment</option>
              <option>08 - Commuting-related</option>
              <option>09 - To live with parents</option>
              <option>10 - To join with spouse</option>
              <option>11 - To live with children</option>
              <option>12 - Marriage</option>
              <option>13 - Divorce/Annulment</option>
              <option>14 - Health-related</option>
              <option>15 - Peace and Security</option>
              <option>16 - COVID-related</option>
              <option>17 - To live with relatives</option>
              <option>18 - Birthplace</option>
              <option>19 - Others</option>
            </select>
          </div>

          {/* Overseas Filipino Worker Section */}
          <div className="flex flex-col">
            <label>Are you an Overseas Filipino?</label>
            <select
              name="isOFW"
              value={form.isOFW}
              onChange={(e) => handleChange(index, e)}
              className="border p-2 rounded"
            >
              <option value="">Select</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>

          {form.isOFW === 'Yes' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <select
                name="ofwType"
                value={form.ofwType}
                onChange={(e) => handleChange(index, e)}
                className="border p-2 rounded"
              >
                <option value="">Select OFW Type</option>
                <option value="Contract">OFW with Contract</option>
                <option value="NoContract">Other OFW (No Contract)</option>
                <option value="Embassy">PH Embassy Employee</option>
                <option value="Student">Student Abroad</option>
                <option value="Tourist">Tourist</option>
                <option value="NEC">Not Elsewhere Classified</option>
                <option value="Resident">Resident (PH)</option>
              </select>

              <input
                type="month"
                name="departureDate"
                value={form.departureDate}
                onChange={(e) => handleChange(index, e)}
                className="border p-2 rounded"
              />

              <input
                type="number"
                name="monthsAbroad"
                value={form.monthsAbroad}
                onChange={(e) => handleChange(index, e)}
                placeholder="Months Abroad"
                className="border p-2 rounded"
              />
            </div>
          )}
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
            <>Save & Continue &gt;</>
          )}
        </button>
      </div>
    </form>
  );
}
