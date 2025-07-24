'use client';

import { useState, useEffect } from 'react';
import { db } from '@/firebase/config';
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
} from 'firebase/firestore';
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

  // Sanitation section state
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
  const [memberOptions, setMemberOptions] = useState([]);


  // Helper to toggle checkbox arrays
  const toggleSelection = (array, setArray, value) => {
    if (array.includes(value)) {
      setArray(array.filter(item => item !== value));
    } else {
      setArray([...array, value]);
    }
  };

  //form submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    // Bundle form values into one object
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
  
  //Fetch member options for water collector dropdown
  useEffect(() => {
      const fetchMembers = async () => {
        if (!householdId) return;
        try {
          const members = [];

          // Get household head from geographicIdentification/main
     //     const geoSnap = await getDoc(doc(db, 'households', householdId, 'geographicIdentification', 'main'));
     //     if (geoSnap.exists()) {
      //      const geo = geoSnap.data();
      //      const name = `${geo.headFirstName || ''} ${geo.headMiddleName || ''} ${geo.headLastName || ''}`.trim();
     //       members.push({ id: 'head', name });
      //    }

          // Get all household members
          const memSnap = await getDocs(collection(db, 'households', householdId, 'members'));
          const memberPromises = memSnap.docs.map(async (mem) => {
            const memId = mem.id;
            const demoSnap = await getDocs(
              collection(db, 'households', householdId, 'members', memId, 'demographicCharacteristics')
            );
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

    {/* Q1 - Main source of water supply */}
    <label htmlFor='mainWaterSource' className="block">
      Main source of water supply:
      <select
        id='mainWaterSource'
        name='mainWaterSource' 
        className="w-full border p-2 rounded" 
        value={mainWaterSource} 
        onChange={e => setMainWaterSource(e.target.value)}
      >
        <option value="">-- Select --</option>
        {waterSources.map(w => <option key={w} value={w}>{w}</option>)}
      </select>
    </label>

    {/* Q2 - Distance from house */}
    <label htmlFor='waterSourceDistance' className="block">
      Distance from house (meters):
      <input
        id='waterSourceDistance'
        name='waterSourceDistance'
        type="number" 
        min="0" 
        className="w-full border p-2 rounded" 
        value={waterSourceDistance} 
        onChange={e => setWaterSourceDistance(e.target.value)} 
      />
    </label>

    {/* Q3 - Main source of drinking water */}
    <label htmlFor='mainDrinkingWaterSource' className="block">
      Main source of drinking water:
      <select
        id='mainDrinkingWaterSource'
        name='mainDrinkingWaterSource' 
        className="w-full border p-2 rounded" 
        value={mainDrinkingWaterSource} 
        onChange={e => setMainDrinkingWaterSource(e.target.value)}
      >
        <option value="">-- Select --</option>
        {waterSources.map(w => <option key={w} value={w}>{w}</option>)}
      </select>
    </label>

    {/* Q4 - Main water source for other purposes */}
    <label htmlFor='mainOtherWaterSource' className="block">
      Main water source for other purposes:
      <select
        id='mainOtherWaterSource'
        name='mainOtherWaterSource' 
        className="w-full border p-2 rounded" 
        value={mainOtherWaterSource} 
        onChange={e => setMainOtherWaterSource(e.target.value)}
      >
        <option value="">-- Select --</option>
        {waterSources.map(w => <option key={w} value={w}>{w}</option>)}
      </select>
    </label>

    {/* Q5 - Other water source location */}
    <label htmlFor='otherWaterSourceLocation' className="block">
      Where is that water source located?
      <select
        id='otherWaterSourceLocation'
        name='otherWaterSourceLocation'
        className="w-full border p-2 rounded" 
        value={otherWaterSourceLocation} 
        onChange={e => setOtherWaterSourceLocation(e.target.value)}
      >
        <option value="">-- Select --</option>
        {locations.map(l => <option key={l} value={l}>{l}</option>)}
      </select>
    </label>

    {/* Q6 - Time to fetch water */}
    <label htmlFor='waterCollectionTime' className="block">
      Time to fetch water:
      <input
        id='waterCollectionTime'
        name='waterCollectionTime' 
        className="w-full border p-2 rounded" 
        value={waterCollectionTime} 
        onChange={e => setWaterCollectionTime(e.target.value)} 
        placeholder="e.g. 30 minutes" 
      />
    </label>

    {/* Q7 - Distance from house (other) */}
    <label htmlFor='otherWaterSourceDistance' className="block">
      Distance from house (meters):
      <input
        id='otherWaterSourceDistance'
        name='otherWaterSourceDistance' 
        type="number" 
        className="w-full border p-2 rounded" 
        value={otherWaterSourceDistance} 
        onChange={e => setOtherWaterSourceDistance(e.target.value)} 
      />
    </label>

    {/* Q8 - Who collects water */}
    <label htmlFor='waterCollector' className="block mb-1 font-medium">Who collects water:</label>
    <select
      id='waterCollector'
      name='waterCollector' 
      className="w-full border p-2 rounded" 
      value={waterCollector} 
      onChange={(e) => setWaterCollector(e.target.value)}
    >
      <option value="">-- Select Member --</option>
      {memberOptions.map((member) => (
        <option key={member.id} value={member.name}>{member.name}</option>
      ))}
    </select>

    {/* Q9 - Water collection frequency */}
    <label htmlFor='waterCollectionFrequency' className="block">
      How many times collected:
      <input
        id='waterCollectionFrequency'
        name='waterCollectionFrequency' 
        type="number" 
        className="w-full border p-2 rounded" 
        value={waterCollectionFrequency} 
        onChange={e => setWaterCollectionFrequency(e.target.value)} 
      />
    </label>

    {/* Q10 - Experience insufficient drinking water */}
    <label htmlFor='insufficientWater' className="block">
      Did your household experience insufficient drinking water?
      <select
        id='insufficientWater'
        name='insufficientWater' 
        className="w-full border p-2 rounded" 
        value={insufficientWater === null ? '' : insufficientWater ? 'YES' : 'NO'} 
        onChange={e => setInsufficientWater(e.target.value === 'YES')}
      >
        <option value="">-- Select --</option>
        <option value="YES">YES</option>
        <option value="NO">NO</option>
      </select>
    </label>

    {/* Q11 - Reason for insufficient water */}
    {insufficientWater && (
      <label htmlFor='insufficientWaterReason' className="block">
        Reason for insufficient water:
        <input
          id='insufficientWaterReason'
          name='insufficientWaterReason' 
          className="w-full border p-2 rounded" 
          value={insufficientWaterReason} 
          onChange={e => setInsufficientWaterReason(e.target.value)} 
        />
      </label>
    )}

    {/* Q12 - Do you treat water */}
    <label htmlFor='waterSafetyTreatment' className="block">
      Do you treat your water?
      <select
        id='waterSafetyTreatment'
        name='waterSafetyTreatment'
        className="w-full border p-2 rounded" 
        value={waterSafetyTreatment} 
        onChange={e => setWaterSafetyTreatment(e.target.value)}
      >
        <option value="">-- Select --</option>
        {yesNoDontKnow.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </label>

    {/* Q13 - Water treatment methods */}
    {waterSafetyTreatment === 'YES' && (
      <fieldset className="border p-3 rounded">
        <legend className="font-semibold">Water Treatment Methods</legend>
        {waterTreatmentOptions.map(method => (
          <label htmlFor='waterTreatmentMethods' key={method} className="block">
            <input
              id='waterTreatmentMethods'
              name='waterTreatmentMethods' 
              type="checkbox" 
              className="mr-2" 
              checked={waterTreatmentMethods.includes(method)} 
              onChange={() => toggleSelection(waterTreatmentMethods, setWaterTreatmentMethods, method)} 
            />
            {method}
          </label>
        ))}
      </fieldset>
    )}

    {/* Q14 - Toilet Facility */}
    <label htmlFor='toiletFacility' className="block">
      Type of toilet facility used:
      <select
        id='toiletFacility'
        name='toiletFacility' 
        className="w-full border p-2 rounded" 
        value={toiletFacility} 
        onChange={e => setToiletFacility(e.target.value)}
      >
        <option value="">-- Select --</option>
        {toiletFacilities.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </label>

    {/* Q15 - Septic Tank Outlet */}
    <label htmlFor='septicTankOutlet' className="block">
      Septic tank outlet:
      <select
        id='septicTankOutlet'
        name='septicTankOutlet' 
        className="w-full border p-2 rounded" 
        value={septicTankOutlet} 
        onChange={e => setSepticTankOutlet(e.target.value)}
      >
        <option value="">-- Select --</option>
        {septicOutlets.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </label>

    {/* Q16 - Emptied Septic Tank */}
    <label htmlFor='emptiedSepticTank' className="block">
      Has the septic tank been emptied?
      <select
        id='emptiedSepticTank'
        name='emptiedSepticTank'
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

    {/* Q17 - Where was it emptied */}
    {emptiedSepticTank === 'YES' && (
      <label htmlFor='emptiedLocation' className="block">
        Where was it emptied?
        <input
          id='emptiedLocation'
          name='emptiedLocation' 
          className="w-full border p-2 rounded" 
          value={emptiedLocation} 
          onChange={e => setEmptiedLocation(e.target.value)} 
        />
      </label>
    )}

    {/* Q18 - Toilet location */}
    <label htmlFor='toiletLocation' className="block">
      Location of toilet facility:
      <select
        id='toiletLocation'
        name='toiletLocation' 
        className="w-full border p-2 rounded" 
        value={toiletLocation} 
        onChange={e => setToiletLocation(e.target.value)}
      >
        <option value="">-- Select --</option>
        {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
      </select>
    </label>

    {/* Q19 - Shared facility */}
    <label htmlFor='sharedFacility' className="block">
      Is the toilet facility shared with other households?
      <select
        id='sharedFacility'
        name='sharedFacility' 
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

    {/* Q20 - Households sharing & type of sharing */}
    {sharedFacility === 'YES' && (
      <>
        <label htmlFor='numHouseholdsSharing' className="block">
          How many households share the toilet?
          <input
            id='numHouseholdsSharing'
            name='numHouseholdsSharing' 
            type="number" 
            className="w-full border p-2 rounded" 
            min="1" value={numHouseholdsSharing} 
            onChange={e => setNumHouseholdsSharing(e.target.value)} 
          />
        </label>

        <label htmlFor='sharingType' className="block">
          Type of sharing arrangement:
          <input
            id='sharingType'
            name='sharingType' 
            className="w-full border p-2 rounded" 
            value={sharingType} 
            onChange={e => setSharingType(e.target.value)} 
          />
        </label>
      </>
    )}

    {/* Q21 - Garbage Disposal */}
    <label htmlFor='garbageDisposal' className="block">
      Garbage disposal method:
      <input
        id='garbageDisposal'
        name='garbageDisposal' 
        className="w-full border p-2 rounded" 
        value={garbageDisposal} 
        onChange={e => setGarbageDisposal(e.target.value)} 
      />
    </label>

    {/* Q22 - Handwashing Facility Location */}
    <label htmlFor='handwashLocation' className="block">
      Location of handwashing facility:
      <input
        id='handwashLocation'
        name='handwashLocation' 
        className="w-full border p-2 rounded" 
        value={handwashLocation} 
        onChange={e => setHandwashLocation(e.target.value)} 
      />
    </label>

    {/* Q23 - Other Handwashing Location */}
    <label htmlFor='otherHandwashLocation' className="block">
      If "Other", specify:
      <input 
        id='otherHandwashLocation'
        name='otherHandwashLocation'
        className="w-full border p-2 rounded" 
        value={otherHandwashLocation} 
        onChange={e => setOtherHandwashLocation(e.target.value)} 
      />
    </label>

    {/* Q24 - Water available for handwashing */}
    <label htmlFor='handwashWaterAvailable' className="block">
      Is water available for handwashing?
      <select
        id='handwashWaterAvailable'
        name='handwashWaterAvailable' 
        className="w-full border p-2 rounded" 
        value={handwashWaterAvailable === null ? '' : handwashWaterAvailable ? 'YES' : 'NO'} 
        onChange={e => setHandwashWaterAvailable(e.target.value === 'YES')}
      >
        <option value="">-- Select --</option>
        <option value="YES">YES</option>
        <option value="NO">NO</option>
      </select>
    </label>

    {/* Q25 - Soap available for handwashing */}
    <label htmlFor='handwashSoapAvailable' className="block">
      Is soap available for handwashing?
      <select
        id='handwashSoapAvailable'
        name='handwashSoapAvailable' 
        className="w-full border p-2 rounded" 
        value={handwashSoapAvailable} 
        onChange={e => setHandwashSoapAvailable(e.target.value)}
      >
        <option value="">-- Select --</option>
        <option value="YES">YES</option>
        <option value="NO">NO</option>
      </select>
    </label>

    {/* Q26 - Water observed at handwashing area */}
    <label htmlFor='householdHandwashWater' className="block">
      Water observed at handwashing area?
      <select
        id='householdHandwashWater'
        name='householdHandwashWater' 
        className="w-full border p-2 rounded" 
        value={householdHandwashWater === null ? '' : householdHandwashWater ? 'YES' : 'NO'} 
        onChange={e => setHouseholdHandwashWater(e.target.value === 'YES')}
      >
        <option value="">-- Select --</option>
        <option value="YES">YES</option>
        <option value="NO">NO</option>
      </select>
    </label>

    {/* Q27 - Soap observed */}
    <label htmlFor='householdSoapDetergent' className="block">
      Soap or detergent observed?
      <select
        id='householdSoapDetergent'
        name='householdSoapDetergent' 
        className="w-full border p-2 rounded" 
        value={householdSoapDetergent === null ? '' : householdSoapDetergent ? 'YES' : 'NO'} 
        onChange={e => setHouseholdSoapDetergent(e.target.value === 'YES')}
      >
        <option value="">-- Select --</option>
        <option value="YES">YES</option>
        <option value="NO">NO</option>
      </select>
    </label>

    {/* Q28 - Respondent showed the soap */}
    <label htmlFor='shownSoap' className="block">
      Did respondent show the soap?
      <select
        id='shownSoap'
        name='shownSoap' 
        className="w-full border p-2 rounded" 
        value={shownSoap === null ? '' : shownSoap ? 'YES' : 'NO'} 
        onChange={e => setShownSoap(e.target.value === 'YES')}
      >
        <option value="">-- Select --</option>
        <option value="YES">YES</option>
        <option value="NO">NO</option>
      </select>
    </label>

    {/* Submit button */}
    <div className="pt-6 flex justify-end">
      <button
        type="submit"
        className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 cursor-pointer flex items-center gap-2 disabled:opacity-50"
        disabled={isSaving}
      >
        {isSaving ? (
          <>
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
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
