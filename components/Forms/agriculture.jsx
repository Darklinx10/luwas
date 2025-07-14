'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/firebase/config';
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
} from 'firebase/firestore';
import { toast } from 'react-toastify';

export default function Agriculture({ householdId, goToNext }) {
  const [form, setForm] = useState({
    parcelType: '',
    parcelCount: '',
    parcelLocation: '',
    parcelActivity: '',
    landOperator: [],
    engagedMembers: [],
    memberActivities: [],
    // other fields added automatically via handleChange
  });

  const [memberOptions, setMemberOptions] = useState([]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const docRef = doc(db, 'households', householdId, 'agricultureAndFishery', 'main');
      await setDoc(docRef, {
        ...form,
        parcelCount: form.parcelCount ? Number(form.parcelCount) : null,
        parcelArea: form.parcelArea ? Number(form.parcelArea) : null,
        ownedQty: form.ownedQty ? Number(form.ownedQty) : null,
        rentedQty: form.rentedQty ? Number(form.rentedQty) : null,
        rentFreeQty: form.rentFreeQty ? Number(form.rentFreeQty) : null,
        totalQty: form.totalQty ? Number(form.totalQty) : null,
        timestamp: new Date(),
      });
      toast.success('Agriculture & Fishery data saved!');
      if (goToNext) goToNext();
    } catch (err) {
      console.error('Error saving:', err);
      toast.error('Failed to save data.');
    }
  };

  useEffect(() => {
    const fetchMembers = async () => {
      if (!householdId) return;
      try {
        const members = [];

        // Head of household
        const geoRef = doc(db, 'households', householdId, 'geographicIdentification', 'main');
        const geoSnap = await getDoc(geoRef);
        if (geoSnap.exists()) {
          const geo = geoSnap.data();
          const name = `${geo.headFirstName || ''} ${geo.headMiddleName || ''} ${geo.headLastName || ''}`.trim();
          members.push({ id: 'head', name });
        }

        // Members
        const memSnap = await getDocs(collection(db, 'households', householdId, 'members'));
        for (const mem of memSnap.docs) {
          const memId = mem.id;
          const demoSnap = await getDocs(collection(db, 'households', householdId, 'members', memId, 'demographicCharacteristics'));
          demoSnap.forEach(doc => {
            const d = doc.data();
            const fullName = `${d.firstName || ''} ${d.middleName || ''} ${d.lastName || ''}`.trim();
            members.push({ id: memId, name: fullName });
          });
        }

        setMemberOptions(members);
      } catch (err) {
        console.error('Failed to fetch members:', err);
      }
    };

    fetchMembers();
  }, [householdId]);

  useEffect(() => {
    const autoSubmitIfNo = async () => {
      if (form.engagedInAgriFishery === 'NO') {
        try {
          const docRef = doc(db, 'households', householdId, 'agricultureAndFishery', 'main');
          await setDoc(docRef, {
            ...form,
            timestamp: new Date(),
          });
          toast.success('Saved. Skipping to next section...');
          if (goToNext) goToNext();
        } catch (err) {
          console.error('Error saving:', err);
          toast.error('Failed to save data.');
        }
      }
    };

    autoSubmitIfNo();
  }, [form.engagedInAgriFishery]);


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
    'Crop Farming',
    'Livestock and/or poultry raising',
    'Both Crop Farming and Livestock and/or poultry raising',
    'Aquaculture',
    'Fish',
    'Gleaning (Gathering of shells)',
    'Renting of agricultural machineries, fishing boats/vessels (including the machine/boat operator)',
    'Others, specify',
  ];

  const activities = form.memberActivitiesMap?.[member] || [];

          const isCropOrLivestock =
            activities.includes('Crop Farming') ||
            activities.includes('Livestock and/or poultry raising') ||
            activities.includes('Both Crop Farming and Livestock and/or poultry raising');

          const isFishery =
            activities.includes('Aquaculture') ||
            activities.includes('Fish') ||
            activities.includes('Gleaning (Gathering of shells)');

  return (
    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto p-6 space-y-4">

      {/* Agriculture Section 1 */}
      <h2 className="text-lg font-bold text-green-600 mb-4">For 15 years old and over</h2>

      {/* Select Parcel Type Question #1 */}
      <div className="space-y-0">
        <label className="block">
          Does any member of your household operate the agricultural activity mainly using ______?
        </label>
        <select
          className="border p-2 rounded w-full"
          value={form.parcelType || ''}
          onChange={(e) => handleChange('parcelType', e.target.value)}
        >
          <option value="">-- Select Parcel Type --</option>
          {parcelTypes.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      {/* Shown only if 'Agricultural land/parcel' is selected */}
      {form.parcelType === 'Agricultural land/parcel' && (
        <section className="border p-4 rounded bg-gray-50 space-y-4 mt-4">
          <div className="space-y-0">
            <label className="block">
              How many parcels are being operated/managed by the household (either alone or jointly with someone else)?
            </label>
            <input
              type="number"
              min="0"
              className="border p-2 rounded w-full"
              value={form.parcelCount || ''}
              onChange={(e) => handleChange('parcelCount', e.target.value)}
            />
          </div>

          <div className="space-y-0">
            <label className="block">Where is the parcel located?</label>
            <select
              className="border p-2 rounded w-full"
              value={form.parcelLocation || ''}
              onChange={(e) => handleChange('parcelLocation', e.target.value)}
            >
              <option value="">-- Select Location --</option>
              {locationOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div className="space-y-0">
            <label className="block">Which activity/ies is/are done in the parcel?</label>
            <select
              className="border p-2 rounded w-full"
              value={form.parcelActivity || ''}
              onChange={(e) => handleChange('parcelActivity', e.target.value)}
            >
              <option value="">-- Select Activity --</option>
              {activityOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <h2 className="text-lg font-bold text-green-700 mt-6">
            For growing of crops and/or livestock and/or poultry operation
          </h2>
          
          {/* Question #4 */}
          <div className="space-y-0">
            <label className="block"> What is the tenure status of the parcel that the household operates?</label>
            <select className="border p-2 rounded w-full" onChange={(e) => handleChange('tenureStatus', e.target.value)}>
              <option value="">-- Select Status --</option>
              {tenureStatusOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          
          {/* Questions #5–7: Show only if crop farming is involved */}
          {['Crop Farming', 'Both Crop Farming and Livestock and/or poultry raising'].includes(form.parcelActivity) && (
            <>
              {/* Question #5 */}
              <div className="space-y-0">
                <label className="block">Was the parcel irrigated as of July 01, 2022?</label>
                <select
                  className="border p-2 rounded w-full"
                  value={form.irrigatedOnDate || ''}
                  onChange={(e) => handleChange('irrigatedOnDate', e.target.value)}
                >
                  <option value="">-- Select --</option>
                  {yesNoOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>


              {/* Question #6: Show only if irrigatedOnDate === 'YES' */}
              {form.irrigatedOnDate === 'YES' && (
                <div className="space-y-0">
                  <label className="block">What is the status of irrigation of the parcel?</label>
                  <select
                    className="border p-2 rounded w-full"
                    value={form.irrigationStatus || ''}
                    onChange={(e) => handleChange('irrigationStatus', e.target.value)}
                  >
                    <option value="">-- Select Irrigation Status --</option>
                    {irrigationStatusOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Question #7: Show only if irrigatedOnDate is YES or NO */}
              {['YES', 'NO'].includes(form.irrigatedOnDate) && (
                <div className="space-y-0">
                  <label className="block">Is the farm operated rainfed upland or rainfed lowland?</label>
                  <select
                    className="border p-2 rounded w-full"
                    value={form.rainfedType || ''}
                    onChange={(e) => handleChange('rainfedType', e.target.value)}
                  >
                    <option value="">-- Select --</option>
                    {rainfedOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          
          {/* Question #8 */}
          <div className="space-y-0">
            <label className="block">What is the physical area of the parcel? (in hectares)</label>
            <input
              type="number"
              step="any"
              className="border p-2 rounded w-full"
              onChange={(e) => handleChange('parcelArea', e.target.value)}
            />
          </div>
          
          {/* Question #9 */}
          <div className="space-y-0">
            <label className="block">
              Who among the household members are operator/s of the agricultural land/parcel?
            </label>
            <select
              multiple
              className="border p-2 rounded w-full h-40"
              value={form.landOperator || []}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                handleChange('landOperator', selected);
              }}
            >
              {memberOptions.map((member) => (
                <option key={member.id} value={member.name}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>


          
          {/* Question #10 */}
          <div className="space-y-0">
            <label className="block">What is the total physical area of all the parcels of land operated by the household?</label>
            <input
              type="text"
              className="border p-2 rounded w-full"
              onChange={(e) => handleChange('totalParcelArea', e.target.value)}
            />
          </div>

          {/* Question #11 */}
          <div className="space-y-0">
            <label className="block">Are there other agricultural land/parcels operated by the household?</label>
            <select
              className="border p-2 rounded w-full"
              value={form.hasOtherParcels || ''}
              onChange={(e) => handleChange('hasOtherParcels', e.target.value)}
            >
              <option value="">-- Select --</option>
              <option value="YES">YES</option>
              <option value="NO">NO</option>
            </select>
          </div>
        </section>
      )}
      
      {/* Question #11.1 */}
      <div className="space-y-0">
        <label className="block">
          In the past 12 months, was there any member of this household engaged in any agricultural or fishery activities?
        </label>
        <select
          className="border p-2 rounded w-full"
          value={form.engagedInAgriFishery || ''}
          onChange={(e) => handleChange('engagedInAgriFishery', e.target.value)}
        >
          <option value="">-- Select --</option>
          <option value="YES">YES</option>
          <option value="NO">NO</option>
        </select>
      </div>

      {/* Question #11.2 */}
      {/* Select one member at a time and add to the list */}
      <div className="space-y-0">
        <label className="block">Who among the household members is engaged in these activities?</label>
        <div className="flex gap-2">
          <select
            className="border p-2 rounded w-full"
            value={form.selectedMember || ''}
            onChange={(e) => handleChange('selectedMember', e.target.value)}
          >
            <option value="">-- Select Household Member --</option>
            {memberOptions
              .filter((m) => !(form.engagedMembers || []).includes(m.name))
              .map((member) => (
                <option key={member.id} value={member.name}>
                  {member.name}
                </option>
              ))}
          </select>
          <button
            type="button"
            onClick={() => {
              if (form.selectedMember) {
                setForm((prev) => ({
                  ...prev,
                  engagedMembers: [...(prev.engagedMembers || []), prev.selectedMember],
                  memberData: {
                    ...prev.memberData,
                    [prev.selectedMember]: {
                      memberActivities: {},
                      engagementTypeCrops: '',
                      productionActivitiesAgri: '',
                      engagementTypeFishery: '',
                      productionActivitiesFishery: '',
                      isOrgMember: '',
                      organizationNames: '',
                    },
                  },
                  selectedMember: '',
                }));
              }
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + Add
          </button>
        </div>
      </div>
      
      {/* Per-member subform */}
      {(form.engagedMembers || []).map((member) => (
        <div key={member} className="border p-4 mt-4 rounded bg-gray-50">
          <h3 className="font-semibold text-green-700 mb-2">{member}'s Agricultural Activities</h3>

          {/* Question #12 */}
          <div className="space-y-0">
            <label className="block">
              In what agricultural and fishery activity/ies is the member engaged in?
            </label>
            <select
              className="border p-2 rounded w-full"
              multiple
              value={form.memberActivitiesMap?.[member] || []}
              onChange={async (e) => {
                const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
                const updatedMap = {
                  ...(form.memberActivitiesMap || {}),
                  [member]: selected,
                };

                handleChange('memberActivitiesMap', updatedMap);

                const includesMachineryOrOthers =
                  selected.includes('Renting of agricultural machineries, fishing boats/vessels (including the machine/boat operator)') ||
                  selected.includes('Others, specify');

                if (includesMachineryOrOthers) {
                  try {
                    const docRef = doc(db, 'households', householdId, 'agricultureAndFishery', 'main');
                    await setDoc(
                      docRef,
                      {
                        ...form,
                        memberActivitiesMap: updatedMap,
                        timestamp: new Date(),
                      },
                      { merge: true }
                    );
                    toast.success('Data saved successfully!');
                    if (goToNext) goToNext();
                  } catch (err) {
                    console.error('Auto-save error:', err);
                    toast.error('Failed to auto-save data.');
                  }
                }
              }}
            >
              {activityOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          


      
          {isCropOrLivestock && (
            <>
              {/* Q13 */}
              <label className="block mt-4">What is the type of engagement in crop/livestock/poultry raising?</label>
              <select
                className="border p-2 rounded w-full"
                value={form.memberData?.[member]?.engagementTypeCrops || ''}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    memberData: {
                      ...prev.memberData,
                      [member]: {
                        ...prev.memberData[member],
                        engagementTypeCrops: e.target.value,
                      },
                    },
                  }))
                }
              >
                <option value="">-- Select --</option>
                <option value="Operation in own household farm">Operation in own household farm</option>
                <option value="Unpaid household members working in own household farm">Unpaid household members working in own household farm</option>
                <option value="Farm laborer/worker (paid) in own household farm">Farm laborer/worker (paid) in own household farm</option>
                <option value="Hired manager of another household farm">Hired manager of another household farm</option>
                <option value="Farm laborer/worker in another household farm">Farm laborer/worker in another household farm</option>
              </select>

              {/* Q14 */}
              <label className="block mt-4">Which production activity/ies does the member engage in?</label>
              <input
                type="text"
                className="border p-2 rounded w-full"
                value={form.memberData?.[member]?.productionActivitiesAgri || ''}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    memberData: {
                      ...prev.memberData,
                      [member]: {
                        ...prev.memberData[member],
                        productionActivitiesAgri: e.target.value,
                      },
                    },
                  }))
                }
              />
            </>
          )}

          {isFishery && (
            <>
              {/* Q15 */}
              <label className="block mt-4">What is the type of engagement in the fisheries activity?</label>
              <input
                type="text"
                className="border p-2 rounded w-full"
                value={form.memberData?.[member]?.engagementTypeFishery || ''}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    memberData: {
                      ...prev.memberData,
                      [member]: {
                        ...prev.memberData[member],
                        engagementTypeFishery: e.target.value,
                      },
                    },
                  }))
                }
              />

              {/* Q16 */}
              <label className="block mt-4">Which production activity/ies in aquaculture/fish capture/gleaning?</label>
              <input
                type="text"
                className="border p-2 rounded w-full"
                value={form.memberData?.[member]?.productionActivitiesFishery || ''}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    memberData: {
                      ...prev.memberData,
                      [member]: {
                        ...prev.memberData[member],
                        productionActivitiesFishery: e.target.value,
                      },
                    },
                  }))
                }
              />
            </>
          )}

          {/* Q17 */}
          <label className="block mt-4">Is the member a part of any agricultural organization?</label>
          <select
            className="border p-2 rounded w-full"
            value={form.memberData?.[member]?.isOrgMember || ''}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                memberData: {
                  ...prev.memberData,
                  [member]: {
                    ...prev.memberData[member],
                    isOrgMember: e.target.value,
                  },
                },
              }))
            }
          >
            <option value="">-- Select --</option>
            <option value="YES">YES</option>
            <option value="NO">NO</option>
          </select>

          {/* Q18 */}
          <label className="block mt-4">(18) What is/are the name/s of the organization/s?</label>
          <input
            type="text"
            className="border p-2 rounded w-full"
            value={form.memberData?.[member]?.organizationNames || ''}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                memberData: {
                  ...prev.memberData,
                  [member]: {
                    ...prev.memberData[member],
                    organizationNames: e.target.value,
                  },
                },
              }))
            }
          />

          {/* Q19 */}
          <label className="block mt-4">
            What type of hydroponics system did you or your household member use?
          </label>
          <select
            className="border p-2 rounded w-full"
            value={form.memberData?.[member]?.hydroponicSystem || ''}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                memberData: {
                  ...prev.memberData,
                  [member]: {
                    ...prev.memberData[member],
                    hydroponicSystem: e.target.value,
                  },
                },
              }))
            }
          >
            <option value="">-- Select --</option>
            <option value="Wick System">Wick System</option>
            <option value="Deep Water Culture (DWC)">Deep Water Culture (DWC)</option>
            <option value="Nutrient Film Technique (NFT)">Nutrient Film Technique (NFT)</option>
            <option value="Ebb and Flow (Flood and Drain)">Ebb and Flow (Flood and Drain)</option>
            <option value="Aeroponics">Aeroponics</option>
            <option value="Drip">Drip</option>
            <option value="Others, specify">Others, specify</option>
          </select>
        </div>
      ))}

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

      <div className="pt-6 flex justify-end">
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
