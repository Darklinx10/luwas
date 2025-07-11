'use client';

import React, { useState } from 'react';
import { db } from '@/firebase/config';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

export default function DisasterRiskForm({ householdId, goToNext }) {
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

  const kitItems = ['Food', 'Maintenance Medicine', 'Clothes', 'Infant needs', 'Medical Kit', 'Money (Cash)', 'Important Documents', 'Water', 'Matches/ Lighter', 'Candle', 'Battery', 'Face Masks', 'Flashlight', 'Radio', 'Whistle', 'Blanket', 'Cellphone', 'Others'];
  const assistanceOptions = ['Relief Goods', 'Livelihood', 'Financial Aid', 'Trainings', 'Others'];
  const assistanceSources = ['NGA (incl. RLA), GOCC', 'International Organization', 'LGU', 'Relative', 'Religious Group', 'Private Individual', 'Business Sector', 'Civil Society Organization', 'Others'];
  const calamityTypes = ['Typhoon', 'Landslide/Mudslide', 'Flood', 'Fire', 'Drought', 'Pandemic/Epidemic', 'Earthquake', 'Armed Conflict', 'Volcanic Eruption', 'Others'];
  const impactOptions = ['Death', 'Injuries & Illnesses', 'Damage to Property', 'Damage to Crops/Livestock/Poultry', 'Emotional/Psychological', 'Lack/Inadequate Access to Basic Service', 'Disruption in Daily Economic Activity/Work', 'Decrease in Water Supply', 'Others'];

  const toggleCheckbox = (value, list, setter) => {
    setter(list.includes(value) ? list.filter(item => item !== value) : [...list, value]);
  };

  const toggleKitItem = (item) => {
    setKitContents(prev => ({ ...prev, [item]: !prev[item] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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
      timestamp: new Date(),
    };

    try {
      await setDoc(doc(db, 'households', householdId, 'climateDisasterRisk', 'main'), data);
      toast.success('Disaster Risk & Climate Change data saved!');
      if (goToNext) goToNext();
    } catch (error) {
      console.error('Error saving data:', error);
      toast.error('Failed to save data.');
    }
  };  


  
  return (
    <form onSubmit={handleSubmit} className="space-y-10 max-w-5xl mx-auto p-6">

      {/* ==== Section 1: Disaster Preparedness ==== */}
      <h2 className="text-xl font-bold text-green-600">Disaster Preparedness</h2>

      <label className="block">
        Do you have a disaster preparedness kit?
        <select className="border p-2 rounded w-full mt-1" onChange={e => setHasKit(e.target.value === 'YES')}>
          <option>-- Select --</option>
          <option>NO</option>
          <option>YES</option>
        </select>
      </label>

      {hasKit && (
        <>
          <label className="block mt-2">
            Can you please show your disaster preparedness kit to me?
            <select className="border p-2 rounded w-full mt-1" onChange={e => setCanShowKit(e.target.value === 'YES')}>
              <option>-- Select --</option>
              <option>NO</option>
              <option>YES</option>
            </select>
          </label>

          <p className="mt-4 font-medium">What does your preparedness kit contain?</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {kitItems.map(item => (
              <label key={item} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={kitContents[item] || false}
                  onChange={() => toggleKitItem(item)}
                />
                <span>{item}</span>
              </label>
            ))}
          </div>

          <label className="block mt-4 mb-1">How much is the actual value of the contents of the disaster preparedness kit?</label>
          <input
            type="number"
            placeholder="Estimated value of kit (₱)"
            className="border p-2 rounded w-full"
            value={valueOfKit}
            onChange={(e) => setValueOfKit(e.target.value)}
          />
        </>
      )}

      <label className="block">
        In the past 12 months, did any member participate in crafting DRRM plan in the barangay?
        <select className="border p-2 rounded w-full mt-1" onChange={e => setParticipatedDRRM(e.target.value === 'YES')}>
          <option>-- Select --</option>
          <option>NO</option>
          <option>YES</option>
        </select>
      </label>

      {participatedDRRM && (
        <div className="mt-2">
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


      <label className="block mt-4">
        In the past 12 months, did you or any of your household member receive information from the barangay about natural disasters preparedness either through meeting or written notice/ information?
        <select className="border p-2 rounded w-full mt-1" onChange={e => setReceivedInfo(e.target.value === 'YES')}>
          <option>-- Select --</option>
          <option>NO</option>
          <option>YES</option>
        </select>
      </label>

      <label className="block">
       In the past 12 months, did you discuss with your household how to prepare for disaster?
        <select className="border p-2 rounded w-full mt-1" onChange={e => setDiscussedPrep(e.target.value === 'YES')}>
          <option>NO</option>
          <option>YES</option>
        </select>
      </label>

      <label className="block">
        Do you know any contact number of hotlines which you can in case of emergency?
        <select className="border p-2 rounded w-full mt-1" onChange={e => setKnowsHotline(e.target.value === 'YES')}>
          <option>-- Select --</option>
          <option>NO</option>
          <option>YES</option>
        </select>
      </label>

      <label className="block">
        Does your household have a written or printed evacuation plan in case of earthquake, flood, landslide, tsunami, strom surge, or fire?
        <select className="border p-2 rounded w-full mt-1" onChange={e => setHasEvacPlan(e.target.value === 'YES')}>
          <option>-- Select --</option>
          <option>NO</option>
          <option>YES</option>
        </select>
      </label>



      {/* ==== Section 2: Climate Change and Disaster Risk Management ==== */}
      
      <div className="pt-8 border-t">
        <h2 className="text-xl font-bold text-green-600">Climate Change and Disaster Risk Management</h2>
      </div>

      
      {/* Water Supply */}
      <label className="block">Did your household experience decrease in water supply in the barangay?
        <select className="border p-2 rounded w-full mt-1" onChange={e => setDecreaseWater(e.target.value)}>
          <option>-- Select --</option>
          <option>NO</option>
          <option>YES</option>
        </select>
      </label>

      {decreaseWater === 'YES' && (
        <label className="block mt-2">Reason in decrease of water:
          <select className="border p-2 rounded w-full mt-1" onChange={e => setWaterReason(e.target.value)}>
            <option>-- Select reason --</option>
            <option>Climate Change</option>
            <option>Drought</option>
            <option>Deforestation</option>
            <option>Infrastructure Problem</option>
            <option>Others</option>
          </select>
        </label>
      )}

      <label className="block">More frequent flooding?
        <select className="border p-2 rounded w-full mt-1" onChange={e => setFlooding(e.target.value)}>
          <option>-- Select --</option>
          <option>NO</option>
          <option>YES</option>
        </select>
      </label>

      {flooding === 'YES' && (
        <>
          <label className="block mt-2">No of hrs the flood subsided in the past 3 years:
            <input type="number" className="border p-2 rounded w-full mt-1" value={floodHours3Years} onChange={e => setFloodHours3Years(e.target.value)} placeholder="hrs" />
          </label>
          <label className="block mt-2">No of hrs the flood subsided in the past 12 months:
            <input type="number" className="border p-2 rounded w-full mt-1" value={floodHours12Mos} onChange={e => setFloodHours12Mos(e.target.value)} placeholder="hrs" />
          </label>
        </>
      )}

      <label className="block">More frequent drought?
        <select className="border p-2 rounded w-full mt-1" onChange={e => setDrought(e.target.value)}>
          <option>-- Select --</option>
          <option>NO</option>
          <option>YES</option>
        </select>
      </label>

      {drought === 'YES' && (
        <label className="block mt-2">No of months the last drought occurred in the past 3 years:
          <input type="number" className="border p-2 rounded w-full mt-1" value={droughtMonths} onChange={e => setDroughtMonths(e.target.value)} placeholder="months" />
        </label>
      )}

      <label className="block">Do you know the location of evacuation area?
        <select className="border p-2 rounded w-full mt-1" onChange={e => setKnowsEvacLocation(e.target.value)}>
          <option>-- Select --</option>
          <option>NO</option>
          <option>YES</option>
        </select>
      </label>

      <label className="block">In the past 3 years, did your household temporarily evacuate at least once due to calamities?
        <select className="border p-2 rounded w-full mt-1" onChange={e => setEvacuatedPast3Years(e.target.value)}>
          <option>-- Select --</option>
          <option>NO</option>
          <option>YES</option>
        </select>
      </label>

      <label className="block">Hotter Temperature?
        <select className="border p-2 rounded w-full mt-1" onChange={e => setHotterTemp(e.target.value)}>
          <option>-- Select --</option>
          <option>NO</option>
          <option>YES</option>
        </select>
      </label>

      <label className="block">More frequent brownouts?
        <select className="border p-2 rounded w-full mt-1" onChange={e => setBrownouts(e.target.value)}>
          <option>-- Select --</option>
          <option>NO</option>
          <option>YES</option>
          <option>DON'T KNOW</option>
        </select>
      </label>

      <label className="block">Reasons for moving out/evacuating temporarily:
        <select className="border p-2 rounded w-full mt-1" onChange={e => setEvacReason(e.target.value)}>
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

      <label className="block">Did your household’s last evacuation occur in the past 12 months?
        <select className="border p-2 rounded w-full mt-1" onChange={e => setEvacuatedPast12Mos(e.target.value)}>
          <option>-- Select --</option>
          <option>NO</option>
          <option>YES</option>
        </select>
      </label>

      <label className="block">Where did you stay during last evacuation?
        <select className="border p-2 rounded w-full mt-1" onChange={e => setEvacPlace(e.target.value)}>
          <option>-- Select place --</option>
          <option>Church</option>
          <option>Covered Court/Gym</option>
          <option>Relative’s House</option>
          <option>Barangay Hall</option>
          <option>Dedicated Evacuation Center</option>
          <option>Others</option>
        </select>
      </label>

      <label className="block">No. of days household stayed in the evacuation area:
        <input type="number" className="border p-2 rounded w-full mt-1" value={evacDays} onChange={e => setEvacDays(e.target.value)} placeholder="hrs" />
      </label>


      {/* ==== Section 3: Climate Change and Disaster Risk Management ==== */}
      
      {/* Property & Assistance */}
      <div className="pt-6 border-t">
        <h3 className="text-lg font-semibold  text-green-600">ANSWER THIS ONLY IF PROPERTY AND/OR CROPS ARE DAMAGED BY DISASTER</h3>
        <br/>
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

        <div className="mt-4">
          <label className="block font-medium">Did you receive any assistance?</label>
          <div className="flex gap-4 mt-1">
            <label><input type="radio" name="receivedAssistance" onChange={() => setReceivedAssistance('YES')} /> YES</label>
            <label><input type="radio" name="receivedAssistance" onChange={() => setReceivedAssistance('NO')} /> NO</label>
          </div>

          {receivedAssistance === 'YES' && (
            <>
              <div className="mt-3">
                <p className="font-medium">If yes, choose the following that applies:</p>
                <div className="grid grid-cols-2 gap-2">
                  {assistanceOptions.map((opt, i) => (
                    <label key={i}><input type="checkbox" onChange={() => toggleCheckbox(opt, assistanceTypes, setAssistanceTypes)} /> {opt}</label>
                  ))}
                </div>
              </div>

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

        <label className="block mt-4 mb-2">Impacts of calamity to your members:</label>
        <div className="grid grid-cols-2 gap-2">
          {impactOptions.map((impact, i) => (
            <label key={i} className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`impact-${i}`}
                onChange={() => toggleCheckbox(impact, impacts, setImpacts)}
              />
              {impact}
            </label>
          ))}
        </div>
      </div>


      <div className="pt-6">
        <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
          Save & Continue &gt;
        </button>
      </div>
    </form>
  );
}
