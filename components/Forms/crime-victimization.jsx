'use client';

import { useState } from 'react';
import { db } from '@/firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

export default function CrimeVictimizationForm({ householdId, goToNext }) {
  const [safetyLevel, setSafetyLevel] = useState('');
  const [wasVictim, setWasVictim] = useState('');
  const [crimeTypes, setCrimeTypes] = useState([]);
  const [crimeCount, setCrimeCount] = useState('');
  const [crimeLocation, setCrimeLocation] = useState('');
  const [reportedCrime, setReportedCrime] = useState('');
  const [notReportedReasons, setNotReportedReasons] = useState([]);
  const [hhVictimizedLine, setHhVictimizedLine] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const crimeOptions = [
    'THEFT (PICKPOCKETING, OTHER THEFTS)',
    'VEHICLE THEFT',
    'ROBBERY (WITH VIOLENCE)',
    'HOUSEBREAKING',
    'ASSAULT AND THREAT',
    'VANDALISM',
    'PSYCHOLOGICAL VIOLENCE (STALKING)',
    'SEXUAL OFFENSES',
    'CORRUPTION/BRIBERY',
    'OTHERS',
    'PREFER NOT TO ANSWER',
  ];

  const locationOptions = [
    'WITHIN THE BARANGAY',
    'OUTSIDE THE BARANGAY BUT WITHIN MUNICIPALITY',
    'OUTSIDE THE MUNICIPALITY BUT WITHIN PROVINCE',
    'OUTSIDE THE PROVINCE',
  ];

  const notReportedReasonsOptions = [
    'THREATENED',
    'EMBARRASSED/ASHAMED',
    'AFRAID',
    'NO FINANCIAL SUPPORT',
    'THINKS NO ONE WOULD LISTEN/BELIEVE',
    'OTHERS',
  ];

  const toggleCrimeType = (crime) => {
    setCrimeTypes((prev) =>
      prev.includes(crime) ? prev.filter((c) => c !== crime) : [...prev, crime]
    );
  };

  const toggleNotReportedReason = (reason) => {
    setNotReportedReasons((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const data = {
      safetyLevel,
      wasVictim,
      crimeTypes,
      crimeCount,
      crimeLocation,
      reportedCrime,
      notReportedReasons,
      hhVictimizedLine,
      timestamp: new Date(),
    };

    try {
      const docRef = doc(db, 'households', householdId, 'CrimeVictimization', 'main');
      await setDoc(docRef, data);
      toast.success('Crime Victimization data saved!');
      if (goToNext) goToNext();
    } catch (error) {
      console.error('Error saving data:', error);
      toast.error('Failed to save data.');
    } finally {
      setIsSaving(false); 
    }
  };


  return (
    <form onSubmit={handleSubmit}>
      <div className="max-w-4xl mx-auto p-4 space-y-6">

        {/* Safety Level */}
        <label className="block">
          Safety level in your area?
          <select
            className="w-full border p-2 rounded mt-1"
            value={safetyLevel}
            onChange={(e) => setSafetyLevel(e.target.value)}
          >
            <option value="">-- Select description --</option>
            <option>VERY SAFE</option>
            <option>SAFE</option>
            <option>SOMEWHAT UNSAFE</option>
            <option>UNSAFE</option>
            <option>DON'T KNOW</option>
          </select>
        </label>

        {/* Victim of crime? */}
        <label className="block mt-4">
          Were you a victim of crime/s in the past 12 months?
          <select
            className="w-full border p-2 rounded mt-1"
            value={wasVictim === null ? '' : wasVictim ? 'YES' : 'NO'}
            onChange={(e) => setWasVictim(e.target.value === 'YES')}
          >
            <option value="">-- Select --</option>
            <option value="YES">YES</option>
            <option value="NO">NO</option>
          </select>
        </label>

        {wasVictim && (
          <>
            {/* Crime Types */}
            <fieldset className="mt-3 border rounded p-3">
              <legend className="font-semibold">
                If yes, what crime/s were you victim of? (Check all that apply)
              </legend>
              {crimeOptions.map((crime) => (
                <label key={crime} className="block">
                  <input
                    type="checkbox"
                    checked={crimeTypes.includes(crime)}
                    onChange={() => toggleCrimeType(crime)}
                    className="mr-2"
                  />
                  {crime}
                </label>
              ))}
            </fieldset>

            {/* Number of times experienced crime */}
            <label className="block mt-3">
              Number of times you experienced crime in the past 12 months:
              <input
                type="number"
                min="0"
                className="w-full border p-2 rounded mt-1"
                value={crimeCount}
                onChange={(e) => setCrimeCount(e.target.value)}
                placeholder="Enter number"
              />
            </label>

            {/* Location of crime */}
            <label className="block mt-3">
              Recent location the crime/s happened:
              <select
                className="w-full border p-2 rounded mt-1"
                value={crimeLocation}
                onChange={(e) => setCrimeLocation(e.target.value)}
              >
                <option value="">-- Select location --</option>
                {locationOptions.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </label>

            {/* Was the crime reported? */}
            <label className="block mt-4">
              Was the crime reported to the police/barangay?
              <select
                className="w-full border p-2 rounded mt-1"
                value={reportedCrime === null ? '' : reportedCrime ? 'YES' : 'NO'}
                onChange={(e) => setReportedCrime(e.target.value === 'YES')}
              >
                <option value="">-- Select --</option>
                <option value="YES">YES</option>
                <option value="NO">NO</option>
              </select>
            </label>

            {/* If no, why not? */}
            {reportedCrime === false && (
              <fieldset className="mt-3 border rounded p-3">
                <legend className="font-semibold">
                  If no, state the reason (check all that apply):
                </legend>
                {notReportedReasonsOptions.map((reason) => (
                  <label key={reason} className="block">
                    <input
                      type="checkbox"
                      checked={notReportedReasons.includes(reason)}
                      onChange={() => toggleNotReportedReason(reason)}
                      className="mr-2"
                    />
                    {reason}
                  </label>
                ))}
              </fieldset>
            )}

            {/* Household member victimized */}
            <label className="block mt-4">
              Household member victimized by crime (if applicable). Enter LINE NUMBER of HH member:
              <input
                type="text"
                className="w-full border p-2 rounded mt-1"
                value={hhVictimizedLine}
                onChange={(e) => setHhVictimizedLine(e.target.value)}
                placeholder="Enter line number"
              />
            </label>
          </>
        )}

        {/* Submit button */}
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
      </div>
    </form>
  );
}