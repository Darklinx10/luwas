'use client';

import { useState } from 'react';
import { db } from '@/firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

export default function EducationAndLiteracy({ householdId, goToNext }) {
  const [literacy, setLiteracy] = useState('');
  const [highestGrade, setHighestGrade] = useState('');
  const [isAttendingSchool, setIsAttendingSchool] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [reasonNotAttending, setReasonNotAttending] = useState('');
  const [bachelor, setBachelor] = useState('');
  const [master, setMaster] = useState('');
  const [doctorate, setDoctorate] = useState('');
  const [isTVETGraduate, setIsTVETGraduate] = useState('');
  const [isCurrentlyInTVET, setIsCurrentlyInTVET] = useState('');
  const [tvetTrainingType, setTvetTrainingType] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = {
      literacy,
      highestGrade,
      isAttendingSchool,
      schoolName,
      gradeLevel,
      reasonNotAttending,
      bachelor,
      master,
      doctorate,
      isTVETGraduate,
      isCurrentlyInTVET,
      tvetTrainingType,
      timestamp: new Date(),
    };

    try {
      const docRef = doc(db, 'households', householdId, 'educationAndLiteracy', 'main');
      await setDoc(docRef, formData);
      toast.success('Education & Literacy info saved!');
      if (goToNext) goToNext();
    } catch (error) {
      console.error('Error saving form:', error);
      toast.error('Failed to save data.');
    }
  };

  return (
    <div className="h-full overflow-y-auto max-w-3xl mx-auto pr-2 space-y-6">

      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-green-600">For 5 year's old and over</h2>
        <label htmlFor="literacy" className="block">
          Can read and write a simple message in any language or dialect?
          <select
            id="literacy"
            name="literacy"
            value={literacy}
            onChange={(e) => setLiteracy(e.target.value)}
            className="border p-2 rounded w-full mt-1"
          >
            <option value="">Select</option>
            <option>Yes</option>
            <option>No</option>
          </select>
        </label>
      </div>

      <div className="space-y-2">
        <label htmlFor="highestGrade" className="block">
          What is the highest grade completed?
          <select
            id="highestGrade"
            name="highestGrade"
            value={highestGrade}
            onChange={(e) => setHighestGrade(e.target.value)}
            className="border p-2 rounded w-full mt-1"
          >
            <option value="">Select highest grade completed</option>
            <option>Level 1 – Primary Education (Elementary)</option>
            <option>Level 2 – Lower Secondary (Junior High School)</option>
            <option>Level 3 – Upper Secondary (Senior High School)</option>
            <option>Level 4 – Post Secondary</option>
            <option>Level 5 – Short Cycle Tertiary</option>
            <option>Level 6 – Bachelor Level Education or Equivalent</option>
            <option>Level 7 – Master Level Education or Equivalent</option>
            <option>Level 8 – Doctoral Level Education or Equivalent</option>
          </select>
        </label>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-green-600">For 3 to 24 year's old</h2>
        <label htmlFor="isAttendingSchool" className="block">
          Is currently attending school?
          <select
            id="isAttendingSchool"
            name="isAttendingSchool"
            value={isAttendingSchool}
            onChange={(e) => setIsAttendingSchool(e.target.value)}
            className="border p-2 rounded w-full mt-1"
          >
            <option value="">Select</option>
            <option>Yes</option>
            <option>No</option>
          </select>
        </label>
      </div>

      <div className="space-y-2">
        <label htmlFor="schoolName" className="block">
          In which school is currently attending?
          <select
            id="schoolName"
            name="schoolName"
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            className="border p-2 rounded w-full mt-1"
          >
            <option value="">Select school type</option>
            <option>Public</option>
            <option>Private</option>
            <option>Home School</option>
          </select>
        </label>

        <label htmlFor="gradeLevel" className="block">
          What grade or year currently attending?
          <select
            id="gradeLevel"
            name="gradeLevel"
            value={gradeLevel}
            onChange={(e) => setGradeLevel(e.target.value)}
            className="border p-2 rounded w-full mt-1"
          >
            <option value="">Select grade or year</option>
            <option>Level 1 – Primary Education (Elementary)</option>
            <option>Level 2 – Lower Secondary (Junior High School)</option>
            <option>Level 3 – Upper Secondary (Senior High School)</option>
            <option>Level 4 – Post Secondary</option>
            <option>Level 5 – Short Cycle Tertiary</option>
            <option>Level 6 – Bachelor Level Education or Equivalent</option>
            <option>Level 7 – Master Level Education or Equivalent</option>
            <option>Level 8 – Doctoral Level Education or Equivalent</option>
          </select>
        </label>
      </div>

      <div className="space-y-2">
        <label htmlFor="reasonNotAttending" className="block">
          Why is not attending school?
          <select
            id="reasonNotAttending"
            name="reasonNotAttending"
            value={reasonNotAttending}
            onChange={(e) => setReasonNotAttending(e.target.value)}
            className="border p-2 rounded w-full mt-1"
          >
            <option value="">Select reason</option>
            {[
              'Accessibility of school',
              'Disability',
              'Illness',
              'Pregnancy',
              'Financial concern',
              'Marriage',
              'Employment',
              'Finished schooling',
              'Lack of personal interest',
              'Looking for work',
              'Fear of being affected by COVID-19',
              'Too young to go to school',
              'Bullying',
              'Family matters',
              'No/weak internet connection',
              'Modular learning not preferred',
              'School requirements problem',
              'Others',
            ].map((reason, i) => (
              <option key={i}>{reason}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-green-600">For 15 year's old and over</h2>
        <label htmlFor="isTVETGraduate" className="block">
          Is a graduate of technical/vocational education and training (TVET)?
          <select
            id="isTVETGraduate"
            name="isTVETGraduate"
            value={isTVETGraduate}
            onChange={(e) => setIsTVETGraduate(e.target.value)}
            className="border p-2 rounded w-full mt-1"
          >
            <option value="">Select</option>
            <option>Yes</option>
            <option>No</option>
          </select>
        </label>

        <label htmlFor="isCurrentlyInTVET" className="block">
          Is currently attending TVET for skills development?
          <select
            id="isCurrentlyInTVET"
            name="isCurrentlyInTVET"
            value={isCurrentlyInTVET}
            onChange={(e) => setIsCurrentlyInTVET(e.target.value)}
            className="border p-2 rounded w-full mt-1"
          >
            <option value="">Select</option>
            <option>Yes</option>
            <option>No</option>
          </select>
        </label>

        <label htmlFor="tvetTrainingType" className="block">
          What skills development training have attended?
          <select
            id="tvetTrainingType"
            name="tvetTrainingType"
            value={tvetTrainingType}
            onChange={(e) => setTvetTrainingType(e.target.value)}
            className="border p-2 rounded w-full mt-1"
          >
            <option value="">Select training type</option>
            <option>Welding</option>
            <option>Carpentry</option>
            <option>Electrical Installation</option>
            <option>Computer System Servicing</option>
            <option>Housekeeping</option>
            <option>Dressmaking</option>
            <option>Automotive Servicing</option>
            <option>Driving NC II</option>
            <option>Food and Beverage Services</option>
            <option>Other</option>
          </select>
        </label>
      </div>

      <div className="pt-6">
        <button
          onClick={handleSubmit}
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
        >
          Save & Continue &gt;
        </button>
      </div>
    </div>
  );
}
