'use client';

import { useState } from 'react';
import { db } from '@/firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

const questions = [
  "Was there a time when you were worried about not having enough food to eat because of a lack of money or other resources?",
  "Was there a time when you were unable to eat healthy and nutritious food because of a lack of money or other resources?",
  "Was there a time when you ate only a few kinds of food because of a lack of money or other resources?",
  "Was there a time when you had to skip a meal because there was not enough money or other resources to get food?",
  "Was there a time when you ate less than you thought you should because of a lack of money or other resources?",
  "Was there a time when your household ran out of food because of a lack of money or other resources?",
  "Was there a time when you were hungry but did not eat because there was not enough money or other resources to get food?",
  "Was there a time when you went without eating for a whole day because of a lack of money or other resources?",
];

const options = [
  { value: '', label: '-- Select --' },
  { value: 'yes', label: 'YES' },
  { value: 'no', label: 'NO' },
  { value: 'dont_know', label: "DON'T KNOW" },
  { value: 'prefer_not_to_answer', label: 'PREFER NOT TO ANSWER' },
];

export default function FoodSecurityExperience({ householdId, goToNext }) {
  const [responses, setResponses] = useState(Array(questions.length).fill(''));

  const handleChange = (index, value) => {
    const updated = [...responses];
    updated[index] = value;
    setResponses(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {};
    responses.forEach((value, i) => {
      payload[`question_${i + 1}`] = value;
    });

    try {
      const docRef = doc(db, 'households', householdId, 'foodSecurity', 'main');
      await setDoc(docRef, {
        ...payload,
        timestamp: new Date(),
      });
      toast.success('Food Security saved!');
      if (goToNext) goToNext();
    } catch (error) {
      console.error('Error saving food security:', error);
      toast.error('Failed to save data.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <h2 className="text-xl font-bold text-green-700 mb-4">
        Food Security Experience (July 01, 2021 - June 30, 2022)
      </h2>

      {questions.map((question, index) => (
        <div key={index}>
          <label className="block mb-2">
            During the past 12 months, {question}
          </label>
          <select
            value={responses[index]}
            onChange={(e) => handleChange(index, e.target.value)}
            className="border p-2 rounded w-full"
            required
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      ))}

      {/* Submit Button */}
      <div className="pt-6 flex justify-end">
        <button
          type="submit"
          className="mt-4 bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 block w-full sm:w-auto"
        >
          Save & Continue &gt;
        </button>
      </div>
    </form>
  );
}
