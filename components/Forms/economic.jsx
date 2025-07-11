'use client';

import { useState } from 'react';
import { db } from '@/firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

export default function EconomicCharacteristics({ householdId, goToNext }) {
  const [formData, setFormData] = useState({
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
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const docRef = doc(db, 'households', householdId, 'economicCharacteristics', 'main');
      await setDoc(docRef, {
        ...formData,
        timestamp: new Date(),
      });

      toast.success('Economic characteristics saved!');
      if (goToNext) goToNext();
    } catch (error) {
      console.error('Error saving economic data:', error);
      toast.error('Failed to save data.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto h-full overflow-y-auto pr-2 space-y-6">
      {/* Section: Worked in the past week */}
      <section>
        <h2 className="text-lg font-semibold text-green-600">
          For persons who worked or had a job/business during the past week
        </h2>

        <label className="block mt-4">
          Any work for at least 1 hour (incl. from home)?
          <select
            name="workedPastWeek"
            value={formData.workedPastWeek}
            onChange={handleChange}
            className="border p-2 rounded w-full mt-1"
          >
            <option value="">Select</option>
            <option>Yes</option>
            <option>No</option>
          </select>
        </label>

        {formData.workedPastWeek === 'Yes' && (
          <>
            <label className="block mt-4">
              Working arrangement:
              <select
                name="workArrangement"
                value={formData.workArrangement}
                onChange={handleChange}
                className="border p-2 rounded w-full mt-1"
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
            </label>

            <label className="block mt-4">
              Engage in online/mobile platform?
              <select
                name="onlinePlatform"
                value={formData.onlinePlatform}
                onChange={handleChange}
                className="border p-2 rounded w-full mt-1"
              >
                <option value="">Select</option>
                <option>Yes</option>
                <option>No</option>
              </select>
            </label>

            <label className="block mt-4">
              Primary occupation
              <input
                type="text"
                name="occupation"
                value={formData.occupation}
                onChange={handleChange}
                placeholder="e.g. Farmer, Teacher"
                className="border p-2 rounded w-full mt-1"
              />
            </label>

            <label className="block mt-4">
              Industry
              <input
                type="text"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                placeholder="e.g. Agriculture, Education"
                className="border p-2 rounded w-full mt-1"
              />
            </label>

            <label className="block mt-4">
              Location of work (Municipality, Province)
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Quezon City, Metro Manila"
                className="border p-2 rounded w-full mt-1"
              />
            </label>

            <label className="block mt-4">
              Nature of employment
              <select
                name="employmentNature"
                value={formData.employmentNature}
                onChange={handleChange}
                className="border p-2 rounded w-full mt-1"
              >
                <option value="">Select</option>
                <option>Permanent</option>
                <option>Temporary</option>
                <option>Casual</option>
                <option>Other</option>
              </select>
            </label>

            <label className="block mt-4">
              Class of worker
              <select
                name="classOfWorker"
                value={formData.classOfWorker}
                onChange={handleChange}
                className="border p-2 rounded w-full mt-1"
              >
                <option value="">Select</option>
                <option>Private household</option>
                <option>Private establishment</option>
                <option>Government</option>
                <option>Self-employed</option>
                <option>Employer</option>
                <option>Worked without pay</option>
              </select>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <label className="flex flex-col">
                Hours per day
                <input
                  type="number"
                  name="hoursPerDay"
                  value={formData.hoursPerDay}
                  onChange={handleChange}
                  placeholder="e.g. 8"
                  className="border p-2 rounded w-full mt-1"
                />
              </label>
              <label className="flex flex-col">
                Working days last week
                <input
                  type="number"
                  name="workingDays"
                  value={formData.workingDays}
                  onChange={handleChange}
                  placeholder="e.g. 5"
                  className="border p-2 rounded w-full mt-1"
                />
              </label>
              <label className="flex flex-col">
                Basic pay per day (PHP)
                <input
                  type="number"
                  name="basicPay"
                  value={formData.basicPay}
                  onChange={handleChange}
                  placeholder="e.g. 500"
                  className="border p-2 rounded w-full mt-1"
                />
              </label>
            </div>
          </>
        )}
      </section>

      {formData.workedPastWeek === 'No' && (
        <section>
          <h2 className="text-lg font-semibold text-green-600 mt-8">
            For persons who didn’t work last week
          </h2>

          <label className="block mt-4">
            Main reason for working less than usual
            <select
              name="reasonForLessWork"
              value={formData.reasonForLessWork}
              onChange={handleChange}
              className="border p-2 rounded w-full mt-1"
            >
              <option value="">Select</option>
              <option>Wanted more earnings</option>
              <option>Job requirements</option>
              <option>Exceptional week</option>
              <option>Ambition/passion</option>
              <option>COVID‑19 pandemic</option>
              <option>Variable schedule/holidays</option>
              <option>Poor business condition</option>
              <option>Client/work reduction</option>
              <option>Low/off season</option>
              <option>Bad weather/disaster</option>
              <option>Strike/dispute</option>
              <option>Job change</option>
              <option>Only part-time work</option>
              <option>Training/school</option>
              <option>Personal/family reasons</option>
              <option>Health/medical</option>
              <option>Other</option>
            </select>
          </label>

          <label className="block mt-4">
            Did you look for work or try to start a business?
            <select
              name="lookedForWork"
              value={formData.lookedForWork}
              onChange={handleChange}
              className="border p-2 rounded w-full mt-1"
            >
              <option value="">Select</option>
              <option>Yes</option>
              <option>No</option>
            </select>
          </label>

          <label className="block mt-4">
            Was this your first time finding work (since age 15)?
            <select
              name="firstTimeLookingSince15"
              value={formData.firstTimeLookingSince15}
              onChange={handleChange}
              className="border p-2 rounded w-full mt-1"
            >
              <option value="">Select</option>
              <option>Yes</option>
              <option>No</option>
            </select>
          </label>

          <label className="block mt-4">
            Job search method
            <select
              name="jobSearchMethod"
              value={formData.jobSearchMethod}
              onChange={handleChange}
              className="border p-2 rounded w-full mt-1"
            >
              <option value="">Select</option>
              <option>Public employment agency</option>
              <option>Private employment agency</option>
              <option>Direct approach</option>
              <option>Relatives/friends</option>
              <option>Responded to ad</option>
              <option>Other</option>
            </select>
          </label>

          <label className="block mt-4">
            Weeks looking for work
            <input
              type="number"
              name="weeksSearching"
              value={formData.weeksSearching}
              onChange={handleChange}
              placeholder="e.g. 4"
              className="border p-2 rounded w-full mt-1"
            />
          </label>

          <label className="block mt-4">
            Last occupation
            <input
              type="text"
              name="lastOccupation"
              value={formData.lastOccupation}
              onChange={handleChange}
              placeholder="e.g. Cashier"
              className="border p-2 rounded w-full mt-1"
            />
          </label>

          <label className="block mt-4">
            Industry
            <input
              type="text"
              name="lastIndustry"
              value={formData.lastIndustry}
              onChange={handleChange}
              placeholder="e.g. Retail"
              className="border p-2 rounded w-full mt-1"
            />
          </label>
        </section>
      )}

      {/* Agricultural Land Ownership */}
      <section>
        <h2 className="text-lg font-semibold text-green-600 mt-8">
          For persons with agricultural land
        </h2>

        <label className="block mt-4">
          Do you own or have rights over agricultural land?
          <select
            name="ownsAgriLand"
            value={formData.ownsAgriLand}
            onChange={handleChange}
            className="border p-2 rounded w-full mt-1"
          >
            <option value="">Select</option>
            <option>Yes</option>
            <option>No</option>
          </select>
        </label>

        <label className="block mt-4">
          Did you operate this land during the past 12 months?
          <select
            name="operatedLand"
            value={formData.operatedLand}
            onChange={handleChange}
            className="border p-2 rounded w-full mt-1"
          >
            <option value="">Select</option>
            <option>Yes</option>
            <option>No</option>
          </select>
        </label>

        <label className="block mt-4">
          Are there documents proving your ownership or rights?
          <select
            name="legalDocs"
            value={formData.legalDocs}
            onChange={handleChange}
            className="border p-2 rounded w-full mt-1"
          >
            <option value="">Select</option>
            <option>Yes</option>
            <option>No</option>
          </select>
        </label>

        <label className="block mt-4">
          Is your name listed as owner on those documents?
          <select
            name="nameOnDoc"
            value={formData.nameOnDoc}
            onChange={handleChange}
            className="border p-2 rounded w-full mt-1"
          >
            <option value="">Select</option>
            <option>Yes</option>
            <option>No</option>
          </select>
        </label>

        <label className="block mt-4">
          Do you have the right to sell the land?
          <select
            name="rightToSell"
            value={formData.rightToSell}
            onChange={handleChange}
            className="border p-2 rounded w-full mt-1"
          >
            <option value="">Select</option>
            <option>Yes</option>
            <option>No</option>
            <option>Yes, jointly</option>
            <option>Don’t know</option>
            <option>Prefer not to answer</option>
          </select>
        </label>

        <label className="block mt-4">
          Do you have the right to bequeath the land?
          <select
            name="rightToBequeath"
            value={formData.rightToBequeath}
            onChange={handleChange}
            className="border p-2 rounded w-full mt-1"
          >
            <option value="">Select</option>
            <option>Yes</option>
            <option>No</option>
            <option>Yes, jointly</option>
            <option>Don’t know</option>
            <option>Prefer not to answer</option>
          </select>
        </label>
      </section>

      {/* Save Button */}
      <div className="pt-6">
        <button
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
          onClick={handleSubmit}
        >
          Save & Continue &gt;
        </button>
      </div>
    </div>
  );
}
