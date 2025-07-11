'use client';

import React, { useState } from 'react';
import { db } from '@/firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';


export default function Agriculture() {
  const [form, setForm] = useState({});

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const docRef = doc(db, 'households', householdId, 'agricultureAndFishery', 'main');
      await setDoc(docRef, {
        ...form,
        timestamp: new Date(),
      });
      toast.success('Agriculture & Fishery data saved!');
      if (goToNext) goToNext();
    } catch (err) {
      console.error('Error saving:', err);
      toast.error('Failed to save data.');
    }
  };


  const parcelTypes = [
    'Agricultural land/parcel',
    'Hydroponics',
    'Urban gardening/roof top gardening',
  ];

  const locationOptions = [
    'WITHIN THE BARANGAY',
    'OUTSIDE THE BARANGAY BUT WITHIN THE CITY/MUNICIPALITY',
    'OUTSIDE THE BARANGAY AND CITY/MUNICIPALITY',
  ];

  const tenureStatusOptions = [
    'Fully Owned',
    'Owner-Like Possession',
    'Tenanted',
    'Leased/Rented',
    'Rent-Free',
    'Owned under Certificate of Land Transfer (CLT) or Certificate of Land Ownership Award (CLOA)',
    'Held under Certificate of Ancestral Domain Title/Certificate of Ancestral Land Title',
    'Agreement (CBFMA)/Stewardship',
    'Don’t Know',
    'Others, Specify',
  ];

  const irrigationStatusOptions = ['FULLY IRRIGATED', 'PARTIALLY IRRIGATED'];

  const yesNoOptions = ['YES', 'NO', 'DON’T KNOW'];

  const rainfedOptions = ['RAINFED UPLAND', 'RAINFED LOWLAND'];

  const activityOptions = [
    'Growing of crops',
    'Livestock and/or poultry raising',
    'Aquaculture',
    'Fish',
    'Gleaning (Gathering of shells)',
    'Renting of agricultural machineries, fishing boats/vessels (including the machine/boat operator)',
    'Others, specify',
  ];

  return (
    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto p-6 space-y-4">

      {/*Agriculture Section 1 */}

      <h2 className="text-lg font-bold text-green-600 mb-4">For 15 years old and over</h2>

      <div className="space-y-0">
        <label className="block">Does any member of your household operate the agricultural activity mainly using ______?</label>
        <select className="border p-2 rounded w-full" onChange={(e) => handleChange('parcelType', e.target.value)}>
          <option value="">-- Select Parcel Type --</option>
          {parcelTypes.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div className="space-y-0">
        <label className="block">How many parcels are being operated/managed by the household (either alone or jointly with someone else)?</label>
        <input type="number" className="border p-2 rounded w-full" onChange={(e) => handleChange('parcelCount', e.target.value)} />
      </div>

      <div className="space-y-0">
        <label className="block">Where is the parcel located?</label>
        <select className="border p-2 rounded w-full" onChange={(e) => handleChange('parcelLocation', e.target.value)}>
          <option value="">-- Select Location --</option>
          {locationOptions.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div className="space-y-0">
        <label className="block">Which activity/ies is/are done in the parcel?</label>
        <select className="border p-2 rounded w-full" onChange={(e) => handleChange('parcelActivity', e.target.value)}>
          <option value="">-- Select Activity --</option>
          {activityOptions.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <h2 className="text-lg font-bold text-green-700 mb-4">For growing of crops and/or livestock and/or poultry operation</h2>

      <div className="space-y-0">
        <label className="block">(04) What is the tenure status of the parcel that the household operates?</label>
        <select className="border p-2 rounded w-full" onChange={(e) => handleChange('tenureStatus', e.target.value)}>
          <option value="">-- Select Status --</option>
          {tenureStatusOptions.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div className="space-y-0">
        <label className="block">(05) Was the parcel irrigated as of July 01, 2022?</label>
        <select className="border p-2 rounded w-full" onChange={(e) => handleChange('irrigatedOnDate', e.target.value)}>
          <option value="">-- Select --</option>
          {yesNoOptions.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div className="space-y-0">
        <label className="block">(06) What is the status of irrigation of the parcel?</label>
        <select className="border p-2 rounded w-full" onChange={(e) => handleChange('irrigationStatus', e.target.value)}>
          <option value="">-- Select Irrigation Status --</option>
          {irrigationStatusOptions.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div className="space-y-0">
        <label className="block">(07) Is the farm operated rainfed upland or rainfed lowland?</label>
        <select className="border p-2 rounded w-full" onChange={(e) => handleChange('rainfedType', e.target.value)}>
          <option value="">-- Select --</option>
          {rainfedOptions.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div className="space-y-0">
        <label className="block">(08) What is the physical area of the parcel? (in hectares)</label>
        <input type="number" step="any" className="border p-2 rounded w-full" onChange={(e) => handleChange('parcelArea', e.target.value)} />
      </div>

      <div className="space-y-0">
        <label className="block">(09) Who among the household members are operator/s of the agricultural land/parcel?</label>
        <input type="text" className="border p-2 rounded w-full" onChange={(e) => handleChange('landOperators', e.target.value)} />
      </div>

      <div className="space-y-0">
        <label className="block">(10) What is the total physical area of all the parcels of land operated by the household?</label>
        <input type="text" className="border p-2 rounded w-full" onChange={(e) => handleChange('totalParcelArea', e.target.value)} />
      </div>
      
      <div className="space-y-0">
        <label className="block">(11.1) In the past 12 months, was there any member of this household engaged in any agricultural or fishery activities?</label>
        <select className="border p-2 rounded w-full" onChange={(e) => handleChange('engagedInAgriFishery', e.target.value)}>
          <option value="">-- Select --</option>
          <option value="YES">YES</option>
          <option value="NO">NO</option>
        </select>
      </div>

      <div className="space-y-0">
        <label className="block">(11.2) Who among the household members is/are engaged in these activities?</label>
        <input type="text" className="border p-2 rounded w-full" onChange={(e) => handleChange('engagedMembers', e.target.value)} />
      </div>

      <div className="space-y-0">
        <label className="block">(12) In what agricultural and fishery activity/ies is the member engaged in?</label>
        <select className="border p-2 rounded w-full" multiple onChange={(e) => handleChange('memberActivities', Array.from(e.target.selectedOptions, opt => opt.value))}>
          {activityOptions.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      {/*Agriculture Section 2 */}

      <div className="space-y-0">
        <label className="block">(13) What is the type of engagement in crop/livestock/poultry raising?</label>
        <input type="text" className="border p-2 rounded w-full" onChange={(e) => handleChange('engagementTypeCrops', e.target.value)} />
      </div>

      <div className="space-y-0">
        <label className="block">(14) Which production activity/ies does the member engage in (crop/livestock/poultry)?</label>
        <input type="text" className="border p-2 rounded w-full" onChange={(e) => handleChange('productionActivitiesAgri', e.target.value)} />
      </div>

      <div className="space-y-0">
        <label className="block">(15) What is the type of engagement in the fisheries activity?</label>
        <input type="text" className="border p-2 rounded w-full" onChange={(e) => handleChange('engagementTypeFishery', e.target.value)} />
      </div>

      <div className="space-y-0">
        <label className="block">(16) Which production activity/ies in aquaculture/fish capture/gleaning?</label>
        <input type="text" className="border p-2 rounded w-full" onChange={(e) => handleChange('productionActivitiesFishery', e.target.value)} />
      </div>

      <div className="space-y-0">
        <label className="block">(17) Is the member a part of any agricultural organization?</label>
        <select className="border p-2 rounded w-full" onChange={(e) => handleChange('isOrgMember', e.target.value)}>
          <option value="">-- Select --</option>
          <option value="YES">YES</option>
          <option value="NO">NO</option>
        </select>
      </div>

      <div className="space-y-0">
        <label className="block">(18) What is/are the name/s of the organization/s?</label>
        <input type="text" className="border p-2 rounded w-full" onChange={(e) => handleChange('organizationNames', e.target.value)} />
      </div>

      {/*Agriculture Section 3 */}
    
      <div className="space-y-0">
        <label className="block">Do you have an agri farm?</label>
        <select
          className="border p-2 rounded w-full"
          onChange={(e) => handleChange('hasAgriFarm', e.target.value)}
        >
          <option value="">-- Select --</option>
          <option value="YES">YES</option>
          <option value="NO">NO</option>
        </select>
      </div>

      <div className="space-y-0">
        <label className="block">Line Number of Household Member:</label>
        <input
          type="text"
          className="border p-2 rounded w-full"
          onChange={(e) => handleChange('lineNumber', e.target.value)}
        />
      </div>

      <div className="space-y-0">
        <label className="block">Temporary/Permanent crops cultivated:</label>
        <input
          type="text"
          placeholder="Crop Name"
          className="border p-2 rounded w-full mb-2"
          onChange={(e) => handleChange('cropName', e.target.value)}
        />
        <input
          type="text"
          placeholder="Crop Code"
          className="border p-2 rounded w-full"
          onChange={(e) => handleChange('cropCode', e.target.value)}
        />
      </div>

      <div className="space-y-0 mt-4">
        <label className="block">Draft animals, agri equipment, facilities, and other tools used:</label>
        <input
          type="text"
          placeholder="Name"
          className="border p-2 rounded w-full mb-2"
          onChange={(e) => handleChange('equipmentName', e.target.value)}
        />
        <input
          type="text"
          placeholder="Code"
          className="border p-2 rounded w-full mb-2"
          onChange={(e) => handleChange('equipmentCode', e.target.value)}
        />

        <div className="grid grid-cols-4 gap-2">
          <input
            type="number"
            placeholder="Owned"
            className="border p-2 rounded w-full"
            onChange={(e) => handleChange('ownedQty', e.target.value)}
          />
          <input
            type="number"
            placeholder="Rented"
            className="border p-2 rounded w-full"
            onChange={(e) => handleChange('rentedQty', e.target.value)}
          />
          <input
            type="number"
            placeholder="Rent-Free"
            className="border p-2 rounded w-full"
            onChange={(e) => handleChange('rentFreeQty', e.target.value)}
          />
          <input
            type="number"
            placeholder="Total"
            className="border p-2 rounded w-full"
            onChange={(e) => handleChange('totalQty', e.target.value)}
          />
        </div>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          className="bg-green-700 text-white px-6 py-2 rounded hover:bg-green-800"
        >
          Save & Continue &gt;
        </button>
      </div>
    </form>
  );
}
