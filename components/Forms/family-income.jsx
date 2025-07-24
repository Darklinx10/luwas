'use client';

import { useEffect, useState } from 'react';
import { db } from '@/firebase/config';
import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { toast } from 'react-toastify';

export default function FamilyIncome({ householdId, goToNext }) {
  const [isSaving, setIsSaving] = useState(false);
  // Initial state for the form
  const [form, setForm] = useState({
    sources: {
      // A–C: Regular and Seasonal Employment
      salaries: '',
      commissions: '',
      honoraria: '',
      totalAC: '',

      // D–E: Entrepreneurial Activities
      familyEnterprise: '',
      professionPractice: '',
      totalDE: '',

      // F–Z: Other Sources of Family Income
      produceSales: '',
      overseasSupport: '',
      fourPs: '',
      seniorPension: '',
      sap: '',
      domesticSupport: '',
      investments: '',
      rentals: '',
      interests: '',
      giftsInKind: '',
      sustenanceActivity: '', // Y
      otherSourceZ: '',       // Z
      totalFZ: '',

      // Totals
    },
    // Regular/seasonal member selection
    regularSeasonalMembers: '',

    // Totals
    totalCurrentIncome: '',
    totalFormerIncome: '',
    totalCombinedIncome: '',

    // Others
    otherMembers: '',
    respondentConsent: '',
  });

  // Household member list for dropdown
  const [memberOptions, setMemberOptions] = useState([]);

  // Fetch household members on load
  useEffect(() => {
    const fetchMembers = async () => {
      if (!householdId) return;

      const people = [];

      //  Get head of household
     // const geoSnap = await getDoc(doc(db, 'households', householdId, 'geographicIdentification', 'main'));
     // if (geoSnap.exists()) {
     //   const geo = geoSnap.data();
     //   const name = `${geo.headFirstName || ''} ${geo.headMiddleName || ''} ${geo.headLastName || ''}`.trim();
     //   people.push({ id: 'head', fullName: name });
     // }

      // Get all members and their names
      const membersSnap = await getDocs(collection(db, 'households', householdId, 'members'));
      for (const memberDoc of membersSnap.docs) {
        const demoSnap = await getDocs(
          collection(db, 'households', householdId, 'members', memberDoc.id, 'demographicCharacteristics')
        );
        demoSnap.forEach((doc) => {
          const d = doc.data();
          const fullName = `${d.firstName || ''} ${d.middleName || ''} ${d.lastName || ''}`.trim();
          people.push({ id: memberDoc.id, fullName });
        });
      }

      // Update dropdown list
      setMemberOptions(people);
    };

    fetchMembers();
  }, [householdId]);

  // Handle form input change
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Update sources subfields
    if (name in form.sources) {
      setForm((prev) => ({
        ...prev,
        sources: {
          ...prev.sources,
          [name]: value,
        },
      }));
    } else {
      // Update main-level fields
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Save data to Firestore
    const handleSubmit = async (e) => {
      e.preventDefault();
      setIsSaving(true);
      try {
        await setDoc(doc(db, 'households', householdId, 'familyIncome', 'main'), {
          ...form,
          timestamp: new Date(),
        });
        toast.success('Saved successfully!');
        if (goToNext) goToNext(); 
      } catch (err) {
        console.error(err);
        toast.error('Failed to save.');
      } finally {
        setIsSaving(false); 
      }
    };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-4 space-y-6">

      {/* Question 1 */}
      <div>
        <label className="block mb-1" htmlFor='regularSeasonalMembers'>Who among the family members are/were regularly and seasonally employed?</label>
        <select
          id='regularSeasonalMembers' 
          name="regularSeasonalMembers" 
          value={form.regularSeasonalMembers} 
          onChange={handleChange} 
          className="border p-2 rounded w-full"
        >
          <option value="">-- Select Member --</option>
          {memberOptions.map((m) => <option key={m.id} value={m.fullName}>{m.fullName}</option>)}
        </select>
      </div>

      {/* Question 2 */}
      <div className="border-t pt-4">
        <p className='mb-4 text-lg text-green-700'>(A–C) Income from Regular and Seasonal Employment</p>
        <label className="block mb-1">How much was received by (NAME) as (A-C SOURCE OF INCOME) in the past 12 months (July 01, 2021 - June 30, 2022)?</label>
        {['salaries', 'commissions', 'honoraria'].map((key, i) => (
          <div key={key}>
            <label>{String.fromCharCode(65 + i)}. {key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</label>
            <input type="text" name={key} value={form.sources[key]} onChange={handleChange} className="border p-2 rounded w-full" />
          </div>
        ))}
        <label htmlFor='totalAC'>Total A–C</label>
        <input
          id='totalAC' 
          type="text" 
          name="totalAC" 
          value={form.sources.totalAC} 
          onChange={handleChange} 
          className="border p-2 rounded w-full" />
      </div>
      
      {/* Question 3 */}
      <div className="border-t pt-4">
        <p className='mb-4 text-lg text-green-700'>(D–E) Income from Entrepreneurial Activities</p>
        <label className="block mb-1">How much was received by the family as (D-P SOURCE OF INCOME, Z) in the past 12 months (July 01, 2021 - June 30, 2022)?</label>
        {['familyEnterprise', 'professionPractice'].map((key, i) => (
          <div key={key}>
            <label>{String.fromCharCode(68 + i)}. {key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</label>
            <input type="text" name={key} value={form.sources[key]} onChange={handleChange} className="border p-2 rounded w-full" />
          </div>
        ))}
        <label htmlFor='totalDE'>Total D–E</label>
        <input 
          id='totalDE'
          type="text" 
          name="totalDE" 
          value={form.sources.totalDE} 
          onChange={handleChange} 
          className="border p-2 rounded w-full" 
        />
      </div>
      
      <div className="border-t pt-4">
        <p className='mb-4 text-lg text-green-700'>(F–Z) Other Sources of Income</p>
        {["produceSales", "overseasSupport", "fourPs", "seniorPension", "sap", "domesticSupport", "investments", "rentals", "interests", "giftsInKind", "sustenanceActivity", "otherSourceZ"].map((key, i) => (
          <div key={key}>
            <label htmlFor='sources'>{String.fromCharCode(70 + i)}. {key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</label>
            <input 
              id='sources' 
              type="text" 
              name={key} 
              value={form.sources[key]} 
              onChange={handleChange} 
              className="border p-2 rounded w-full" 
            />
          </div>
        ))}
        <label htmlFor='totalFZ'>Total F–Z</label>
        <input 
          id='totalFZ' 
          type="text" 
          name="totalFZ" 
          value={form.sources.totalFZ} 
          onChange={handleChange} 
          className="border p-2 rounded w-full" 
        />
      </div>
      
      {/* Question 5 */}
      <div>
        <label htmlFor='totalCurrentIncome'>Total Annual Income (Current Members)</label>
        <input
          id='totalCurrentIncome' 
          type="text" 
          name="totalCurrentIncome" 
          value={form.totalCurrentIncome} 
          onChange={handleChange} 
          className="border p-2 rounded w-full" 
        />
      </div>
      
      {/* Question 6 */}
      <div>
        <label htmlFor='totalFormerIncome'>Total Income from Former Members</label>
        <input 
          type="text" 
          name="totalFormerIncome" 
          value={form.totalFormerIncome} 
          onChange={handleChange} 
          className="border p-2 rounded w-full" 
        />
      </div>

       {/* Question 7 */} 
      <div>
        <label htmlFor='totalCombinedIncome'>Total Annual Income (Current + Former)</label>
        <input
          id='totalCombinedIncome' 
          type="text" 
          name="totalCombinedIncome" 
          value={form.totalCombinedIncome} 
          onChange={handleChange} 
          className="border p-2 rounded w-full" />
      </div>
      
      {/* Question 8 */}
      <div>
        <label className="block mb-1 font-medium" htmlFor='otherMembers'>Other Family Members Not Yet Listed</label>
        <select
          id='otherMembers'
          name="otherMembers"
          value={form.otherMembers}
          onChange={handleChange}
          className="border p-2 rounded w-full"
        >
          <option value="">-- Select --</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      </div>

      
      {/* Submit button */}
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
