'use client';

import { useState } from 'react';
import { db } from '@/firebase/config';
import { doc, setDoc } from 'firebase/firestore'; 
import { toast } from 'react-toastify';

// Array of food security-related questions
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

// Options for each question (dropdown choices)
const options = [
  { value: '', label: '-- Select --' },
  { value: 'yes', label: 'YES' },
  { value: 'no', label: 'NO' },
  { value: 'dont_know', label: "DON'T KNOW" },
  { value: 'prefer_not_to_answer', label: 'PREFER NOT TO ANSWER' },
];

export default function FoodSecurityExperience({ householdId, goToNext }) {
  const [isSaving, setIsSaving] = useState(false); 
  const [responses, setResponses] = useState(Array(questions.length).fill('')); // Store responses to questions

  // Handle response change for a specific question
  const handleChange = (index, value) => {
    const updated = [...responses]; // Copy previous state
    updated[index] = value;         // Update selected index
    setResponses(updated);          // Set new responses
  };

  // Handle form submission to Firestore
  const handleSubmit = async (e) => {
    e.preventDefault();   // Prevent page reload
    setIsSaving(true);    // Start loading state

    // Prepare object to store in Firestore
    const payload = {};
    responses.forEach((value, i) => {
      payload[`question_${i + 1}`] = value; // Store each answer as question_1, question_2, ...
    });

    try {
      // Reference to Firestore document
      const docRef = doc(db, 'households', householdId, 'foodSecurity', 'main');

      // Write data with timestamp
      await setDoc(docRef, {
        ...payload,
        timestamp: new Date(), // Add timestamp
      });

      // Show success message
      toast.success('Food Security saved!');

      // Go to next section if provided
      if (goToNext) goToNext();
    } catch (error) {
      // Log error to console and show toast
      console.error('Error saving food security:', error);
      toast.error('Failed to save data.');
    } finally {
      setIsSaving(false); // Reset saving state
    }
  };

  return (
  <form onSubmit={handleSubmit} className="p-6 space-y-6">
    {/* Form title */}
    <h2 className="text-xl font-bold text-green-700 mb-4">
      Food Security Experience (July 01, 2021 - June 30, 2022)
    </h2>

    {/* Loop through all food security questions */}
    {questions.map((question, index) => (
      <div key={index}>
        {/* Display question label */}
        <label className="block mb-2">
          During the past 12 months, {question}
        </label>

        {/* Dropdown for user response */}
        <select
          value={responses[index]} // Current selected response
          onChange={(e) => handleChange(index, e.target.value)} // Update corresponding index in state
          className="border p-2 rounded w-full" // Styling
          required // Make sure user selects a value
        >
          {/* Map through predefined options */}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    ))}
    
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
