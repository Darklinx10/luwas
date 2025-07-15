'use client';

import { useState, useEffect } from 'react';
import { db } from '@/firebase/config';
import { doc, setDoc, getDoc, getDocs, collection } from 'firebase/firestore';
import { toast } from 'react-toastify';

export default function HealthAndMaternalInfo({ householdId, goToNext }) {
  const [isPregnantPast3Years, setIsPregnantPast3Years] = useState(false);
  const [isCurrentlyPregnant, setIsCurrentlyPregnant] = useState(false);
  const [isLactating, setIsLactating] = useState(false);
  const [hasChildMortality, setHasChildMortality] = useState(false);
  const [isCancerSurvivor, setIsCancerSurvivor] = useState(false);
  const [hasRareDisease, setHasRareDisease] = useState(false);
  const [isPWD, setIsPWD] = useState(false);
  const [illnessReported, setIllnessReported] = useState(false);
  const [treatmentAvailed, setTreatmentAvailed] = useState(false);

  const [pregnantLineNumber, setPregnantLineNumber] = useState('');
  const [numberOfPregnancies, setNumberOfPregnancies] = useState('');
  const [numberOfLiveBirths, setNumberOfLiveBirths] = useState('');
  const [firstPregnancyMonth, setFirstPregnancyMonth] = useState('');
  const [firstPregnancyYear, setFirstPregnancyYear] = useState('');
  const [currentlyPregnantLineNumber, setCurrentlyPregnantLineNumber] = useState('');
  const [lactatingLineNumber, setLactatingLineNumber] = useState('');
  const [childName, setChildName] = useState('');
  const [childAgeAtDeath, setChildAgeAtDeath] = useState('');
  const [childCauseOfDeath, setChildCauseOfDeath] = useState('');
  const [childSex, setChildSex] = useState('');
  const [rareDiseaseName, setRareDiseaseName] = useState('');
  const [rareDiseaseDescription, setRareDiseaseDescription] = useState('');
  const [hasPWDID, setHasPWDID] = useState('');
  const [pwdLineNumber, setPwdLineNumber] = useState('');
  const [isPWDIDShown, setIsPWDIDShown] = useState('');
  const [pwdDisabilityType, setPwdDisabilityType] = useState('');
  const [illnessLineNumber, setIllnessLineNumber] = useState('');
  const [illnessName, setIllnessName] = useState('');
  const [illnessAbsence, setIllnessAbsence] = useState('');
  const [illnessAbsentDays, setIllnessAbsentDays] = useState('');
  const [treatmentFacilityType, setTreatmentFacilityType] = useState('');
  const [treatmentPaymentSource, setTreatmentPaymentSource] = useState('');
  const [treatmentReason, setTreatmentReason] = useState('');
  const [diagnosedRareDisease, setDiagnosedRareDisease] = useState('');
  const [rareDiseaseUndiagnosedReason, setRareDiseaseUndiagnosedReason] = useState('');

  const [memberOptions, setMemberOptions] = useState([]);

  useEffect(() => {
    const fetchMembers = async () => {
      if (!householdId) return;
      try {
        const members = [];

        // Head
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

  const renderMemberDropdown = (value, setValue, label) => (
    <div>
      <label className="block mb-1">{label}</label>
      <select
        className="border p-2 rounded w-full"
        value={value}
        onChange={e => setValue(e.target.value)}
      >
        <option value="">-- Select Household Member --</option>
        {memberOptions.map(m => (
          <option key={m.id} value={m.id}>{m.name}</option>
        ))}
      </select>
    </div>
  );

  const handleSubmit = async () => {
     e.preventDefault(); // ✅ Prevent full page reload 
    const data = {
      isPregnantPast3Years,
      isCurrentlyPregnant,
      isLactating,
      hasChildMortality,
      isCancerSurvivor,
      hasRareDisease,
      isPWD,
      illnessReported,
      treatmentAvailed,
      pregnantLineNumber: isPregnantPast3Years ? pregnantLineNumber : null,
      numberOfPregnancies: isPregnantPast3Years ? numberOfPregnancies : null,
      numberOfLiveBirths: isPregnantPast3Years ? numberOfLiveBirths : null,
      firstPregnancyMonth: isPregnantPast3Years ? firstPregnancyMonth : null,
      firstPregnancyYear: isPregnantPast3Years ? firstPregnancyYear : null,
      currentlyPregnantLineNumber: isCurrentlyPregnant ? currentlyPregnantLineNumber : null,
      lactatingLineNumber: isLactating ? lactatingLineNumber : null,
      childName: hasChildMortality ? childName : null,
      childAgeAtDeath: hasChildMortality ? childAgeAtDeath : null,
      childCauseOfDeath: hasChildMortality ? childCauseOfDeath : null,
      childSex: hasChildMortality ? childSex : null,
      childDeathAge: hasChildMortality ? childDeathAge : null,
      childDeathCause: hasChildMortality ? childDeathCause : null,
      childDeathSex: hasChildMortality ? childDeathSex : null,
      rareDiseaseDiagnosed: hasRareDisease ? rareDiseaseDiagnosed : null,
      rareDiseaseName: hasRareDisease ? rareDiseaseName : null,
      rareDiseaseDescription: hasRareDisease ? rareDiseaseDescription : null,
      rareDiseaseReasonForNotDiagnosed: hasRareDisease ? rareDiseaseReasonForNotDiagnosed : null,
      diagnosedRareDisease: hasRareDisease ? diagnosedRareDisease : null,
      rareDiseaseUndiagnosedReason: hasRareDisease ? rareDiseaseUndiagnosedReason : null,
      hasPWDID: isPWD ? hasPWDID : null,
      pwdLineNumber: isPWD ? pwdLineNumber : null,
      isPWDIDShown: isPWD ? isPWDIDShown : null,
      pwdDisabilityType: isPWD ? pwdDisabilityType : null,
      illnessLineNumber: illnessReported ? illnessLineNumber : null,
      illnessName: illnessReported ? illnessName : null,
      illnessAbsence: illnessReported ? illnessAbsence : null,
      illnessAbsentDays: illnessReported ? illnessAbsentDays : null,
      treatmentFacilityType: treatmentAvailed ? treatmentFacilityType : null,
      treatmentPaymentSource: treatmentAvailed ? treatmentPaymentSource : null,
      treatmentReason: treatmentAvailed ? treatmentReason : null,
      timestamp: new Date(),
    };

    try {
      const docRef = doc(db, 'households', householdId, 'health', 'main');
      await setDoc(docRef, data);
      toast.success('Health Information data saved!');
      if (goToNext) goToNext();
    } catch (error) {
      console.error('Error saving health info:', error);
      toast.error('Failed to save data.');
    }
  };

  const YesNoSelect = ({ label, value, setValue }) => (
    <div>
      <label className="block mb-1">{label}</label>
      <select
        className="border p-2 rounded w-full"
        value={value ? 'YES' : value === false ? 'NO' : ''}
        onChange={e => setValue(e.target.value === 'YES')}
      >
        <option value="">-- Select --</option>
        <option value="NO">NO</option>
        <option value="YES">YES</option>
      </select>
    </div>
  );

  return (
    
      <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-6 p-4">
        <h2 className="text-lg font-semibold text-green-600">For all female household members 10 yrs old and over</h2>
        <YesNoSelect label="Are/is female HH member/s pregnant or who had been pregnant in the past 3 yrs?" value={isPregnantPast3Years} setValue={setIsPregnantPast3Years} />
        {isPregnantPast3Years && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {renderMemberDropdown(pregnantLineNumber, setPregnantLineNumber, 'Select HH member (pregnant in past 3 yrs)')}
            <div>
              <label className="block mb-1">Number of pregnancies in the last 3 yrs</label>
              <input type="number" className="border p-2 rounded w-full" placeholder="Number of pregnancies" value={numberOfPregnancies} onChange={e => setNumberOfPregnancies(e.target.value)} />
            </div>
            <div>
              <label className="block mb-1">Number of live births</label>
              <input type="number" className="border p-2 rounded w-full" placeholder="Number of live births" value={numberOfLiveBirths} onChange={e => setNumberOfLiveBirths(e.target.value)} />
            </div>
            <div>
              <label className="block mb-1">Month & Year of first pregnancy</label>
              <div className="flex gap-2">
                <input type="text" className="border p-2 rounded w-1/3" placeholder="MM" value={firstPregnancyMonth} onChange={e => setFirstPregnancyMonth(e.target.value)} />
                <input type="text" className="border p-2 rounded w-2/3" placeholder="YYYY" value={firstPregnancyYear} onChange={e => setFirstPregnancyYear(e.target.value)} />
              </div>
            </div>
          </div>
        )}
        <YesNoSelect label="Are/is female HH member/s currently pregnant?" value={isCurrentlyPregnant} setValue={setIsCurrentlyPregnant} />
        {isCurrentlyPregnant && renderMemberDropdown(currentlyPregnantLineNumber, setCurrentlyPregnantLineNumber, 'Select HH member (currently pregnant)')}
        <YesNoSelect label="Are/is female HH member/s currently lactating/breastfeeding?" value={isLactating} setValue={setIsLactating} />
        {isLactating && renderMemberDropdown(lactatingLineNumber, setLactatingLineNumber, 'Select HH member (lactating/breastfeeding)')}


        {/* Section 2: Child Mortality */}
        <h2 className="text-lg font-semibold text-green-600 pt-6">Child Mortality (for former HH members if 0-5 yrs old)</h2>
        <YesNoSelect label="Any HH members 0-5 yrs old who died (includes born alive but later died)?" value={hasChildMortality} setValue={setHasChildMortality} />
        {hasChildMortality && (
          <>
            <p className="text-sm text-gray-600 mt-2">If yes, fill the information needed:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <div>
                <label className="block mb-1">Name of child</label>
                <input type="text" placeholder="Full name of child" className="border p-2 rounded w-full" value={childName} onChange={e => setChildName(e.target.value)} />
              </div>
              <div>
                <label className="block mb-1">Age at death (in months)</label>
                <input type="number" placeholder="Age at death (in months)" className="border p-2 rounded w-full" value={childAgeAtDeath} onChange={e => setChildAgeAtDeath(e.target.value)} />
              </div>
              <div>
                <label className="block mb-1">Main cause of death</label>
                <select className="border p-2 rounded w-full" value={childCauseOfDeath} onChange={e => setChildCauseOfDeath(e.target.value)}>
                  <option value="">-- Cause of death --</option>
                  <option value="BACTERIAL SEPSIS OF NEWBORN">BACTERIAL SEPSIS OF NEWBORN</option>
                  <option value="PNEUMONIA">PNEUMONIA</option>
                  <option value="CONGENITAL MALFORMATION (HEART)">CONGENITAL MALFORMATION (HEART)</option>
                  <option value="NEONATAL ASPIRATION SYNDROME">NEONATAL ASPIRATION SYNDROME</option>
                  <option value="DIARRHEA/GASTROENTERITIS">DIARRHEA/GASTROENTERITIS</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>
              <div>
                <label className="block mb-1">Sex</label>
                <select className="border p-2 rounded w-full" value={childSex} onChange={e => setChildSex(e.target.value)}>
                  <option value="">-- Sex --</option>
                  <option value="MALE">MALE</option>
                  <option value="FEMALE">FEMALE</option>
                </select>
              </div>
            </div>
          </>
        )}

        {/* Section 3: General Health and PWD */}
        <h2 className="text-lg font-semibold text-green-600 pt-6">General Health & PWD Information</h2>
          <YesNoSelect label="Are you a cancer survivor?" value={isCancerSurvivor} setValue={setIsCancerSurvivor} />
          <YesNoSelect label="Do you have a rare disease?" value={hasRareDisease} setValue={setHasRareDisease} />
          {hasRareDisease && (
            <>
              <label className="block mb-1 mt-2">If yes, is it diagnosed by a doctor?</label>
              <select className="border p-2 rounded w-full" value={diagnosedRareDisease} onChange={e => setDiagnosedRareDisease(e.target.value)}>
                <option value="">-- Select --</option>
                <option value="YES">YES</option>
                <option value="NO">NO</option>
              </select>

              <label className="block mb-1 mt-2">Name of the rare disease</label>
              <input type="text" placeholder="Enter disease name" className="border p-2 rounded w-full" value={rareDiseaseName} onChange={e => setRareDiseaseName(e.target.value)} />

              <label className="block mb-1 mt-2">Describe the condition</label>
              <textarea placeholder="Describe the condition" className="border p-2 rounded w-full" value={rareDiseaseDescription} onChange={e => setRareDiseaseDescription(e.target.value)} />

              <label className="block mb-1 mt-2">If not diagnosed, state the main reason</label>
              <select className="border p-2 rounded w-full" value={rareDiseaseUndiagnosedReason} onChange={e => setRareDiseaseUndiagnosedReason(e.target.value)}>
                <option value="">-- Select reason --</option>
                <option value="FACILITY/DOCTOR IS FAR">FACILITY/DOCTOR IS FAR</option>
                <option value="NO MONEY FOR CONSULTATION">NO MONEY FOR CONSULTATION</option>
                <option value="WORRIED ABOUT TREATMENT COST">WORRIED ABOUT TREATMENT COST</option>
                <option value="HOME REMEDY IS AVAILABLE">HOME REMEDY IS AVAILABLE</option>
                <option value="OTHERS">OTHERS</option>
              </select>
            </>
          )}

        <label className="block mt-4 mb-1">Are you a PWD?</label>
          <select className="border p-2 rounded w-full" onChange={e => setIsPWD(e.target.value === 'YES')}>
            <option value="">-- Select --</option>
            <option>NO</option>
            <option>YES</option>
          </select>

          {isPWD && (
            <>
              <label className="block mb-1 mt-2">Is there HH members with PWD ID?</label>
              <select
                className="border p-2 rounded w-full"
                value={hasPWDID}
                onChange={e => setHasPWDID(e.target.value)}
              >
                <option value="">-- Select --</option>
                <option value="YES">YES</option>
                <option value="NO">NO</option>
              </select>

              {renderMemberDropdown(pwdLineNumber, setPwdLineNumber, "If yes, select the HH member with PWD ID")}

              <label className="block mb-1 mt-2">ID Shown?</label>
              <select
                className="border p-2 rounded w-full"
                value={isPWDIDShown}
                onChange={e => setIsPWDIDShown(e.target.value)}
              >
                <option value="">-- Select --</option>
                <option value="YES">YES</option>
                <option value="NO">NO</option>
              </select>

              <label className="block mb-1 mt-2">If ID shown, record the type of disability</label>
              <select
                className="border p-2 rounded w-full"
                value={pwdDisabilityType}
                onChange={e => setPwdDisabilityType(e.target.value)}
              >
                <option value="">-- Select type of disability --</option>
                <option>VISUAL DISABILITY</option>
                <option>DEAF OR HEARING DISABILITY</option>
                <option>INTELLECTUAL DISABILITY</option>
                <option>PHYSICAL DISABILITY</option>
                <option>MENTAL DISABILITY</option>
                <option>PSYCHOSOCIAL DISABILITY</option>
                <option>SPEECH AND LANGUAGE IMPAIRMENT</option>
                <option>LEARNING DISABILITY</option>
              </select>
            </>
          )}

        <YesNoSelect label="Any HH members get ill/sick/injured in the past month?" value={illnessReported} setValue={setIllnessReported} />
          {illnessReported && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              {renderMemberDropdown(illnessLineNumber, setIllnessLineNumber, 'Select HH member who got ill/sick/injured')}
              <div>
                <label className="block mb-1">Name of the illness/sickness/injury</label>
                <select className="border p-2 rounded w-full" value={illnessName} onChange={e => setIllnessName(e.target.value)}>
                  <option value="">-- Select illness/sickness/injury --</option>
                  <option>DIABETES</option>
                  <option>CANCER</option>
                  <option>HYPERTENSION</option>
                  <option>TUBERCULOSIS(TB)</option>
                  <option>ACUTE RESPIRATORY INFECTION</option>
                  <option>ACUTE GASTROENTERITIS</option>
                  <option>COMMON COLDS/COUGH/FLU FEVER</option>
                  <option>CUT/WOUNDS</option>
                  <option>BURN</option>
                  <option>FRACTURE/BROKEN BONE</option>
                  <option>RARE DISEASE</option>
                  <option>DISLOCATIONS/SLIPPED DISK</option>
                  <option>SURGICAL ILLNESS</option>
                  <option>COVID-19</option>
                  <option>OTHERS</option>
                </select>
              </div>
              <div>
                <label className="block mb-1">If student, did this cause absence from school or work?</label>
                <select className="border p-2 rounded w-full" value={illnessAbsence} onChange={e => setIllnessAbsence(e.target.value)}>
                  <option value="">-- Select --</option>
                  <option>YES</option>
                  <option>NO</option>
                </select>
              </div>
              <div>
                <label className="block mb-1">No. of days absent</label>
                <input type="number" className="border p-2 rounded w-full" placeholder="Number of days" value={illnessAbsentDays} onChange={e => setIllnessAbsentDays(e.target.value)} />
              </div>
            </div>
          )}

        {/* Section 4: Medical Treatment */}
        <h2 className="text-lg font-semibold text-green-600 pt-6">Availing Medical Treatment</h2>
          <YesNoSelect label="Did you avail medical treatment for your current/most recent illness/sickness/injury?" value={treatmentAvailed} setValue={setTreatmentAvailed} />
          {treatmentAvailed && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <div>
                <label className="block mb-1">If yes, select the type of medical facility</label>
                <select className="border p-2 rounded w-full" value={treatmentFacilityType} onChange={e => setTreatmentFacilityType(e.target.value)}>
                  <option value="">-- Select Facility --</option>
                  <option value="NOT MEDICAL SECTOR">NOT MEDICAL SECTOR</option>
                  <option value="ALTERNATIVE MEDICAL SECTOR">ALTERNATIVE MEDICAL SECTOR</option>
                  <option value="PUBLIC SECTOR">PUBLIC SECTOR</option>
                  <option value="PRIVATE MEDICAL SECTOR">PRIVATE MEDICAL SECTOR</option>
                </select>
              </div>

              <div>
                <label className="block mb-1">Source of payment for the treatment</label>
                <select className="border p-2 rounded w-full" value={treatmentPaymentSource} onChange={e => setTreatmentPaymentSource(e.target.value)}>
                  <option value="">-- Select Payment Source --</option>
                  <option value="SALARY OR INCOME">SALARY OR INCOME</option>
                  <option value="LOAN FROM BANKS & CREDITS">LOAN FROM BANKS & CREDITS</option>
                  <option value="SAVINGS">SAVINGS</option>
                  <option value="DONATIONS/CHARITY ASSISTANCE">DONATIONS/CHARITY ASSISTANCE</option>
                  <option value="PHILHEALTH">PHILHEALTH</option>
                  <option value="SSS/GSIS/ECC">SSS/GSIS/ECC</option>
                  <option value="OTHERS">OTHERS</option>
                </select>
              </div>

              <div>
                <label className="block mb-1">Main reason for availing the treatment</label>
                <select className="border p-2 rounded w-full" value={treatmentReason} onChange={e => setTreatmentReason(e.target.value)}>
                  <option value="">-- Select Reason --</option>
                  <option value="FACILITY IS FAR">FACILITY IS FAR</option>
                  <option value="NO MONEY">NO MONEY</option>
                  <option value="WORRIED ABOUT TREATMENT">WORRIED ABOUT TREATMENT</option>
                  <option value="HOME REMEDY IS AVAILABLE">HOME REMEDY IS AVAILABLE</option>
                  <option value="HEALTH FACILITY IS UNACCREDITED">HEALTH FACILITY IS UNACCREDITED</option>
                  <option value="SICKNESS/INJURY WILL HEAL EVENTUALLY">SICKNESS/INJURY WILL HEAL EVENTUALLY</option>
                  <option value="OTHERS">OTHERS</option>
                </select>
              </div>
            </div>
          )}
        {/* Submit Button */}
        <div className="pt-6 flex justify-end">
          <button
            type="submit"
            className="mt-4 bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 block w-full sm:w-auto cursor-pointer"
          >
            Save & Continue &gt;
          </button>
        </div>
      </form>
  );
}
