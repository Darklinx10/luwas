'use client';

import React, { useState } from 'react';
import { db } from '@/firebase/config';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

export default function DisasterRiskForm({ householdId, goToNext }) {
  // Local state for form fields
  const [hasKit, setHasKit] = useState('');
  const [canShowKit, setCanShowKit] = useState('');
  const [kitContents, setKitContents] = useState({});
  const [valueOfKit, setValueOfKit] = useState('');
  const [participatedDRRM, setParticipatedDRRM] = useState('');
  const [receivedInfo, setReceivedInfo] = useState('');
  const [discussedPrep, setDiscussedPrep] = useState('');
  const [knowsHotline, setKnowsHotline] = useState('');
  const [hasEvacPlan, setHasEvacPlan] = useState('');

  const [decreaseWater, setDecreaseWater] = useState('');
  const [waterReason, setWaterReason] = useState('');
  const [flooding, setFlooding] = useState('');
  const [floodHours3Years, setFloodHours3Years] = useState('');
  const [floodHours12Mos, setFloodHours12Mos] = useState('');
  const [drought, setDrought] = useState('');
  const [droughtMonths, setDroughtMonths] = useState('');
  const [knowsEvacLocation, setKnowsEvacLocation] = useState('');
  const [evacuatedPast3Years, setEvacuatedPast3Years] = useState('');
  const [evacReason, setEvacReason] = useState('');
  const [evacuatedPast12Mos, setEvacuatedPast12Mos] = useState('');
  const [evacPlace, setEvacPlace] = useState('');
  const [evacDays, setEvacDays] = useState('');
  const [hotterTemp, setHotterTemp] = useState('');
  const [brownouts, setBrownouts] = useState('');
  const [damageCost, setDamageCost] = useState('');
  const [repairCost, setRepairCost] = useState('');
  const [receivedAssistance, setReceivedAssistance] = useState('');
  const [assistanceTypes, setAssistanceTypes] = useState([]);
  const [assistanceEntities, setAssistanceEntities] = useState([]);
  const [calamities, setCalamities] = useState([]);
  const [impacts, setImpacts] = useState([]);

  // Checklists / multi-select options
  const kitItems = ['Food', 'Maintenance Medicine', 'Clothes', 'Infant needs', 'Medical Kit', 'Money (Cash)', 'Important Documents', 'Water', 'Matches/ Lighter', 'Candle', 'Battery', 'Face Masks', 'Flashlight', 'Radio', 'Whistle', 'Blanket', 'Cellphone', 'Others'];
  const assistanceOptions = ['Relief Goods', 'Livelihood', 'Financial Aid', 'Trainings', 'Others'];
  const assistanceSources = ['NGA (incl. RLA), GOCC', 'International Organization', 'LGU', 'Relative', 'Religious Group', 'Private Individual', 'Business Sector', 'Civil Society Organization', 'Others'];
  const calamityTypes = ['Typhoon', 'Landslide/Mudslide', 'Flood', 'Fire', 'Drought', 'Pandemic/Epidemic', 'Earthquake', 'Armed Conflict', 'Volcanic Eruption', 'Others'];
  const impactOptions = ['Death', 'Injuries & Illnesses', 'Damage to Property', 'Damage to Crops/Livestock/Poultry', 'Emotional/Psychological', 'Lack/Inadequate Access to Basic Service', 'Disruption in Daily Economic Activity/Work', 'Decrease in Water Supply', 'Others'];

  const [isSaving, setIsSaving] = useState(false); // 🔄 Saving state

  // Checkbox toggle utility for multi-select fields
  const toggleCheckbox = (value, list, setter) => {
    setter(list.includes(value) ? list.filter(item => item !== value) : [...list, value]);
  };

  // Toggle logic for kit items
  const toggleKitItem = (item) => {
    setKitContents(prev => ({ ...prev, [item]: !prev[item] }));
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault(); // 🔐 Prevent default form submission

    // Prepare payload
    const data = {
      hasKit,
      canShowKit,
      kitContents,
      valueOfKit,
      participatedDRRM,
      receivedInfo,
      discussedPrep,
      knowsHotline,
      hasEvacPlan,
      decreaseWater,
      waterReason,
      flooding,
      floodHours3Years,
      floodHours12Mos,
      drought,
      droughtMonths,
      knowsEvacLocation,
      evacuatedPast3Years,
      evacReason,
      evacuatedPast12Mos,
      evacPlace,
      evacDays,
      hotterTemp,
      brownouts,
      damageCost,
      repairCost,
      receivedAssistance,
      assistanceTypes,
      assistanceEntities,
      calamities,
      impacts,
      timestamp: new Date(), // Timestamp for tracking
    };

    try {
      setIsSaving(true); // Start saving state

      // Write to Firestore under household
      await setDoc(doc(db, 'households', householdId, 'climateDisasterRisk', 'main'), data);

      toast.success('Disaster Risk & Climate Change data saved!'); 
      if (goToNext) goToNext(); 
    } catch (error) {
      console.error('❌ Error saving data:', error); 
      toast.error('Failed to save data.'); 
    } finally {
      setIsSaving(false); 
    }
  };



  
  return (
    <form onSubmit={handleSubmit} className="space-y-10 max-w-5xl mx-auto p-6">
      
      {/* ==== Section 1: Climate Change and Disaster Risk Management ==== */}

      {/* Question 1 */}
      <label className="block" htmlFor='setDecreaseWater'>Did your household experience decrease in water supply in the barangay?
        <select id='setDecreaseWater' name='setDecreaseWater' className="border p-2 rounded w-full mt-1" onChange={e => setDecreaseWater(e.target.value)}>
          <option>-- Select --</option>
          <option>NO</option>
          <option>YES</option>
        </select>
      </label>

      {/* Question 1a - Conditional */}
      {decreaseWater === 'YES' && (
        <label className="block mt-2" htmlFor='setWaterReason'>Reason in decrease of water:
          <select id='setWaterReason' name='setWaterReason' className="border p-2 rounded w-full mt-1" onChange={e => setWaterReason(e.target.value)}>
            <option>-- Select reason --</option>
            <option>Climate Change</option>
            <option>Drought</option>
            <option>Deforestation</option>
            <option>Infrastructure Problem</option>
            <option>Others</option>
          </select>
        </label>
      )}

      {/* Question 2 */}
      <label className="block" htmlFor='setFlooding'>More frequent flooding?
        <select id='setFlooding' name='setFlooding' className="border p-2 rounded w-full mt-1" onChange={e => setFlooding(e.target.value)}>
          <option>-- Select --</option>
          <option>NO</option>
          <option>YES</option>
        </select>
      </label>

      {/* Question 2a and 2b - Conditional */}
      {flooding === 'YES' && (
        <>
          <label className="block mt-2" htmlFor='setFloodHours3Years'>No of hrs the flood subsided in the past 3 years:
            <input id='setFloodHours3Years' name='setFloodHours3Years' type="number" className="border p-2 rounded w-full mt-1" value={floodHours3Years} onChange={e => setFloodHours3Years(e.target.value)} placeholder="hrs" />
          </label>
          <label 
            className="block mt-2" 
            htmlFor='setFloodHours12Mos'>No of hrs the flood subsided in the past 12 months:
            <input 
              id='setFloodHours12Mos' 
              name='setFloodHours12Mos' 
              type="number" 
              className="border p-2 rounded w-full mt-1" 
              value={floodHours12Mos} 
              onChange={e => setFloodHours12Mos(e.target.value)} 
              placeholder="hrs" />
          </label>
        </>
      )}

      {/* Question 3 */}
      <label className="block" htmlFor='setDrought'>More frequent drought?
        <select 
          id='setDrought' 
          name='setDrought' 
          className="border p-2 rounded w-full mt-1" 
          onChange={e => setDrought(e.target.value)}
          >
          <option>-- Select --</option>
          <option>NO</option>
          <option>YES</option>
        </select>
      </label>

      {/* Question 3a - Conditional */}
      {drought === 'YES' && (
        <label className="block mt-2" htmlFor='setDroughtMonths'>No of months the last drought occurred in the past 3 years:
          <input 
            id='setDroughtMonths' 
            name='setDroughtMonths' 
            type="number" 
            className="border p-2 rounded w-full mt-1" 
            value={droughtMonths} 
            onChange={e => setDroughtMonths(e.target.value)} 
            placeholder="months" 
          />
        </label>
      )}

      {/* Question 4 */}
      <label className="block" htmlFor='setKnowsEvacLocation'>Do you know the location of evacuation area?
        <select 
          id='setKnowsEvacLocation'
          name='setKnowsEvacLocation'
          className="border p-2 rounded w-full mt-1" 
          onChange={e => setKnowsEvacLocation(e.target.value)}
          >
          <option>-- Select --</option>
          <option>NO</option>
          <option>YES</option>
        </select>
      </label>

      {/* Question 5 */}
      <label className="block" htmlFor='setEvacuatedPast3Years'>In the past 3 years, did your household temporarily evacuate at least once due to calamities?
        <select 
          className="border p-2 rounded w-full mt-1" 
          onChange={e => setEvacuatedPast3Years(e.target.value)}
        >
          <option>-- Select --</option>
          <option>NO</option>
          <option>YES</option>
        </select>
      </label>

      {/* Question 6 */}
      <label className="block" htmlFor='setHotterTemp'>Hotter Temperature?
        <select 
          className="border p-2 rounded w-full mt-1" 
          onChange={e => setHotterTemp(e.target.value)}
        >
          <option>-- Select --</option>
          <option>NO</option>
          <option>YES</option>
        </select>
      </label>

      {/* Question 7 */}
      <label className="block" htmlFor='setBrownouts'>More frequent brownouts?
        <select 
          id='setBrownouts' 
          name='setBrownouts' 
          className="border p-2 rounded w-full mt-1" 
          onChange={e => setBrownouts(e.target.value)}
        >
          <option>-- Select --</option>
          <option>NO</option>
          <option>YES</option>
          <option>DON'T KNOW</option>
        </select>
      </label>

      {/* Question 8 */}
      <label className="block" htmlFor='setEvacReason'>Reasons for moving out/evacuating temporarily:
        <select 
          id='setEvacReason' 
          name='setEvacReason' 
          className="border p-2 rounded w-full mt-1" 
          onChange={e => setEvacReason(e.target.value)}
        >
          <option>-- Select reason --</option>
          <option>Typhoon</option>
          <option>Flood</option>
          <option>Drought</option>
          <option>Volcanic Eruption</option>
          <option>Landslide/Mudslide</option>
          <option>Epidemic/Pandemic</option>
          <option>Armed Conflict</option>
          <option>Others</option>
        </select>
      </label>

      {/* Question 9 */}
      <label className="block" htmlFor='setEvacuatedPast12Mos'>Did your household’s last evacuation occur in the past 12 months?
        <select 
          id='setEvacuatedPast12Mos' 
          name='setEvacuatedPast12Mos' 
          className="border p-2 rounded w-full mt-1" 
          onChange={e => setEvacuatedPast12Mos(e.target.value)}
        >
          <option>-- Select --</option>
          <option>NO</option>
          <option>YES</option>
        </select>
      </label>

      {/* Question 10 */}
      <label className="block" htmlFor='setEvacPlace'>Where did you stay during last evacuation?
        <select 
          id='setEvacPlace' 
          name='setEvacPlace' 
          className="border p-2 rounded w-full mt-1" 
          onChange={e => setEvacPlace(e.target.value)}
        >
          <option>-- Select place --</option>
          <option>Church</option>
          <option>Covered Court/Gym</option>
          <option>Relative’s House</option>
          <option>Barangay Hall</option>
          <option>Dedicated Evacuation Center</option>
          <option>Others</option>
        </select>
      </label>

      {/* Question 11 */}
      <label className="block" htmlFor='setEvacDays'>No. of days household stayed in the evacuation area:
        <input 
          id='setEvacDays' 
          name='setEvacDays' 
          type="number" 
          className="border p-2 rounded w-full mt-1" 
          value={evacDays} onChange={e => setEvacDays(e.target.value)} 
          placeholder="hrs" 
        />
      </label>
 

      {/* ==== Section 2: Climate Change and Disaster Risk Management ==== */}
      
      {/* Property & Assistance */}
      <div className="pt-6 border-t">
        <h3 className="text-lg font-semibold  text-green-600">ANSWER THIS ONLY IF PROPERTY AND/OR CROPS ARE DAMAGED BY DISASTER</h3>
        <br/>
        {/* Question 12 */}
        <div className="mb-4">
          <label htmlFor="damageCost" className="block mb-2">Estimated total damage cost</label>
          <input
            type="number"
            id="damageCost"
            placeholder="Estimated total damage cost (PHP)"
            className="border px-3 py-2 rounded w-full"
            value={damageCost}
            onChange={(e) => setDamageCost(e.target.value)}
          />
        </div>

        {/* Question 13 */}
        <div className="mb-4">
          <label htmlFor="repairCost" className="block mb-2">Estimated total amount on construction/repair damages</label>
          <input
            type="number"
            id="repairCost"
            placeholder="Estimated repair/construction cost (PHP)"
            className="border px-3 py-2 rounded w-full"
            value={repairCost}
            onChange={(e) => setRepairCost(e.target.value)}
          />
        </div>

        {/* Question 14 */}
        <div className="mt-4">
          <label className="block font-medium">Did you receive any assistance?</label>
          <div className="flex gap-4 mt-1">
            <label><input type="radio" name="receivedAssistance" onChange={() => setReceivedAssistance('YES')} /> YES</label>
            <label><input type="radio" name="receivedAssistance" onChange={() => setReceivedAssistance('NO')} /> NO</label>
          </div>

          {receivedAssistance === 'YES' && (
            <>
            {/* Question 15 */}
              <div className="mt-3">
                <p className="font-medium">If yes, choose the following that applies:</p>
                <div className="grid grid-cols-2 gap-2">
                  {assistanceOptions.map((opt, i) => (
                    <label key={i}><input type="checkbox" onChange={() => toggleCheckbox(opt, assistanceTypes, setAssistanceTypes)} /> {opt}</label>
                  ))}
                </div>
              </div>
              
              {/* Question 16 */}
              <div className="mt-4">
                <p className="font-medium">Entity/ies who provided the assistance(choose all that apply)</p>
                <div className="grid grid-cols-2 gap-2">
                  {assistanceSources.map((source, i) => (
                    <label key={i}><input type="checkbox" onChange={() => toggleCheckbox(source, assistanceEntities, setAssistanceEntities)} /> {source}</label>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Calamities and Impacts */}
      {/* Question 17 */}
      <div className="pt-6 border-t">
        <h3>Check the following calamities that negatively affect your household in  past 12 mos.</h3>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {calamityTypes.map((type, i) => (
            <label key={i}><input type="checkbox" onChange={() => toggleCheckbox(type, calamities, setCalamities)} /> {type}</label>
          ))}
        </div>
      </div>

      <div className="pt-6">
        <h3 className="text-lg font-semibold text-green-600">
          CLIMATE CHANGE AND DISASTER RISK MANAGEMENT (cont)
        </h3>
        
        {/* Question 18 */}
        <label className="block mt-4 mb-2" htmlFor='impactOptions'>Impacts of calamity to your members:</label>
        <div className="grid grid-cols-2 gap-2">
          {impactOptions.map((impact, i) => (
            <label key={i} className="flex items-center gap-2">
              <input
                name='impactOptions'
                type="checkbox"
                id={`impact-${i}`}
                onChange={() => toggleCheckbox(impact, impacts, setImpacts)}
              />
              {impact}
            </label>
          ))}
        </div>
      </div>

      {/* ==== Section 3: Climate Change and Disaster Risk Management ==== */}
      
      {/* Q19 */}
      <h2 className="text-xl font-bold text-green-600">Disaster Preparedness</h2>

      <label className="block" htmlFor='setHasKit'>
        Do you have a disaster preparedness kit?
        <select
          id='setHasKit'
          name='setHasKit' 
          className="border p-2 rounded w-full mt-1" 
          onChange={e => setHasKit(e.target.value === 'YES')}
        >
          <option>-- Select --</option>
          <option>NO</option>
          <option>YES</option>
        </select>
      </label>

      {hasKit && (
        <>
        {/* Q20 */}
          <label className="block mt-2" htmlFor='setCanShowKit'>
            Can you please show your disaster preparedness kit to me?
            <select
              id='setCanShowKit'
              name='setCanShowKit' 
              className="border p-2 rounded w-full mt-1" 
              onChange={e => setCanShowKit(e.target.value === 'YES')}
            >
              <option>-- Select --</option>
              <option>NO</option>
              <option>YES</option>
            </select>
          </label>

          {/* Q21 */}
          <p className="mt-4 font-medium">What does your preparedness kit contain?</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {kitItems.map(item => (
              <label key={item} className="flex items-center space-x-2" htmlFor='kitContents'>
                <input
                  id='kitContents'
                  name='kitContents'
                  type="checkbox"
                  checked={kitContents[item] || false}
                  onChange={() => toggleKitItem(item)}
                />
                <span>{item}</span>
              </label>
            ))}
          </div>

          {/* Q22 */}
          <label className="block mt-4 mb-1" htmlFor='setValueOfKit'>How much is the actual value of the contents of the disaster preparedness kit?</label>
          <input
            id='setValueOfKit'
            name='setValueOfKit'
            type="text"
            placeholder="Estimated value of kit (₱)"
            className="border p-2 rounded w-full"
            value={valueOfKit}
            onChange={(e) => setValueOfKit(e.target.value)}
          />
        </>
      )}
      {/* Q23 */}
      <label className="block" htmlFor='setParticipatedDRRM'>
        In the past 12 months, did any member participate in crafting DRRM plan in the barangay?
        <select
          id='setParticipatedDRRM'
          name='setParticipatedDRRM' 
          className="border p-2 rounded w-full mt-1" 
          onChange={e => setParticipatedDRRM(e.target.value === 'YES')}
        >
          <option>-- Select --</option>
          <option>NO</option>
          <option>YES</option>
        </select>
      </label>

      {participatedDRRM && (
        <div className="mt-2">
          {/* Q24 */}
          <label className="block mb-1">In what ways did you or any of your household members participate in crafting the Disaster Risk Reduction Management (DRRM) plan in the barangay?</label>
          <select className="border p-2 rounded w-full">
            <option>-- Select Participation Type --</option>
            <option>Barangay DRRM Committee or Council</option>
            <option>Barangay Emergency Response Team</option>
            <option>Barangay Assembly Discussion</option>
            <option>Written Comments Provided</option>
            <option>OTHERS</option>
          </select>
        </div>
      )}

      {/* Q25 */}
      <label className="block mt-4" htmlFor='setReceivedInfo'>
        In the past 12 months, did you or any of your household member receive information from the barangay about natural disasters preparedness either through meeting or written notice/ information?
        <select 
          id='setReceivedInfo' 
          name='setReceivedInfo' 
          className="border p-2 rounded w-full mt-1" 
          onChange={e => setReceivedInfo(e.target.value === 'YES')}
        >
          <option>-- Select --</option>
          <option>NO</option>
          <option>YES</option>
        </select>
      </label>

      {/* Q26 */}
      <label className="block" htmlFor='setDiscussedPrep'>
       In the past 12 months, did you discuss with your household how to prepare for disaster?
        <select 
          id='setDiscussedPrep' 
          name='setDiscussedPrep' 
          className="border p-2 rounded w-full mt-1" 
          onChange={e => setDiscussedPrep(e.target.value === 'YES')}
        >
          <option>NO</option>
          <option>YES</option>
        </select>
      </label>

      {/* Q27 */}
      <label className="block" htmlFor='setKnowsHotline'>
        Do you know any contact number of hotlines which you can in case of emergency?
        <select
          id='setKnowsHotline'
          name='setKnowsHotline' 
          className="border p-2 rounded w-full mt-1" 
          onChange={e => setKnowsHotline(e.target.value === 'YES')}
        >
          <option>-- Select --</option>
          <option>NO</option>
          <option>YES</option>
        </select>
      </label>

      {/* Q28 */}
      <label className="block" htmlFor='setHasEvacPlan'>
        Does your household have a written or printed evacuation plan in case of earthquake, flood, landslide, tsunami, strom surge, or fire?
        <select
          id='setHasEvacPlan'
          name='setHasEvacPlan' 
          className="border p-2 rounded w-full mt-1" 
          onChange={e => setHasEvacPlan(e.target.value === 'YES')}
        >
          <option>-- Select --</option>
          <option>NO</option>
          <option>YES</option>
        </select>
      </label>
      
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
