'use client';

import { useState } from 'react';
import { db } from '@/firebase/config';
import { doc, setDoc } from 'firebase/firestore';
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



  const handleSubmit = async () => {
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
          // Add missing inputs here
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
          rareDiseaseDiagnosed: hasRareDisease ? rareDiseaseDiagnosed : null,
          rareDiseaseName: hasRareDisease ? rareDiseaseName : null,
          rareDiseaseDescription: hasRareDisease ? rareDiseaseDescription : null,
          rareDiseaseReasonForNotDiagnosed: hasRareDisease ? rareDiseaseReasonForNotDiagnosed : null,
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


  return (
    
      <div className="max-w-5xl mx-auto space-y-6 p-4">
        <h2 className="text-lg font-semibold text-green-600">For all female household members 10 yrs old and over</h2>

        {/* Section 1: Maternal Health */}
        <label className="block mb-1">Are/is female HH member/s pregnant or who had been pregnant in the past 3 yrs?</label>
        <select className="border p-2 rounded w-full" onChange={e => setIsPregnantPast3Years(e.target.value === 'YES')}>
          <option value="">-- Select --</option>
          <option>NO</option>
          <option>YES</option>
        </select>

        {isPregnantPast3Years && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1">Line number of HH member</label>
              <input type="text" placeholder="Enter Line Number" className="border p-2 rounded w-full" />
            </div>
            <div>
              <label className="block mb-1">Number of pregnancies in the last 3 yrs</label>
              <input type="number" placeholder="Number of pregnancies" className="border p-2 rounded w-full" />
            </div>
            <div>
              <label className="block mb-1">Number of live births</label>
              <input type="number" placeholder="Number of live births" className="border p-2 rounded w-full" />
            </div>
            <div>
              <label className="block mb-1">Month & Year of first pregnancy</label>
              <div className="flex gap-2">
                <input type="text" placeholder="MM" className="border p-2 rounded w-1/3" />
                <input type="text" placeholder="YYYY" className="border p-2 rounded w-2/3" />
              </div>
            </div>
          </div>
        )}

        <label className="block mt-4 mb-1">Are/is female HH member/s currently pregnant?</label>
        <select className="border p-2 rounded w-full" onChange={e => setIsCurrentlyPregnant(e.target.value === 'YES')}>
          <option value="">-- Select --</option>
          <option>NO</option>
          <option>YES</option>
        </select>
        {isCurrentlyPregnant && (
          <div>
            <label className="block mb-1 mt-2">If yes, provide the line number of HH member</label>
            <input type="text" placeholder="Enter Line Number" className="border p-2 rounded w-full" />
          </div>
        )}

        <label className="block mt-4 mb-1">Are/is female HH member/s currently lactating/breastfeeding?</label>
        <select className="border p-2 rounded w-full" onChange={e => setIsLactating(e.target.value === 'YES')}>
          <option value="">-- Select --</option>
          <option>NO</option>
          <option>YES</option>
        </select>
        {isLactating && (
          <div>
            <label className="block mb-1 mt-2">If yes, provide the line number of HH member</label>
            <input type="text" placeholder="Enter Line Number" className="border p-2 rounded w-full" />
          </div>
        )}

        {/* Section 2: Child Mortality */}
        <h2 className="text-lg font-semibold text-green-600 pt-6">Child Mortality (for former HH members if 0-5 yrs old)</h2>
        <label className="block mb-1">Any HH members 0-5 yrs old who died (includes born alive but later died)?</label>
        <select className="border p-2 rounded w-full" onChange={e => setHasChildMortality(e.target.value === 'YES')}>
          <option value="">-- Select --</option>
          <option>NO</option>
          <option>YES</option>
        </select>

        {hasChildMortality && (
          <>
            <p className="text-sm text-gray-600 mt-2">If yes, fill the information needed:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <div>
                <label className="block mb-1">Name of child</label>
                <input type="text" placeholder="Full name of child" className="border p-2 rounded w-full" />
              </div>
              <div>
                <label className="block mb-1">Age at death (in months)</label>
                <input type="number" placeholder="Age at death (in months)" className="border p-2 rounded w-full" />
              </div>
              <div>
                <label className="block mb-1">Main cause of death</label>
                <select className="border p-2 rounded w-full">
                  <option value="">-- Cause of death --</option>
                  <option>BACTERIAL SEPSIS OF NEWBORN</option>
                  <option>PNEUMONIA</option>
                  <option>CONGENITAL MALFORMATION (HEART)</option>
                  <option>NEONATAL ASPIRATION SYNDROME</option>
                  <option>DIARRHEA/GASTROENTERITIS</option>
                  <option>OTHER</option>
                </select>
              </div>
              <div>
                <label className="block mb-1">Sex</label>
                <select className="border p-2 rounded w-full">
                  <option value="">-- Sex --</option>
                  <option>MALE</option>
                  <option>FEMALE</option>
                </select>
              </div>
            </div>
          </>
        )}

        {/* Section 3: General Health and PWD */}
        <h2 className="text-lg font-semibold text-green-600 pt-6">General Health & PWD Information</h2>

        <label className="block mb-1">Are you a cancer survivor?</label>
        <select className="border p-2 rounded w-full" onChange={e => setIsCancerSurvivor(e.target.value === 'YES')}>
          <option value="">-- Select --</option>
          <option>NO</option>
          <option>YES</option>
        </select>

        <label className="block mb-1 mt-4">Do you have a rare disease?</label>
        <select className="border p-2 rounded w-full" onChange={e => setHasRareDisease(e.target.value === 'YES')}>
          <option value="">-- Select --</option>
          <option>NO</option>
          <option>YES</option>
        </select>

        {hasRareDisease && (
          <>
            <label className="block mb-1 mt-2">If yes, is it diagnosed by a doctor?</label>
            <select className="border p-2 rounded w-full">
              <option>YES</option>
              <option>NO</option>
            </select>

            <label className="block mb-1 mt-2">Name of the rare disease</label>
            <input type="text" placeholder="Enter disease name" className="border p-2 rounded w-full" />

            <label className="block mb-1 mt-2">Describe the condition</label>
            <textarea placeholder="Describe the condition" className="border p-2 rounded w-full" />

            <label className="block mb-1 mt-2">If not diagnosed, state the main reason</label>
            <select className="border p-2 rounded w-full">
              <option value="">-- Select reason --</option>
              <option>FACILITY/DOCTOR IS FAR</option>
              <option>NO MONEY FOR CONSULTATION</option>
              <option>WORRIED ABOUT TREATMENT COST</option>
              <option>HOME REMEDY IS AVAILABLE</option>
              <option>OTHERS</option>
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
            <select className="border p-2 rounded w-full">
              <option>YES</option>
              <option>NO</option>
            </select>

            <label className="block mb-1 mt-2">If yes, enter their LINE NUMBER</label>
            <input type="text" placeholder="Enter LINE NUMBER of HH member" className="border p-2 rounded w-full" />

            <label className="block mb-1 mt-2">ID Shown?</label>
            <select className="border p-2 rounded w-full">
              <option>YES</option>
              <option>NO</option>
            </select>

            <label className="block mb-1 mt-2">If ID shown, record the type of disability</label>
            <select className="border p-2 rounded w-full">
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

        <label className="block mt-4 mb-1">Any HH members get ill/sick/injured in the past month?</label>
        <select className="border p-2 rounded w-full" onChange={e => setIllnessReported(e.target.value === 'YES')}>
          <option value="">-- Select --</option>
          <option>NO</option>
          <option>YES</option>
        </select>

        {illnessReported && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <div>
              <label className="block mb-1">Enter LINE NUMBER of HH member</label>
              <input type="text" className="border p-2 rounded w-full" placeholder="Enter LINE NUMBER of HH member" />
            </div>
            <div>
              <label className="block mb-1">Name of the illness/sickness/injury</label>
              <select className="border p-2 rounded w-full">
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
              <select className="border p-2 rounded w-full">
                <option>YES</option>
                <option>NO</option>
              </select>
            </div>
            <div>
              <label className="block mb-1">No. of days absent</label>
              <input type="number" className="border p-2 rounded w-full" placeholder="Number of days" />
            </div>
          </div>
        )}  

        {/* Section 4: Medical Treatment */}
        <h2 className="text-lg font-semibold text-green-600 pt-6">Availing Medical Treatment</h2>

        <label className="block mb-1">Did you avail medical treatment for your current/most recent illness/sickness/injury?</label>
        <select className="border p-2 rounded w-full" onChange={e => setTreatmentAvailed(e.target.value === 'YES')}>
          <option value="">-- Select --</option>
          <option>NO</option>
          <option>YES</option>
        </select>

        {treatmentAvailed && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <div>
              <label className="block mb-1">If yes, select the type of medical facility</label>
              <select className="border p-2 rounded w-full">
                <option value="">-- Select Facility --</option>
                <option>NOT MEDICAL SECTOR</option>
                <option>ALTERNATIVE MEDICAL SECTOR</option>
                <option>PUBLIC SECTOR</option>
                <option>PRIVATE MEDICAL SECTOR</option>
              </select>
            </div>

            <div>
              <label className="block mb-1">Source of payment for the treatment</label>
              <select className="border p-2 rounded w-full">
                <option value="">-- Select Payment Source --</option>
                <option>SALARY OR INCOME</option>
                <option>LOAN FROM BANKS & CREDITS</option>
                <option>SAVINGS</option>
                <option>DONATIONS/CHARITY ASSISTANCE</option>
                <option>PHILHEALTH</option>
                <option>SSS/GSIS/ECC</option>
                <option>OTHERS</option>
              </select>
            </div>

            <div>
              <label className="block mb-1">Main reason for availing the treatment</label>
              <select className="border p-2 rounded w-full">
                <option value="">-- Select Reason --</option>
                <option>FACILITY IS FAR</option>
                <option>NO MONEY</option>
                <option>WORRIED ABOUT TREATMENT</option>
                <option>HOME REMEDY IS AVAILABLE</option>
                <option>HEALTH FACILITY IS UNACCREDITED</option>
                <option>SICKNESS/INJURY WILL HEAL EVENTUALLY</option>
                <option>OTHERS</option>
              </select>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-6">
        <button
          type="button"
          onClick={handleSubmit}
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
        >
          Save & Continue &gt;
        </button>
      </div>
      </div>

  );
}
