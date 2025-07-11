'use client';

import { useState } from 'react';
import { db } from '@/firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

export default function FamilyIncome({ householdId, goToNext }) {
  const [form, setForm] = useState({
    regularSeasonalMembers: '',
    sources: {
      salaries: false,
      commissions: false,
      honoraria: false,
      otherCompensation: '',
      familyEnterprise: false,
      professionPractice: false,
      produceSales: false,
      overseasSupport: false,
      fourPs: false,
      seniorPension: false,
      sap: false,
      domesticSupport: false,
      investments: false,
      rentals: false,
      interests: false,
      giftsInKind: false,
      sustenanceActivity: '',
      otherSourceZ: '',
    },
    totalFromMember: '',
    totalFromFamily: '',
    otherMembers: '',
    totalCurrentIncome: '',
    totalFormerIncome: '',
    totalCombinedIncome: '',
    respondentConsent: '',
  });

  const handleCheckbox = (e) => {
    const { name, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      sources: {
        ...prev.sources,
        [name]: checked,
      },
    }));
  };

  const handleTextChange = (e) => {
    const { name, value } = e.target;
    if (name in form.sources) {
      setForm((prev) => ({
        ...prev,
        sources: {
          ...prev.sources,
          [name]: value,
        },
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const docRef = doc(db, 'households', householdId, 'familyIncome', 'main');
      await setDoc(docRef, {
        ...form,
        timestamp: new Date(),
      });
      toast.success('Family income data saved!');
      if (goToNext) goToNext();
    } catch (error) {
      console.error('Error saving family income:', error);
      toast.error('Failed to save data.');
    }
  };


  return (
    <form
      onSubmit={handleSubmit}
      className="h-full overflow-y-auto max-w-5xl mx-auto p-4 space-y-6"
    >
      <h2 className="text-xl font-bold text-green-600 mb-4">
        H. FAMILY INCOME <br />
        (July 01, 2021 - June 30, 2022)
      </h2>

      <div>
        <label className="font-semibold">
          (01) Who among the family members were regularly and seasonally employed in the past 12 months?
        </label>
        <textarea
          name="regularSeasonalMembers"
          value={form.regularSeasonalMembers}
          onChange={handleTextChange}
          rows={3}
          className="border p-2 rounded w-full mt-1"
        />
      </div>

      {/* SOURCE A–C */}
      <div>
        <label className="font-semibold block mb-2">
          (02) Income from Regular and Seasonal Employment
        </label>

        <div className="space-y-2 ml-4">
          <label><input type="checkbox" name="salaries" checked={form.sources.salaries} onChange={handleCheckbox} /> Salaries and wages</label>
          <label><input type="checkbox" name="commissions" checked={form.sources.commissions} onChange={handleCheckbox} /> Commissions, tips, etc.</label>
          <label><input type="checkbox" name="honoraria" checked={form.sources.honoraria} onChange={handleCheckbox} /> Honoraria and transportation</label>
          <label className="block">
            Other compensation:
            <input type="text" name="otherCompensation" value={form.sources.otherCompensation} onChange={handleTextChange} className="border p-1 rounded w-full" />
          </label>
        </div>
      </div>

      {/* SOURCE D–P */}
      <div>
        <label className="font-semibold block mb-2">
          (03) Income from Other Sources
        </label>

        <div className="space-y-2 ml-4">
          <label><input type="checkbox" name="familyEnterprise" checked={form.sources.familyEnterprise} onChange={handleCheckbox} /> From family enterprise</label>
          <label><input type="checkbox" name="professionPractice" checked={form.sources.professionPractice} onChange={handleCheckbox} /> Profession/trade</label>
          <label><input type="checkbox" name="produceSales" checked={form.sources.produceSales} onChange={handleCheckbox} /> Crop/livestock/fish sales</label>
          <label><input type="checkbox" name="overseasSupport" checked={form.sources.overseasSupport} onChange={handleCheckbox} /> Support from abroad</label>
          <label><input type="checkbox" name="fourPs" checked={form.sources.fourPs} onChange={handleCheckbox} /> 4Ps (Pantawid)</label>
          <label><input type="checkbox" name="seniorPension" checked={form.sources.seniorPension} onChange={handleCheckbox} /> Senior citizen pension</label>
          <label><input type="checkbox" name="sap" checked={form.sources.sap} onChange={handleCheckbox} /> SAP assistance</label>
          <label><input type="checkbox" name="domesticSupport" checked={form.sources.domesticSupport} onChange={handleCheckbox} /> Domestic support/gifts</label>
          <label><input type="checkbox" name="investments" checked={form.sources.investments} onChange={handleCheckbox} /> Dividends from investments</label>
          <label><input type="checkbox" name="rentals" checked={form.sources.rentals} onChange={handleCheckbox} /> Rentals from property</label>
          <label><input type="checkbox" name="interests" checked={form.sources.interests} onChange={handleCheckbox} /> Interests from banks/loans</label>
          <label><input type="checkbox" name="giftsInKind" checked={form.sources.giftsInKind} onChange={handleCheckbox} /> Gifts (in kind)</label>
        </div>
      </div>

      {/* Z and P */}
      <div>
        <label className="font-semibold block mb-2">(Z) Other source of income, specify:</label>
        <input
          type="text"
          name="otherSourceZ"
          value={form.sources.otherSourceZ}
          onChange={handleTextChange}
          className="border p-2 rounded w-full"
        />
      </div>

      <div>
        <label className="font-semibold block mb-2">(P) Family sustenance activities:</label>
        <input
          type="text"
          name="sustenanceActivity"
          value={form.sources.sustenanceActivity}
          onChange={handleTextChange}
          className="border p-2 rounded w-full"
        />
      </div>

      <div>
        <label className="font-semibold block mb-1">(04) Total Annual Income (Current Family Members)</label>
        <input
          type="number"
          name="totalCurrentIncome"
          value={form.totalCurrentIncome}
          onChange={handleTextChange}
          className="border p-2 rounded w-full"
        />
      </div>

      <div>
        <label className="font-semibold block mb-1">(05) Total from Former Family Members (last 12 months)</label>
        <input
          type="number"
          name="totalFormerIncome"
          value={form.totalFormerIncome}
          onChange={handleTextChange}
          className="border p-2 rounded w-full"
        />
      </div>

      <div>
        <label className="font-semibold block mb-1">(06) Total Annual Income (Current + Former Members)</label>
        <input
          type="number"
          name="totalCombinedIncome"
          value={form.totalCombinedIncome}
          onChange={handleTextChange}
          className="border p-2 rounded w-full"
        />
      </div>

      <div>
        <label className="font-semibold block mb-1">Are there other family members not yet listed?</label>
        <input
          type="text"
          name="otherMembers"
          value={form.otherMembers}
          onChange={handleTextChange}
          className="border p-2 rounded w-full"
        />
      </div>

      <div>
        <label className="block mb-1">Did the respondent agree to answer?</label>
        <select
          name="respondentConsent"
          value={form.respondentConsent}
          onChange={handleTextChange}
          className="border p-2 rounded w-full"
          required
        >
          <option value="">-- Select --</option>
          <option value="yes">YES</option>
          <option value="no">NO</option>
        </select>
      </div>

      <button
        type="submit"
        className="mt-4 bg-green-700 text-white px-6 py-2 rounded hover:bg-green-800"
      >
        Save & Continue &gt;
      </button>
    </form>
  );
}
