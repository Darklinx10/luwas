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
  // State for form submission loading indicator
  const [isSaving, setIsSaving] = useState(false);

  // Initial form state with various agriculture and fishery-related fields
  const [form, setForm] = useState({
    livestockMembers: [{ lineNumber: '', animals: [] }],
    parcelType: '',
    parcelCount: '',
    parcelLocation: '',
    parcelActivity: '',
    landOperator: [],
    engagedMembers: [],
    memberActivities: [],
    aquaFarms: [false, false, false, false, false, false],
    aquaFarmOperators: [],
    toolsUsed: [],
    equipmentUsed: [],
    livestockContinuously: '',
    cropContinuously: '',
    livestockChange: '',
    livestockChangeReason: '',
    livestockDecreasePercent: '',
    cropChange: '',
    cropChangeReason: '',
    cropDecreasePercent: '',
    cropName: '',
    crops: [],
    selectedEngagedMember: '',
    selectedOperatorMember: '',
    cropsByMember: {},
    engagedInAgriFishery: '',
    ownedQty: '',
    rentedQty: '',
    rentFreeQty: '',
    totalQty: '',
    parcelArea: '',
    // dynamic fields will be handled via handleChange
  });

  // List of household members for selection
  const [memberOptions, setMemberOptions] = useState([]);
  const [isCropOrLivestock, setIsCropOrLivestock] = useState(false);
  const [isFishery, setIsFishery] = useState(false);

  // Generic form handler for both inputs and custom setters
  const handleChange = (eOrField, maybeValue) => {
    if (typeof eOrField === 'object' && eOrField.target) {
      const { name, value, type, checked } = eOrField.target;
      setForm((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [eOrField]: maybeValue,
      }));
    }
  };

  // Handle form submission and save to Firestore
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const docRef = doc(db, 'households', householdId, 'Agriculture', 'main');

      // Ensure numeric fields are stored properly
      const formattedData = {
        ...form,
        parcelCount: form.parcelCount ? Number(form.parcelCount) : null,
        parcelArea: form.parcelArea ? Number(form.parcelArea) : null,
        ownedQty: form.ownedQty ? Number(form.ownedQty) : null,
        rentedQty: form.rentedQty ? Number(form.rentedQty) : null,
        rentFreeQty: form.rentFreeQty ? Number(form.rentFreeQty) : null,
        totalQty: form.totalQty ? Number(form.totalQty) : null,
        cropDecreasePercent: form.cropDecreasePercent ? Number(form.cropDecreasePercent) : null,
        livestockDecreasePercent: form.livestockDecreasePercent ? Number(form.livestockDecreasePercent) : null,
        aquafarmDecreasePercent: form.aquafarmDecreasePercent ? Number(form.aquafarmDecreasePercent) : null,
        fishCatchDecreasePercent: form.fishCatchDecreasePercent ? Number(form.fishCatchDecreasePercent) : null,
        numBoats: form.numBoats ? Number(form.numBoats) : null,
        timestamp: new Date(),
      };

      await setDoc(docRef, formattedData);

      toast.success('Agriculture & Fishery data saved!');
      if (goToNext) goToNext();
    } catch (err) {
      console.error('Error saving:', err);
      toast.error('Failed to save data.');
    } finally {
      setIsSaving(false); 
    }
  };

  // Fetch household head and members on mount
  useEffect(() => {
    const fetchMembers = async () => {
      if (!householdId) return;
      try {
        const members = [];

        // Get household head's name
     //   const geoSnap = await getDoc(doc(db, 'households', householdId, 'geographicIdentification', 'main'));
    //    if (geoSnap.exists()) {
    //      const geo = geoSnap.data();
     //     const name = `${geo.headFirstName || ''} ${geo.headMiddleName || ''} ${geo.headLastName || ''}`.trim();
      //    members.push({ id: 'head', name });
      //  }

        // Get each member's demographic name
        const memSnap = await getDocs(collection(db, 'households', householdId, 'members'));
        const memberPromises = memSnap.docs.map(async (mem) => {
          const memId = mem.id;
          const demoSnap = await getDocs(collection(db, 'households', householdId, 'members', memId, 'demographicCharacteristics'));
          const memberDocs = [];
          demoSnap.forEach((doc) => {
            const d = doc.data();
            const fullName = `${d.firstName || ''} ${d.middleName || ''} ${d.lastName || ''}`.trim();
            memberDocs.push({ id: memId, name: fullName });
          });
          return memberDocs;
        });

        const results = await Promise.all(memberPromises);
        results.forEach((arr) => members.push(...arr));
        setMemberOptions(members);
      } catch (err) {
        console.error('Failed to fetch members:', err);
      }
    };

    fetchMembers();
  }, [householdId]);

  // Auto-submit if the user answers "NO" to being engaged in agri/fishery
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

  // Add crop entry for selected member
  const addCrop = () => {
    const member = form.selectedOperatorMember;
    const crop = form.cropName.trim();

    if (!member || crop === '') return;

    setForm((prev) => ({
      ...prev,
      cropName: '',
      cropsByMember: {
        ...prev.cropsByMember,
        [member]: [...(prev.cropsByMember?.[member] || []), crop],
      },
    }));
  };


  // Remove crop entry from selected member
  const removeCrop = (index) => {
    const member = form.selectedOperatorMember;
    if (!member) return;

    setForm((prev) => {
      const updated = [...(prev.cropsByMember?.[member] || [])];
      updated.splice(index, 1);

      return {
        ...prev,
        cropsByMember: {
          ...prev.cropsByMember,
          [member]: updated,
        },
      };
    });
  };


  // Select options used for form dropdowns (can be moved outside the component if needed)
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
          id="parcelType"
          name="parcelType"
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
              id="parcelCount"
              name="parcelCount"
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
              id="parcelLocation"
              name="parcelLocation"
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
              id="parcelActivity"
              name="parcelActivity"
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
            <label className="block">
              What is the tenure status of the parcel that the household operates?
            </label>
            <select
              id="tenureStatus"
              name="tenureStatus"
              className="border p-2 rounded w-full"
              value={form.tenureStatus || ''}
              onChange={(e) => handleChange('tenureStatus', e.target.value)}
            >
              <option value="">-- Select Status --</option>
              {tenureStatusOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          
          {/* Question #5 */}
          {['Crop Farming', 'Both Crop Farming and Livestock and/or poultry raising'].includes(form.parcelActivity) && (
            <>
              <div className="space-y-0">
                <label className="block">Was the parcel irrigated as of July 01, 2022?</label>
                <select
                  id="irrigatedOnDate"
                  name="irrigatedOnDate"
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
              {/* Question #6 */}
              {form.irrigatedOnDate === 'YES' && (
                <div className="space-y-0">
                  <label className="block">What is the status of irrigation of the parcel?</label>
                  <select
                    id="irrigationStatus"
                    name="irrigationStatus"
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
              {/* Question #7 */}
              {['YES', 'NO'].includes(form.irrigatedOnDate) && (
                <div className="space-y-0">
                  <label className="block">Is the farm operated rainfed upland or rainfed lowland?</label>
                  <select
                    id="rainfedType"
                    name="rainfedType"
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
            <label className="block">
              What is the physical area of the parcel? (in hectares)
            </label>
            <input
              id="parcelArea"
              name="parcelArea"
              type="number"
              step="any"
              className="border p-2 rounded w-full"
              value={form.parcelArea || ''}
              onChange={(e) => handleChange('parcelArea', e.target.value)}
            />
          </div>
          {/* Question #9 */}
          <div className="space-y-0">
            <label className="block">
              Who among the household members are operator/s of the agricultural land/parcel?
            </label>
            <select
              id="landOperator"
              name="landOperator"
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
            <label className="block">
              What is the total physical area of all the parcels of land operated by the household?
            </label>
            <input
              id="totalParcelArea"
              name="totalParcelArea"
              type="text"
              className="border p-2 rounded w-full"
              value={form.totalParcelArea || ''}
              onChange={(e) => handleChange('totalParcelArea', e.target.value)}
            />
          </div>
          {/* Question #11 */}
          <div className="space-y-0">
            <label className="block">
              Are there other agricultural land/parcels operated by the household?
            </label>
            <select
              id="hasOtherParcels"
              name="hasOtherParcels"
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
          id='engagedInAgriFishery'
          name='engagedInAgriFishery'
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
            id='selectedEngagedMember'
            name='selectedEngagedMember'
            className="border p-2 rounded w-full"
            value={form.selectedEngagedMember || ''}
            onChange={(e) => handleChange('selectedEngagedMember', e.target.value)}
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
              if (form.selectedEngagedMember) {
                setForm((prev) => ({
                  ...prev,
                  engagedMembers: [...(prev.engagedMembers || []), prev.selectedEngagedMember],
                  memberData: {
                    ...prev.memberData,
                    [prev.selectedEngagedMember]: {
                      memberActivities: {},
                      engagementTypeCrops: '',
                      productionActivitiesAgri: '',
                      engagementTypeFishery: '',
                      productionActivitiesFishery: '',
                      isOrgMember: '',
                      organizationNames: '',
                    },
                  },
                  selectedEngagedMember: '',
                }));
              }
            }}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 cursor-pointer"
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
              id='memberActivitiesMap'
              name='memberActivitiesMap'
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
                id='engagementTypeCrops'
                name='engagementTypeCrops'
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
                id='productionActivitiesAgri'
                name='productionActivitiesAgri'
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
                id='engagementTypeFishery'
                name='engagementTypeFishery'
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
                id='productionActivitiesFishery'
                name='productionActivitiesFishery'
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
            id='isOrgMember'
            name='isOrgMember'
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
          <label className="block mt-4"> What is/are the name/s of the organization/s?</label>
          <input
            id='organizationNames'
            name='organizationNames'
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
            id='hydroponicSystem'
            name='hydroponicSystem'
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
      {/* Q20 */}
      <>
        {/* Member Dropdown for Crop Operators */}
        <div className="space-y-0 mt-6">
          <label htmlFor="selectedOperatorMember" className="block font-semibold text-green-700">
            (B) Household Member who is growing crops (Operator)
          </label>
          <select
            id="selectedOperatorMember"
            name="selectedOperatorMember"
            className="border p-2 rounded w-full"
            value={form.selectedOperatorMember || ''}
            onChange={(e) => handleChange('selectedOperatorMember', e.target.value)}
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
        </div>

        {/* Crop Input + Button */}
        <div className="space-y-2 mt-4 relative z-[100] bg-white p-4 rounded shadow-sm">
          <label htmlFor="cropName" className="block font-medium">
            Temporary/Permanent crops cultivated:
          </label>

          <input
            id="cropName"
            name="cropName"
            type="text"
            placeholder="Crop Name"
            className="border p-2 rounded w-full"
            value={form.cropName || ''}
            onChange={(e) => handleChange('cropName', e.target.value.trimStart())}
            disabled={!form.selectedOperatorMember}
            maxLength={50}
          />

          <button
            type="button"
            onClick={addCrop}
            className={`px-4 py-2 rounded text-white transition ${
              !form.selectedOperatorMember || form.cropName?.trim() === ''
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 cursor-pointer'
            }`}
            disabled={!form.selectedOperatorMember || form.cropName?.trim() === ''}
          >
            + Add Crop
          </button>

          {/* Crop List */}
          {form.selectedOperatorMember &&
            form.cropsByMember?.[form.selectedOperatorMember]?.length > 0 && (
              <ul className="list-disc pl-5 mt-2 space-y-1">
                {form.cropsByMember[form.selectedOperatorMember].map((crop, index) => (
                  <li key={index} className="flex items-center justify-between">
                    <span>{crop}</span>
                    <button
                      type="button"
                      onClick={() => removeCrop(index)}
                      className="text-red-500 hover:underline text-sm cursor-pointer"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
        </div>




        {/* Q21 */}
        <div className="space-y-0 mt-4">
          <label className="block">Draft animals, agri equipment, facilities, and other tools used:</label>
          <input
            id='equipmentName'
            name='equipmentName'
            type="text"
            placeholder="Name"
            className="border p-2 rounded w-full mb-2"
            value={form.equipmentName || ''}
            onChange={(e) => handleChange('equipmentName', e.target.value)}
          />

          {/* Q22 */}
          <div className="space-y-2">
            <label className="block">
              How many of these draft animals, agricultural equipment, facilities, and other tools were owned?
            </label>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <label htmlFor="ownedQty" className="block text-sm mb-1">Owned</label>
                <input
                  id="ownedQty"
                  name="ownedQty"
                  type="number"
                  placeholder="Owned"
                  className="border p-2 rounded w-full"
                  value={form.ownedQty || ''}
                  onChange={(e) => handleChange('ownedQty', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Rented</label>
                <input
                  id="rentedQty"
                  name="rentedQty"
                  type="number"
                  placeholder="Rented"
                  className="border p-2 rounded w-full"
                  value={form.rentedQty || ''}
                  onChange={(e) => handleChange('rentedQty', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Rent-Free</label>
                <input
                  id="rentFreeQty"
                  name="rentFreeQty"
                  type="number"
                  placeholder="Rent-Free"
                  className="border p-2 rounded w-full"
                  value={form.rentFreeQty || ''}
                  onChange={(e) => handleChange('rentFreeQty', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Total</label>
                <input
                  id="totalQty"
                  name="totalQty"
                  type="number"
                  placeholder="Total"
                  className="border p-2 rounded w-full"
                  value={form.totalQty || ''}
                  onChange={(e) => handleChange('totalQty', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Q23 */}
        <section>
          <h3 className="mt-8" >Continuous Crop Farming in the Past 3 Years</h3>
          <select
            id='cropContinuously'
            name='cropContinuously'
            className="border p-2 rounded w-full"
            value={form.cropContinuously || ''}
            onChange={(e) => handleChange('cropContinuously', e.target.value)}
          >
            <option value="">-- Select --</option>
            <option value="YES">Yes</option>
            <option value="NO">No</option>
          </select>
        </section>

        {/* Q24 */}
        <section>
          <h3 className="mt-8">Did Your Household's Harvest Decrease, Increase, or Stay the Same?</h3>
          <select
            id='cropChange'
            name='cropChange'
            className="border p-2 rounded w-full"
            value={form.cropChange || ''}
            onChange={(e) => handleChange('cropChange', e.target.value)}
          >
            <option value="">-- Select --</option>
            <option value="DECREASE">Decrease</option>
            <option value="INCREASE">Increase</option>
            <option value="SAME">Remain the Same</option>
          </select>
        </section>

        {/* Q25-26: Shown only if Decreased */}
        {form.cropChange === 'DECREASE' && (
          <>
            <section>
              <h3 className=" mt-8">What Was the Primary Reason for the Decrease?</h3>
              <input
                id='cropChangeReason'
                name='cropChangeReason'
                type="text"
                className="border p-2 rounded w-full"
                placeholder="e.g., Drought, Typhoon, Fertilizer cost"
                value={form.cropChangeReason || ''}
                onChange={(e) => handleChange('cropChangeReason', e.target.value)}
              />
            </section>
            <section>
              <h3 className="mt-4">Percentage Decrease in Latest Harvest (%)</h3>
              <input
                id='cropDecreasePercent'
                name='cropDecreasePercent'
                type="number"
                className="border p-2 rounded w-full"
                placeholder="Enter percentage"
                value={form.cropDecreasePercent || ''}
                onChange={(e) => handleChange('cropDecreasePercent', e.target.value)}
              />
            </section>
          </>
        )}

        {/* Q27: Livestock */}
        <section>
          <h3 className="mt-8">Livestock and/or Poultry Operator</h3>
          {[0, 1, 2].map((_, i) => (
            <div key={i} className="mb-4">
              <label className="block" htmlFor='livestockMembers'>HH Member {i + 1} Line Number</label>
              <input
                id='livestockMembers'
                name='livestockMembers'
                type="text"
                className="border p-2 rounded w-full"
                value={form.livestockMembers[i]?.lineNumber || ''}
                onChange={(e) => {
                  const updated = [...form.livestockMembers];
                  updated[i] = { ...updated[i], lineNumber: e.target.value };
                  handleChange('livestockMembers', updated);
                }}
              />
              <div className="grid grid-cols-2 gap-2 mt-2">
                {['Carabao', 'Cattle', 'Swine', 'Goat', 'Chicken', 'Duck', 'Horse', 'Sheep', 'Rabbit', 'Others'].map((animal, index) => (
                  <label key={index} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.livestockMembers[i]?.animals?.includes(animal) || false}
                      onChange={(e) => {
                        const updated = [...form.livestockMembers];
                        const animals = updated[i]?.animals || [];
                        if (e.target.checked) {
                          updated[i].animals = [...animals, animal];
                        } else {
                          updated[i].animals = animals.filter((a) => a !== animal);
                        }
                        handleChange('livestockMembers', updated);
                      }}
                    />
                    {animal}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Q28 */}
        <section>
          <h3 className=" mt-8">Tools/Machinery Used for Livestock</h3>
          <input
            id='toolsUsedText'
            name='toolsUsedText'
            type="text"
            className="border p-2 rounded w-full"
            placeholder="List tools/machines used in livestock raising..."
            value={form.toolsUsedText || ''}
            onChange={(e) => handleChange('toolsUsedText', e.target.value)}
          />
        </section>

        {/* Q29 */}
        <section>
          <h3 className="mt-8">Ownership of the Above Livestock Equipment</h3>
          <input
            id='livestockOwnership'
            name='livestockOwnership'
            type="text"
            className="border p-2 rounded w-full"
            placeholder="Owned / Rented / Rent-Free breakdown"
            value={form.livestockOwnership || ''}
            onChange={(e) => handleChange('livestockOwnership', e.target.value)}
          />
        </section>

        {/* Q30 */}
        <section>
          <h3 className="mt-8">Continuously Raised Livestock in Last 3 Years?</h3>
          <select
            id='livestockContinuously'
            name='livestockContinuously'
            className="border p-2 rounded w-full"
            value={form.livestockContinuously || ''}
            onChange={(e) => handleChange('livestockContinuously', e.target.value)}
          >
            <option value="">-- Select --</option>
            <option value="YES">Yes</option>
            <option value="NO">No</option>
          </select>
        </section>
      </>


      {/* Q31 */}
      <section>
        <h3 className="mt-8">Did Volume of Livestock Change Compared to 2019?</h3>
        <select
          id='livestockChange'
          name='livestockChange'
          className="border p-2 rounded w-full"
          value={form.livestockChange || ''}
          onChange={(e) => handleChange('livestockChange', e.target.value)}
        >
          <option value="">-- Select --</option>
          <option value="INCREASE">Increase</option>
          <option value="DECREASE">Decrease</option>
          <option value="SAME">Remain the Same</option>
        </select>
      </section>

      {/* Q32–33, shown only if DECREASE */}
      {form.livestockChange === 'DECREASE' && (
        <>
          <section>
            <h3 className="mt-8">Reason for Livestock Decrease</h3>
            <input
              id='livestockChangeReason'
              name='livestockChangeReason'
              type="text"
              className="border p-2 rounded w-full"
              placeholder="e.g., Disease, Flood, Hot Weather"
              value={form.livestockChangeReason || ''}
              onChange={(e) => handleChange('livestockChangeReason', e.target.value)}
            />
          </section>
          <section>
            <h3 className=" mt-4">Percentage Decrease (%)</h3>
            <input
              id='livestockDecreasePercent'
              name='livestockDecreasePercent'
              type="number"
              className="border p-2 rounded w-full"
              value={form.livestockDecreasePercent || ''}
              onChange={(e) => handleChange('livestockDecreasePercent', e.target.value)}
            />
          </section>
        </>
      )}

      {/* Q34 */}
      <section>
        <h3 className="mt-8">Aquafarm Operation</h3>
        <div className="grid grid-cols-6 gap-4 mt-2">
          {form.aquaFarms?.map((checked, index) => (
            <label key={index} className="flex items-center gap-2">
              <input
                id='aquaFarms'
                name='aquaFarms'
                type="checkbox"
                checked={checked}
                onChange={(e) => {
                  const updated = [...form.aquaFarms];
                  updated[index] = e.target.checked;
                  handleChange('aquaFarms', updated);
                }}
              />
              AquaFarm {index + 1}
            </label>
          ))}
        </div>
      </section>

      {/* Q36 */}
      <div className="mt-6">
        <label className="font-medium block mb-1">Where is the aquafarm located?</label>
        <select
          id='aquafarmLocation'
          name="aquafarmLocation"
          className="border p-2 rounded w-full"
          value={form.aquafarmLocation || ''}
          onChange={(e) => handleChange('aquafarmLocation', e.target.value)}
        >
          <option value="">-- Select Location --</option>
          <option value="1">Within the Barangay</option>
          <option value="2">Outside the Barangay but within the City/Municipality</option>
          <option value="3">Outside the Barangay and City/Municipality</option>
        </select>
      </div>

      {/* Q37 */}
      <div className="mt-6">
        <label className="font-medium block mb-1">What is the type of aquafarm?</label>
        <select
          id='aquafarmType'
          name="aquafarmType"
          className="border p-2 rounded w-full"
          value={form.aquafarmType || ''}
          onChange={(e) => handleChange('aquafarmType', e.target.value)}
        >
          <option value="">-- Select Type --</option>
          <option value="1">Fishpond</option>
          <option value="2">Fish Tank</option>
          <option value="3">Fish Pen</option>
          <option value="4">Fish Cage</option>
          <option value="5">Seaweed Farm</option>
          <option value="6">Mussel Farm</option>
          <option value="7">Oyster (Talaba) Farm</option>
          <option value="9">Others</option>
        </select>
        {form.aquafarmType === '9' && (
          <input
            id='aquafarmOther'
            type="text"
            name="aquafarmOther"
            placeholder="If others, specify"
            className="border p-2 rounded w-full mt-2"
            value={form.aquafarmOther || ''}
            onChange={(e) => handleChange('aquafarmOther', e.target.value)}
          />
        )}
      </div>

      {/* Q38 */}
      <div className="mt-6">
        <label className="font-medium block mb-1">Aquafarm measurement</label>
        <input
          id='area'
          name="area"
          placeholder="Area (sq. m)"
          className="border p-2 rounded w-full mb-2"
          value={form.area || ''}
          onChange={(e) => handleChange('area', e.target.value)}
        />
        <input
          id='depth'
          name="depth"
          placeholder="Depth (m)"
          className="border p-2 rounded w-full mb-2"
          value={form.depth || ''}
          onChange={(e) => handleChange('depth', e.target.value)}
        />
        <input
          id='volume'
          name="volume"
          placeholder="Volume (cu. m)"
          className="border p-2 rounded w-full"
          value={form.volume || ''}
          onChange={(e) => handleChange('volume', e.target.value)}
        />
      </div>

      {/* Q39 */}
      <div className="mt-6">
        <label className="font-medium block mb-1">Type of water environment</label>
        <select
          id='waterType'
          name="waterType"
          className="border p-2 rounded w-full"
          value={form.waterType || ''}
          onChange={(e) => handleChange('waterType', e.target.value)}
        >
          <option value="">-- Select Water Type --</option>
          <option value="1">Freshwater</option>
          <option value="2">Brackish water</option>
          <option value="3">Marine water</option>
        </select>
      </div>

      {/* Q40 */}
      <div className="mt-6">
        <label className="font-medium block mb-1">Tenurial status of the aquafarm</label>
        <select
          id='tenureStatus'
          name="tenureStatus"
          className="border p-2 rounded w-full"
          value={form.tenureStatus || ''}
          onChange={(e) => handleChange('tenureStatus', e.target.value)}
        >
          <option value="">-- Select Status --</option>
          <option value="Owned">Owned</option>
          <option value="Lessee/Rented">Lessee/Rented</option>
          <option value="Sub-lessee">Sub-lessee</option>
          <option value="Sub-sub lessee">Sub-sub lessee</option>
          <option value="Government-owned with FLA">Government-owned with FLA</option>
          <option value="Government-owned without FLA">Government-owned without FLA</option>
          <option value="Free">Free</option>
          <option value="Government-owned with gratuitous permit">Government-owned with gratuitous permit</option>
          <option value="Government-owned with city/municipal license">Government-owned with city/municipal license</option>
          <option value="Others">Others</option>
        </select>
        {form.tenureStatus === 'Others' && (
          <input
            id='tenureOther'
            type="text"
            name="tenureOther"
            placeholder="If others, specify"
            className="border p-2 rounded w-full mt-2"
            value={form.tenureOther || ''}
            onChange={(e) => handleChange('tenureOther', e.target.value)}
          />
        )}
      </div>


      {/* Q41–42 */}
      <div className="mt-6">
        <label className="font-medium block mb-2">Aquafarm machineries, equipment/facilities</label>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <input
              name={`equipName${i}`}
              placeholder="Equipment Name"
              className="border p-2 rounded w-full"
              value={form[`equipName${i}`] || ''}
              onChange={handleChange}
            />
            <input
              name={`equipCode${i}`}
              placeholder="Code"
              className="border p-2 rounded w-20"
              value={form[`equipCode${i}`] || ''}
              onChange={handleChange}
            />
            <input
              name={`owned${i}`}
              placeholder="Owned"
              type="number"
              className="border p-2 rounded w-20"
              value={form[`owned${i}`] || ''}
              onChange={handleChange}
            />
            <input
              name={`rented${i}`}
              placeholder="Rented"
              type="number"
              className="border p-2 rounded w-20"
              value={form[`rented${i}`] || ''}
              onChange={handleChange}
            />
            <input
              name={`rentFree${i}`}
              placeholder="Rent-Free"
              type="number"
              className="border p-2 rounded w-20"
              value={form[`rentFree${i}`] || ''}
              onChange={handleChange}
            />
          </div>
        ))}
      </div>

      {/* Q43 */}
      <div className="mt-6">
        <label className="font-medium block mb-1">Continuously operating aquafarm in past 3 years?</label>
        <select
          id='continuousAquafarm'
          name="continuousAquafarm"
          className="border p-2 rounded w-full"
          value={form.continuousAquafarm || ''}
          onChange={handleChange}
        >
          <option value="">-- Select --</option>
          <option value="1">Yes</option>
          <option value="2">No</option>
        </select>
      </div>

      {/* Q44 */}
      <div className="mt-6">
        <label className="font-medium block mb-1">Aquafarm harvest trend since 2019</label>
        <select
          id='aquafarmHarvestTrend'
          name="aquafarmHarvestTrend"
          className="border p-2 rounded w-full"
          value={form.aquafarmHarvestTrend || ''}
          onChange={handleChange}
        >
          <option value="">-- Select --</option>
          <option value="Decrease">Decrease</option>
          <option value="Increase">Increase</option>
          <option value="Remain the same">Remain the same</option>
        </select>
      </div>

      {/* Q45 - Show only if Q44 answer is "1" (Decrease) */}
      {form.aquafarmHarvestTrend === 'Decrease' && (
        <div className="mt-6">
          <label className="font-medium block mb-1">Reason for harvest decrease</label>
          <select
            id='harvestDecreaseReason'
            name="harvestDecreaseReason"
            className="border p-2 rounded w-full"
            value={form.harvestDecreaseReason || ''}
            onChange={handleChange}
          >
            <option value="">-- Select --</option>
            <option value="Affected by natural calamities">Affected by natural calamities</option>
            <option value="Sudden change of weather conditions">Sudden change of weather conditions</option>
            <option value="Pollution/contamination">Pollution/contamination</option>
            <option value="Pests and diseases">Pests and diseases</option>
            <option value="High cost of material inputs">High cost of material inputs</option>
            <option value="Competition with imported species">Competition with imported species</option>
            <option value="Others">Others</option>
          </select>

          {/* If 'Others' is selected */}
          {form.harvestDecreaseReason === '9' && (
            <input
              id='harvestOther'
              name="harvestOther"
              placeholder="If others, specify"
              className="border p-2 rounded w-full mt-2"
              value={form.harvestOther || ''}
              onChange={handleChange}
            />
          )}
        </div>
      )}

      {/* Q46 */}
      <div className="mt-6">
        <label className="font-medium block mb-1">Percentage decrease in latest aquafarm harvest</label>
        <input
          id='aquafarmDecreasePercent'
          name="aquafarmDecreasePercent"
          type="number"
          className="border p-2 rounded w-full"
          value={form.aquafarmDecreasePercent || ''}
          onChange={handleChange}
        />
      </div>

      {/* Q47 */}
      <div className="mt-6">
        <label className="font-medium block mb-1">Does any member of the household use boat/vessel for fish capture?</label>
        <select
          id='usesBoat'
          name="usesBoat"
          className="border p-2 rounded w-full"
          value={form.usesBoat || ''}
          onChange={handleChange}
        >
          <option value="">-- Select --</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      </div>

      {/* Q48 */}
      <div className="mt-6">
        <label className="font-medium block mb-1">How many boats/vessels does the household use for fish capture?</label>
        <input
          id='numBoats'
          name="numBoats"
          type="number"
          className="border p-2 rounded w-full"
          value={form.numBoats || ''}
          onChange={handleChange}
        />
      </div>

      {/* Q49–50 */}
      {[...Array(3)].map((_, i) => (
        <div key={i} className="space-y-2 mt-4">
          <label className="font-medium block">Boat/Vessel {i + 1}</label>
          <select
            name={`boat${i}_owned`}
            className="border p-2 rounded w-full"
            value={form[`boat${i}_owned`] || ''}
            onChange={handleChange}
          >
            <option value="">Owned or Not Owned</option>
            <option value="Owned">Owned</option>
            <option value="Not Owned">Not Owned</option>
          </select>
          <select
            name={`boat${i}_type`}
            className="border p-2 rounded w-full"
            value={form[`boat${i}_type`] || ''}
            onChange={handleChange}
          >
            <option value="">Type</option>
            <option value="Motorized with Outrigger">Motorized with Outrigger</option>
            <option value="Motorized without Outrigger">Motorized without Outrigger</option>
            <option value="Non-motorized with Outrigger">Non-motorized with Outrigger</option>
            <option value="Non-motorized without Outrigger">Non-motorized without Outrigger</option>
          </select>
        </div>
      ))}

      {/* Q51 */}
      <div className="mt-6">
        <label className="font-medium block mb-1">Where is the fish capture operation most often performed?</label>
        <select
          id='fishCaptureLocation'
          name="fishCaptureLocation"
          className="border p-2 rounded w-full"
          value={form.fishCaptureLocation || ''}
          onChange={handleChange}
        >
          <option value="">-- Select --</option>
          <option value="In inland waters only">In inland waters only</option>
          <option value="In marine waters only">In marine waters only</option>
          <option value="In both inland and marine waters">In both inland and marine waters</option>
        </select>
      </div>

      {/* Q52 */}
      <div className="mt-6">
        <label className="font-medium block mb-1">Types of fishing gear/accessories used</label>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <input
              name={`gearName${i}`}
              placeholder="Name"
              className="border p-2 rounded w-full"
              value={form[`gearName${i}`] || ''}
              onChange={handleChange}
            />
            <input
              name={`gearCode${i}`}
              placeholder="Code"
              className="border p-2 rounded w-24"
              value={form[`gearCode${i}`] || ''}
              onChange={handleChange}
            />
          </div>
        ))}
      </div>

      {/* Q53 */}
      <div className="mt-6">
        <label className="font-medium block mb-2">Count of each gear/accessory by ownership</label>

        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <div>
              <label htmlFor={`gear${i}_owned`} className="sr-only">Gear {i + 1} Owned</label>
              <input
                id={`gear${i}_owned`}
                name={`gear${i}_owned`}
                placeholder="Owned"
                type="number"
                className="border p-2 rounded w-24"
                value={form[`gear${i}_owned`] || ''}
                onChange={handleChange}
                min={0}
              />
            </div>
            <div>
              <label htmlFor={`gear${i}_rented`} className="sr-only">Gear {i + 1} Rented</label>
              <input
                id={`gear${i}_rented`}
                name={`gear${i}_rented`}
                placeholder="Rented"
                type="number"
                className="border p-2 rounded w-24"
                value={form[`gear${i}_rented`] || ''}
                onChange={handleChange}
                min={0}
              />
            </div>
            <div>
              <label htmlFor={`gear${i}_rentFree`} className="sr-only">Gear {i + 1} Rent-Free</label>
              <input
                id={`gear${i}_rentFree`}
                name={`gear${i}_rentFree`}
                placeholder="Rent-Free"
                type="number"
                className="border p-2 rounded w-24"
                value={form[`gear${i}_rentFree`] || ''}
                onChange={handleChange}
                min={0}
              />
            </div>
            <div>
              <label htmlFor={`gear${i}_total`} className="sr-only">Gear {i + 1} Total</label>
              <input
                id={`gear${i}_total`}
                name={`gear${i}_total`}
                placeholder="Total"
                type="number"
                className="border p-2 rounded w-24"
                value={form[`gear${i}_total`] || ''}
                onChange={handleChange}
                min={0}
              />
            </div>
          </div>
        ))}
      </div>


      {/* Q54 */}
      <div className="mt-6">
        <label className="font-medium block mb-1" htmlFor='continuousFishCaptures'>Continuously operating fish capture in last 3 years?</label>
        <select
          id='continuousFishCapture'
          name="continuousFishCapture"
          className="border p-2 rounded w-full"
          value={form.continuousFishCapture || ''}
          onChange={handleChange}
        >
          <option value="">-- Select --</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      </div>

      {/* Q55 */}
      <div className="mt-6">
        <label className="font-medium block mb-1" htmlFor='fishCatchTrends'>Fish catch trend since 2019</label>
        <select
          id='fishCatchTrend'
          name="fishCatchTrend"
          className="border p-2 rounded w-full"
          value={form.fishCatchTrend || ''}
          onChange={handleChange}
        >
          <option value="">-- Select --</option>
          <option value="Decrease">Decrease</option>
          <option value="Increase">Increase</option>
          <option value="Remain the same">Remain the same</option>
        </select>
      </div>

      {/* Q56 - Show only if Q55 = "Decrease" */}
      {form.fishCatchTrend === 'Decrease' && (
        <div className="mt-6">
          <label className="font-medium block mb-1" htmlFor='fishCatchReasons'>Reason for decrease in fish catch</label>
          <select
            id='fishCatchReason'
            name="fishCatchReason"
            className="border p-2 rounded w-full"
            value={form.fishCatchReason || ''}
            onChange={handleChange}
          >
            <option value="">-- Select --</option>
            <option value="Coral bleaching">Coral bleaching</option>
            <option value="Fish kill">Fish kill</option>
            <option value="Oil spill/pollution">Oil spill/pollution</option>
            <option value="Typhoons">Typhoons</option>
            <option value="Gov’t fishing area restrictions">Gov’t fishing area restrictions</option>
            <option value="Competitio">Competition</option>
            <option value="Decrease in fish stock">Decrease in fish stock</option>
            <option value="0Fuel cost and other expenses8">Fuel cost and other expenses</option>
            <option value="Shift to other livelihood">Shift to other livelihood</option>
            <option value="Boat/vessel damage">Boat/vessel damage</option>
            <option value="Others">Others</option>
          </select>

          {/* If "Others", show text input */}
          {form.fishCatchReason === 'Others' && (
            <input  
              id='fishCatchOther'
              name="fishCatchOther"
              placeholder="If others, specify"
              className="border p-2 rounded w-full mt-2"
              value={form.fishCatchOther || ''}
              onChange={handleChange}
            />
          )}
        </div>
      )}

      {/* Q57 */}
      <div className="mt-6">
        <label className="font-medium block mb-1" >Percentage decrease in latest fish catch</label>
        <input
          id='fishCatchDecreasePercent'
          name="fishCatchDecreasePercent"
          type="number"
          className="border p-2 rounded w-full"
          value={form.fishCatchDecreasePercent || ''}
          onChange={handleChange}
        />
      </div>

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
