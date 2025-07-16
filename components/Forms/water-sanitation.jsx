'use client';

import { useState } from 'react';
import { db } from '@/firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

export default function WaterSanitationForm({ householdId, goToNext }) {
  // State variables for water section
  const [mainWaterSource, setMainWaterSource] = useState('');
  const [waterSourceDistance, setWaterSourceDistance] = useState('');
  const [mainDrinkingWaterSource, setMainDrinkingWaterSource] = useState('');
  const [mainOtherWaterSource, setMainOtherWaterSource] = useState('');
  const [otherWaterSourceLocation, setOtherWaterSourceLocation] = useState('');
  const [waterCollectionTime, setWaterCollectionTime] = useState('');
  const [otherWaterSourceDistance, setOtherWaterSourceDistance] = useState('');
  const [waterCollector, setWaterCollector] = useState('');
  const [waterCollectionFrequency, setWaterCollectionFrequency] = useState('');
  const [insufficientWater, setInsufficientWater] = useState(null);
  const [insufficientWaterReason, setInsufficientWaterReason] = useState('');
  const [waterSafetyTreatment, setWaterSafetyTreatment] = useState('');
  const [waterTreatmentMethods, setWaterTreatmentMethods] = useState([]);

  // Sanitation
  const [toiletFacility, setToiletFacility] = useState('');
  const [septicTankOutlet, setSepticTankOutlet] = useState('');
  const [emptiedSepticTank, setEmptiedSepticTank] = useState('');
  const [emptiedLocation, setEmptiedLocation] = useState('');
  const [toiletLocation, setToiletLocation] = useState('');
  const [sharedFacility, setSharedFacility] = useState('');
  const [numHouseholdsSharing, setNumHouseholdsSharing] = useState('');
  const [sharingType, setSharingType] = useState('');
  const [garbageDisposal, setGarbageDisposal] = useState('');
  const [handwashLocation, setHandwashLocation] = useState('');
  const [otherHandwashLocation, setOtherHandwashLocation] = useState('');
  const [handwashWaterAvailable, setHandwashWaterAvailable] = useState(null);
  const [handwashSoapAvailable, setHandwashSoapAvailable] = useState('');
  const [householdHandwashWater, setHouseholdHandwashWater] = useState(null);
  const [householdSoapDetergent, setHouseholdSoapDetergent] = useState(null);
  const [shownSoap, setShownSoap] = useState(null);
  const [isSaving, setIsSaving] = useState(false);


  // Helper to toggle checkbox arrays
  const toggleSelection = (array, setArray, value) => {
    if (array.includes(value)) {
      setArray(array.filter(item => item !== value));
    } else {
      setArray([...array, value]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const payload = {
      mainWaterSource,
      waterSourceDistance,
      mainDrinkingWaterSource,
      mainOtherWaterSource,
      otherWaterSourceLocation,
      waterCollectionTime,
      otherWaterSourceDistance,
      waterCollector,
      waterCollectionFrequency,
      insufficientWater,
      insufficientWaterReason,
      waterSafetyTreatment,
      waterTreatmentMethods,

      toiletFacility,
      septicTankOutlet,
      emptiedSepticTank,
      emptiedLocation,
      toiletLocation,
      sharedFacility,
      numHouseholdsSharing,
      sharingType,
      garbageDisposal,
      handwashLocation,
      otherHandwashLocation,
      handwashWaterAvailable,
      handwashSoapAvailable,
      householdHandwashWater,
      householdSoapDetergent,
      shownSoap,

      timestamp: new Date(),
    };

    try {
      const docRef = doc(db, 'households', householdId, 'wash', 'main');
      await setDoc(docRef, payload);
      toast.success('Water & Sanitation info saved!');
      if (goToNext) goToNext();
    } catch (error) {
      console.error('Failed to save water sanitation info:', error);
      toast.error('Failed to save data.');
    } finally {
      setIsSaving(false); 
    }
  };

  // Option arrays (can be used for selects or checkboxes)
  const waterSources = [
    'Piped water into dwelling', 'Piped water to yard/plot', 'Public tap/standpipe',
    'Tube well/borehole', 'Protected dug well', 'Unprotected dug well',
    'Developed spring', 'Undeveloped spring', 'Rainwater',
    'Surface water (river, dam, lake, pond, stream, canal, irrigation channel)',
    'Bottled water', 'Other',
  ];

  const locations = ['On the premises', 'Elsewhere'];
  const yesNoDontKnow = ['YES', 'NO', "DON'T KNOW"];
  const toiletFacilities = [
    'Flush toilet (connected to sewer system)', 'Flush toilet (connected to septic tank)',
    'Flush toilet (connected to pit latrine)', 'Ventilated improved pit latrine (VIP)',
    'Pit latrine with slab', 'Pit latrine without slab/open pit', 'Composting toilet',
    'Bucket toilet', 'No facility / bush / field', 'Other',
  ];

  const septicOutlets = [
    'Sewer Lines', 'Soakage pit', 'Municipality/City Drainage',
    'Septic tank soakaway / drain field', 'Open drain / ditch',
    'Disposed in yard / field', 'No outlet or underground', 'Other',
  ];

  const waterTreatmentOptions = [
    'Boiling', 'Filtration', 'Chlorination', 'Settling', 'Solar disinfection', 'Other',
  ];

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-4 space-y-6">
      <h2 className="text-xl font-bold text-green-700">Water Supply and Sanitation</h2>

      {/* Water Source */}
      <label className="block">
        Main source of water supply:
        <select className="w-full border p-2 rounded" value={mainWaterSource} onChange={e => setMainWaterSource(e.target.value)}>
          <option value="">-- Select --</option>
          {waterSources.map(w => <option key={w} value={w}>{w}</option>)}
        </select>
      </label>

      <label className="block">
        Distance from house (meters):
        <input type="number" min="0" className="w-full border p-2 rounded" value={waterSourceDistance} onChange={e => setWaterSourceDistance(e.target.value)} />
      </label>

      <label className="block">
        Main source of drinking water:
        <select className="w-full border p-2 rounded" value={mainDrinkingWaterSource} onChange={e => setMainDrinkingWaterSource(e.target.value)}>
          <option value="">-- Select --</option>
          {waterSources.map(w => <option key={w} value={w}>{w}</option>)}
        </select>
      </label>

      <label className="block">
        Main water source for other purposes:
        <select className="w-full border p-2 rounded" value={mainOtherWaterSource} onChange={e => setMainOtherWaterSource(e.target.value)}>
          <option value="">-- Select --</option>
          {waterSources.map(w => <option key={w} value={w}>{w}</option>)}
        </select>
      </label>

      <label className="block">
        Where is that water source located?
        <select className="w-full border p-2 rounded" value={otherWaterSourceLocation} onChange={e => setOtherWaterSourceLocation(e.target.value)}>
          <option value="">-- Select --</option>
          {locations.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </label>

      <label className="block">
        Time to fetch water:
        <input className="w-full border p-2 rounded" value={waterCollectionTime} onChange={e => setWaterCollectionTime(e.target.value)} placeholder="e.g. 30 minutes" />
      </label>

      <label className="block">
        Distance from house (meters):
        <input type="number" className="w-full border p-2 rounded" value={otherWaterSourceDistance} onChange={e => setOtherWaterSourceDistance(e.target.value)} />
      </label>

      <label className="block">
        Who collects water:
        <input className="w-full border p-2 rounded" value={waterCollector} onChange={e => setWaterCollector(e.target.value)} />
      </label>

      <label className="block">
        How many times collected:
        <input type="number" className="w-full border p-2 rounded" value={waterCollectionFrequency} onChange={e => setWaterCollectionFrequency(e.target.value)} />
      </label>

      <label className="block">
        Did your household experience insufficient drinking water?
        <select className="w-full border p-2 rounded" value={insufficientWater === null ? '' : insufficientWater ? 'YES' : 'NO'} onChange={e => setInsufficientWater(e.target.value === 'YES')}>
          <option value="">-- Select --</option>
          <option value="YES">YES</option>
          <option value="NO">NO</option>
        </select>
      </label>

      {insufficientWater && (
        <label className="block">
          Reason for insufficient water:
          <input className="w-full border p-2 rounded" value={insufficientWaterReason} onChange={e => setInsufficientWaterReason(e.target.value)} />
        </label>
      )}

      <label className="block">
        Do you treat your water?
        <select className="w-full border p-2 rounded" value={waterSafetyTreatment} onChange={e => setWaterSafetyTreatment(e.target.value)}>
          <option value="">-- Select --</option>
          {yesNoDontKnow.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </label>

      {waterSafetyTreatment === 'YES' && (
        <fieldset className="border p-3 rounded">
          <legend className="font-semibold">Water Treatment Methods</legend>
          {waterTreatmentOptions.map(method => (
            <label key={method} className="block">
              <input type="checkbox" className="mr-2" checked={waterTreatmentMethods.includes(method)} onChange={() => toggleSelection(waterTreatmentMethods, setWaterTreatmentMethods, method)} />
              {method}
            </label>
          ))}
        </fieldset>
      )}

      {/* Sanitation Section (continue as needed) */}
      {/* Toilet Facility */}
      <label className="block">
        Type of toilet facility used:
        <select
          className="w-full border p-2 rounded"
          value={toiletFacility}
          onChange={e => setToiletFacility(e.target.value)}
        >
          <option value="">-- Select --</option>
          {toiletFacilities.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </label>

      {/* Septic Tank Outlet */}
      <label className="block">
        Septic tank outlet:
        <select
          className="w-full border p-2 rounded"
          value={septicTankOutlet}
          onChange={e => setSepticTankOutlet(e.target.value)}
        >
          <option value="">-- Select --</option>
          {septicOutlets.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </label>

      {/* Emptied Septic Tank */}
      <label className="block">
        Has the septic tank been emptied?
        <select
          className="w-full border p-2 rounded"
          value={emptiedSepticTank}
          onChange={e => setEmptiedSepticTank(e.target.value)}
        >
          <option value="">-- Select --</option>
          <option value="YES">YES</option>
          <option value="NO">NO</option>
          <option value="DON'T KNOW">DON'T KNOW</option>
        </select>
      </label>

      {/* Emptied Location */}
      {emptiedSepticTank === 'YES' && (
        <label className="block">
          Where was it emptied?
          <input
            className="w-full border p-2 rounded"
            value={emptiedLocation}
            onChange={e => setEmptiedLocation(e.target.value)}
          />
        </label>
      )}

      {/* Toilet Location */}
      <label className="block">
        Location of toilet facility:
        <select
          className="w-full border p-2 rounded"
          value={toiletLocation}
          onChange={e => setToiletLocation(e.target.value)}
        >
          <option value="">-- Select --</option>
          {locations.map(loc => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>
      </label>

      {/* Shared Facility */}
      <label className="block">
        Is the toilet facility shared with other households?
        <select
          className="w-full border p-2 rounded"
          value={sharedFacility}
          onChange={e => setSharedFacility(e.target.value)}
        >
          <option value="">-- Select --</option>
          <option value="YES">YES</option>
          <option value="NO">NO</option>
          <option value="DON'T KNOW">DON'T KNOW</option>
        </select>
      </label>

      {/* Number of Households Sharing */}
      {sharedFacility === 'YES' && (
        <>
          <label className="block">
            How many households share the toilet?
            <input
              type="number"
              className="w-full border p-2 rounded"
              min="1"
              value={numHouseholdsSharing}
              onChange={e => setNumHouseholdsSharing(e.target.value)}
            />
          </label>

          <label className="block">
            Type of sharing arrangement:
            <input
              className="w-full border p-2 rounded"
              value={sharingType}
              onChange={e => setSharingType(e.target.value)}
            />
          </label>
        </>
      )}

      {/* Garbage Disposal */}
      <label className="block">
        Garbage disposal method:
        <input
          className="w-full border p-2 rounded"
          value={garbageDisposal}
          onChange={e => setGarbageDisposal(e.target.value)}
        />
      </label>

      {/* Handwashing Facilities */}
      <label className="block">
        Location of handwashing facility:
        <input
          className="w-full border p-2 rounded"
          value={handwashLocation}
          onChange={e => setHandwashLocation(e.target.value)}
        />
      </label>

      <label className="block">
        If "Other", specify:
        <input
          className="w-full border p-2 rounded"
          value={otherHandwashLocation}
          onChange={e => setOtherHandwashLocation(e.target.value)}
        />
      </label>

      <label className="block">
        Is water available for handwashing?
        <select
          className="w-full border p-2 rounded"
          value={handwashWaterAvailable === null ? '' : handwashWaterAvailable ? 'YES' : 'NO'}
          onChange={e => setHandwashWaterAvailable(e.target.value === 'YES')}
        >
          <option value="">-- Select --</option>
          <option value="YES">YES</option>
          <option value="NO">NO</option>
        </select>
      </label>

      <label className="block">
        Is soap available for handwashing?
        <select
          className="w-full border p-2 rounded"
          value={handwashSoapAvailable}
          onChange={e => setHandwashSoapAvailable(e.target.value)}
        >
          <option value="">-- Select --</option>
          <option value="YES">YES</option>
          <option value="NO">NO</option>
        </select>
      </label>

      {/* Observed by Enumerator */}
      <label className="block">
        Water observed at handwashing area?
        <select
          className="w-full border p-2 rounded"
          value={householdHandwashWater === null ? '' : householdHandwashWater ? 'YES' : 'NO'}
          onChange={e => setHouseholdHandwashWater(e.target.value === 'YES')}
        >
          <option value="">-- Select --</option>
          <option value="YES">YES</option>
          <option value="NO">NO</option>
        </select>
      </label>

      <label className="block">
        Soap or detergent observed?
        <select
          className="w-full border p-2 rounded"
          value={householdSoapDetergent === null ? '' : householdSoapDetergent ? 'YES' : 'NO'}
          onChange={e => setHouseholdSoapDetergent(e.target.value === 'YES')}
        >
          <option value="">-- Select --</option>
          <option value="YES">YES</option>
          <option value="NO">NO</option>
        </select>
      </label>

      <label className="block">
        Did respondent show the soap?
        <select
          className="w-full border p-2 rounded"
          value={shownSoap === null ? '' : shownSoap ? 'YES' : 'NO'}
          onChange={e => setShownSoap(e.target.value === 'YES')}
        >
          <option value="">-- Select --</option>
          <option value="YES">YES</option>
          <option value="NO">NO</option>
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
