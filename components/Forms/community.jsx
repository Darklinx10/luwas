'use client';

import { useState } from 'react';
import { db } from '@/firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

export default function CommunityAndPolitical({ householdId, goToNext }) {
  const [helpProvided1, setHelpProvided1] = useState('');
  const [spentMoreThanOneHour, setSpentMoreThanOneHour] = useState('');
  const [volunteeredLast12Months, setVolunteeredLast12Months] = useState('');
  const [helpProvided2, setHelpProvided2] = useState('');
  const [lguInvolvement, setLguInvolvement] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent page reload

    const data = {
      helpProvided1,
      spentMoreThanOneHour,
      volunteeredLast12Months,
      helpProvided2,
      lguInvolvement,
      timestamp: new Date(),
    };

    try {
      const docRef = doc(db, 'households', householdId, 'communityAndPolitical', 'main');
      await setDoc(docRef, data);
      toast.success('Community & Political data saved!');
      if (goToNext) goToNext();
    } catch (error) {
      console.error('Error saving data:', error);
      toast.error('Failed to save data.');
    }
  };

  return (
    <div className="h-full overflow-y-auto max-w-3xl mx-auto pr-2 space-y-6">
      {/* Help Provided in Last Month */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-green-600">For 15 Years Old and Over</h2>

        {/* First Help Provided */}
        <label htmlFor="helpProvided1" className="block">
          <span className="font-medium">What kind of help did you provide?</span><br />
          <span className="text-xs italic">Please name all activities that you can remember</span>
          <select
            id="helpProvided1"
            name="helpProvided1"
            value={helpProvided1}
            onChange={(e) => setHelpProvided1(e.target.value)}
            className="border p-2 rounded w-full mt-1"
          >
            <option disabled value="">-- Select activity --</option>
            <option>Environmental Volunteer Work</option>
            <option>Participation in Brigada Eskwela</option>
            <option>Brigada Pag-asa</option>
            <option>Volunteer Educator</option>
            <option>Assist in Neighborhood Beautification</option>
            <option>Serve as Bantay Dagat</option>
            <option>Other</option>
          </select>
        </label>

        {/* Time Spent */}
        <label htmlFor="spentMoreThanOneHour" className="block">
          <span className="font-medium">
            In total, during the past month, did you spend more than one hour providing all help you just named?
          </span>
          <select
            id="spentMoreThanOneHour"
            name="spentMoreThanOneHour"
            value={spentMoreThanOneHour}
            onChange={(e) => setSpentMoreThanOneHour(e.target.value)}
            className="border p-2 rounded w-full mt-1"
          >
            <option disabled value="">-- Select an option --</option>
            <option>Yes</option>
            <option>No</option>
          </select>
        </label>

        {/* Volunteer Past Year */}
        <label htmlFor="volunteeredLast12Months" className="block">
          <span className="font-medium">
            Now, please think about past 12 months, did you volunteer, do voluntary work, or spend time providing unpaid help during this time?
          </span>
          <select
            id="volunteeredLast12Months"
            name="volunteeredLast12Months"
            value={volunteeredLast12Months}
            onChange={(e) => setVolunteeredLast12Months(e.target.value)}
            className="border p-2 rounded w-full mt-1"
          >
            <option disabled value="">-- Select an option --</option>
            <option>Yes</option>
            <option>No</option>
          </select>
        </label>

        {/* Second Help Provided */}
        <label htmlFor="helpProvided2" className="block">
          <span className="font-medium">What kind of help did you provide?</span><br />
          <span className="text-xs italic">Please name all activities that you can remember</span>
          <select
            id="helpProvided2"
            name="helpProvided2"
            value={helpProvided2}
            onChange={(e) => setHelpProvided2(e.target.value)}
            className="border p-2 rounded w-full mt-1"
          >
            <option disabled value="">-- Select activity --</option>
            <option>Environmental Volunteer Work</option>
            <option>Participation in Brigada Eskwela</option>
            <option>Brigada Pag-asa</option>
            <option>Volunteer Educator</option>
            <option>Assist in Neighborhood Beautification</option>
            <option>Serve as Bantay Dagat</option>
            <option>Other</option>
          </select>
        </label>
      </section>

      {/* LGU/Barangay Involvement */}
      <section className="space-y-4">
        <label htmlFor="lguInvolvement" className="block">
          <span className="font-medium">Is a barangay or local government unit (LGU) volunteer?</span>
          <select
            id="lguInvolvement"
            name="lguInvolvement"
            value={lguInvolvement}
            onChange={(e) => setLguInvolvement(e.target.value)}
            className="border p-2 rounded w-full mt-1"
          >
            <option disabled value="">-- Select volunteer role --</option>
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
            <option>Not a Barangay or an LGU Volunteer</option>
          </select>
        </label>
      </section>

      {/* Save Button */}
      <div className="pt-6">
        <button
          type="button"
          onClick={handleSubmit}
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
        >
          Save & Continue &gt;
        </button>
      </div>
    </div>
  );
}