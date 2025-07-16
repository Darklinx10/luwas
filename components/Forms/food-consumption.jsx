'use client';

import React, { useState } from 'react';
import { db } from '@/firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

export default function FoodConsumption({ householdId, goToNext }) {
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    usualFoodExpenditure: '',
    occasionalFoodExpenditure: '',
    totalFoodConsumption: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const docRef = doc(db, 'households', householdId, 'foodConsumptionExpenditure', 'main');
      await setDoc(docRef, {
        ...form,
        timestamp: new Date(),
      });
      toast.success('Food Consumption saved!');
      if (goToNext) goToNext();
    } catch (error) {
      console.error('Error saving food consumption:', error);
      toast.error('Failed to save data.');
    } finally {
      setIsSaving(false); 
    }
  };

  return (
    <form onSubmit={handleSubmit} className="h-full overflow-y-auto max-w-5xl mx-auto p-4 space-y-6">
      <h2 className="text-xl text-green-700 mb-4">
        Food Consumption Expenditure (Last 12 Months)
      </h2>
      <div>
        <label htmlFor="usualFoodExpenditure" className="block mb-1">
          How much was your family’s <strong>usual or average</strong> expenditure on food?
        </label>
        <input
          type="number"
          id="usualFoodExpenditure"
          name="usualFoodExpenditure"
          value={form.usualFoodExpenditure}
          onChange={handleChange}
          placeholder="₱ Amount"
          className="border p-2 rounded w-full"
          min="0"
        />
      </div>
      <div>
        <label htmlFor="occasionalFoodExpenditure" className="block mb-1">
          How much was your family’s expenditure on <strong>occasionally consumed food items</strong>?
          <span className="block text-sm text-gray-500">e.g. every 2–3 months, semestral, yearly</span>
        </label>
        <input
          type="number"
          id="occasionalFoodExpenditure"
          name="occasionalFoodExpenditure"
          value={form.occasionalFoodExpenditure}
          onChange={handleChange}
          placeholder="₱ Amount"
          className="border p-2 rounded w-full"
          min="0"
        />
      </div>
      <div>
        <label htmlFor="totalFoodConsumption" className="block mb-1">
          What was your family’s <strong>total food consumption</strong> in the past 12 months?
        </label>
        <input
          type="number"
          id="totalFoodConsumption"
          name="totalFoodConsumption"
          value={form.totalFoodConsumption}
          onChange={handleChange}
          placeholder="₱ Total amount"
          className="border p-2 rounded w-full"
          min="0"
        />
      </div>
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
