'use client';

import { useState } from 'react';
import { db } from '@/firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

export default function Migration({ householdId, goToNext }) {
  const [form, setForm] = useState({
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
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const migrationRef = doc(db, 'households', householdId, 'migration', 'main');
      await setDoc(migrationRef, form);
      toast.success('Migration information saved!');
      goToNext();
    } catch (error) {
      console.error('Error saving migration data:', error);
      toast.error('Failed to save migration data.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="h-full overflow-y-auto pr-2 space-y-6">
      <h2 className="text-lg font-semibold text-green-600">For 5 years old and over</h2>

      {/* Mother's address at birth */}
      <div>
        <h3 className="font-semibold">Mother’s Address (province and city/municipality) during your birth:</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          <div className="flex flex-col">
            <label htmlFor="motherProvince">Province</label>
            <input
              id="motherProvince"
              type="text"
              name="motherProvince"
              value={form.motherProvince}
              onChange={handleChange}
              placeholder="Enter province"
              className="border p-2 rounded w-full"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="motherCity">City/Municipality</label>
            <input
              id="motherCity"
              type="text"
              name="motherCity"
              value={form.motherCity}
              onChange={handleChange}
              placeholder="Enter city/municipality"
              className="border p-2 rounded w-full"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="motherCountry">Country</label>
            <input
              id="motherCountry"
              type="text"
              name="motherCountry"
              value={form.motherCountry}
              onChange={handleChange}
              placeholder="Enter country"
              className="border p-2 rounded w-full"
            />
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          <strong>Legend:</strong> 0000 – Same as current city/municipality
        </p>
      </div>

      {/* Residence 5 years ago */}
      <div>
        <h3 className="font-semibold">Province and city/municipality, country you reside 5 years ago?</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          <div className="flex flex-col">
            <label htmlFor="prevProvince">Province</label>
            <input
              id="prevProvince"
              type="text"
              name="prevProvince"
              value={form.prevProvince}
              onChange={handleChange}
              placeholder="Enter province"
              className="border p-2 rounded w-full"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="prevCity">City/Municipality</label>
            <input
              id="prevCity"
              type="text"
              name="prevCity"
              value={form.prevCity}
              onChange={handleChange}
              placeholder="Enter city/municipality"
              className="border p-2 rounded w-full"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="prevCountry">Country</label>
            <input
              id="prevCountry"
              type="text"
              name="prevCountry"
              value={form.prevCountry}
              onChange={handleChange}
              placeholder="Enter country"
              className="border p-2 rounded w-full"
            />
          </div>
        </div>
      </div>

      {/* Residence 6 months ago */}
      <div>
        <h3 className="font-semibold">Your residence 6 month's ago(as of Jan 1, 2022)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          <div className="flex flex-col">
            <label htmlFor="sixMoProvince">Province</label>
            <input
              id="sixMoProvince"
              type="text"
              name="sixMoProvince"
              value={form.sixMoProvince}
              onChange={handleChange}
              placeholder="Enter province"
              className="border p-2 rounded w-full"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="sixMoCity">City/Municipality</label>
            <input
              id="sixMoCity"
              type="text"
              name="sixMoCity"
              value={form.sixMoCity}
              onChange={handleChange}
              placeholder="Enter city/municipality"
              className="border p-2 rounded w-full"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="sixMoCountry">Country</label>
            <input
              id="sixMoCountry"
              type="text"
              name="sixMoCountry"
              value={form.sixMoCountry}
              onChange={handleChange}
              placeholder="Enter country"
              className="border p-2 rounded w-full"
            />
          </div>
        </div>
      </div>

      {/* Reason for moving */}
      <div>
        <label htmlFor="reasonForMoving" className="block font-medium mb-1">Reason for Moving or Staying</label>
        <select
          id="reasonForMoving"
          name="reasonForMoving"
          value={form.reasonForMoving}
          onChange={handleChange}
          className="border p-2 rounded w-full"
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

      {/* Overseas Filipino Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-green-600">Overseas Filipino Information</h3>

        <div className="flex flex-col">
          <label htmlFor="isOFW">Are you an Overseas Filipino?</label>
          <select
            id="isOFW"
            name="isOFW"
            value={form.isOFW}
            onChange={handleChange}
            className="border p-2 rounded w-full mt-1"
          >
            <option value="">Select</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>

        {form.isOFW === "Yes" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label htmlFor="ofwType">Type of Overseas</label>
              <select
                id="ofwType"
                name="ofwType"
                value={form.ofwType}
                onChange={handleChange}
                className="border p-2 rounded w-full mt-1"
              >
                <option value="">Select type</option>
                <option value="Contract">OFW with Contract</option>
                <option value="NoContract">Other OFW (No Contract)</option>
                <option value="Embassy">PH Embassy Employee</option>
                <option value="Student">Student Abroad</option>
                <option value="Tourist">Tourist</option>
                <option value="NEC">Not Elsewhere Classified</option>
                <option value="Resident">Resident (PH)</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label htmlFor="departureDate">Date of Last Leave in PH</label>
              <input
                id="departureDate"
                type="month"
                name="departureDate"
                value={form.departureDate}
                onChange={handleChange}
                className="border p-2 rounded w-full mt-1"
              />
            </div>

            <div className="flex flex-col">
              <label htmlFor="monthsAbroad">No. of Months Abroad or Intended Stay</label>
              <input
                id="monthsAbroad"
                type="number"
                name="monthsAbroad"
                value={form.monthsAbroad}
                onChange={handleChange}
                placeholder="e.g., 98 if unknown"
                className="border p-2 rounded w-full mt-1"
              />
            </div>
          </div>
        )}
      </div>


      {/* Submit Button */}
      <div className="pt-6">
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
