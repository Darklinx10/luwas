'use client';

import React, { useState } from 'react';
import { db } from '@/firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid'; // ✅ Import UUID


export default function Entrepreneurship({ householdId, goToNext }) {
  // State to track saving and form data
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    homeConsumption: '',                      // Q1: Products/services for home use
    sustenanceActivities: '',                 // Q2: Activities for basic sustenance
    entrepreneurialActivities: '',            // Q3: Entrepreneurial work
    specificPSIC: '',                          // Q4: General PSIC category
    specificPSICs: [                           // Q5: Multiple PSIC entries
      {
        id: uuidv4(),                          // Unique ID for list rendering
        value: '',                             // Business name or description
        psicCode: '',                          // PSIC code
        useEcommerce: '',                      // Uses e-commerce?
        useSocialMedia: '',                    // Uses social media?
        startYear: '',                         // Year business started
        monthsOperated: [],                    // Months of operation
        workingOwners: '',                     // Working owners
        unpaidWorkers: '',                     // Unpaid workers
        paidEmployees: '',                     // Paid employees
        registrationAgency: '',                // Agency registered with
      },
    ],
  });

  // Array of years from 2000 to current year
  const years = Array.from({ length: new Date().getFullYear() - 1999 }, (_, i) => 2000 + i);

  // Months used in selection
  const months = [
    'July 2021', 'August 2021', 'September 2021', 'October 2021',
    'November 2021', 'December 2021', 'January 2022', 'February 2022',
    'March 2022', 'April 2022', 'May 2022', 'June 2022', 'All Months',
  ];

  // Registration agency options
  const registrationOptions = [
    { label: 'Barangay LGU', code: 'A' },
    { label: 'City/Municipal LGU', code: 'B' },
    { label: 'DTI', code: 'C' },
    { label: 'BIR', code: 'D' },
    { label: 'Other Government Agency', code: 'E' },
    { label: 'Not Registered', code: 'F' },
    { label: "Don't Know", code: 'X' },
  ];

  // PSIC codes
  const psihCodes = [
    { label: 'Crop Farming and Gardening', code: 'A' },
    { label: 'Livestock and Poultry Raising', code: 'B' },
    { label: 'Fishing', code: 'C' },
    { label: 'Forestry and Hunting', code: 'D' },
    { label: 'Mining and Quarrying', code: 'E' },
    { label: 'Manufacturing', code: 'F' },
    { label: 'Electrical Supply', code: 'G' },
    { label: 'Water Supply and Waste Management', code: 'H' },
    { label: 'Construction', code: 'I' },
    { label: 'Wholesale and Retail', code: 'J' },
    { label: 'Repair of Motor Vehicles and Motorcycles', code: 'K' },
    { label: 'Transportation and Storage', code: 'L' },
    { label: 'Communication Services', code: 'M' },
    { label: 'Accommodation and Food Service Activities', code: 'N' },
    { label: 'Information and Communication', code: 'O' },
    { label: 'Financial and Insurance Activities', code: 'P' },
    { label: 'Real Estate and Ownership of Dwellings', code: 'Q' },
    { label: 'Professional and Business Services', code: 'R' },
    { label: 'Education', code: 'S' },
    { label: 'Human Health and Social Work Activities', code: 'T' },
    { label: 'Administrative and Support Service Activities', code: 'U' },
    { label: 'Arts, Entertainment and Recreation', code: 'V' },
    { label: 'Other Services', code: 'W' },
  ];

  // Handle general input change (form-level)
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox' && name === 'monthsOperated') {
      // Handle month toggling (checkbox logic)
      let newMonths = [...form.monthsOperated];

      if (value === 'All Months') {
        newMonths = checked ? [...months] : [];
      } else {
        newMonths = checked
          ? [...newMonths, value]
          : newMonths.filter((m) => m !== value && m !== 'All Months');
      }

      setForm({ ...form, monthsOperated: newMonths });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  // Handle input changes for specificPSICs[index][field]
  const handleSpecificPSICChange = (index, field, value) => {
    const updated = [...form.specificPSICs];
    updated[index][field] = value;
    setForm({ ...form, specificPSICs: updated });
  };

  // Add another PSIC entry
  const addPSIC = () => {
    setForm({
      ...form,
      specificPSICs: [
        ...form.specificPSICs,
        {
          id: uuidv4(),
          value: '',
          psicCode: '',
          useEcommerce: '',
          useSocialMedia: '',
          startYear: '',
          monthsOperated: [],
          workingOwners: '',
          unpaidWorkers: '',
          paidEmployees: '',
          registrationAgency: '',
        },
      ],
    });
  };

  // Remove a specific PSIC entry
  const removePSIC = (index) => {
    const updated = form.specificPSICs.filter((_, i) => i !== index);
    setForm({ ...form, specificPSICs: updated });
  };

  // Submit handler: save form to Firestore
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const docRef = doc(db, 'households', householdId, 'entrepreneurialAndHousehold', 'main');
      await setDoc(docRef, {
        ...form,
        timestamp: new Date(), // 🕒 Record save time
      });
      toast.success('Entrepreneurship data saved!');
      if (goToNext) goToNext(); // 🔀 Move to next section if needed
    } catch (error) {
      console.error('Error saving data:', error); // ❗ Debug log
      toast.error('Failed to save data.');
    } finally {
      setIsSaving(false); // ✅ Reset saving state
    }
  };

  // Handle month checkbox changes in a specific PSIC entry
  const handleMonthChange = (index, month, checked) => {
    const updated = [...form.specificPSICs];
    let months = [...updated[index].monthsOperated];

    if (month === 'All Months') {
      months = checked ? [...months.filter((m) => months.includes(m)), ...months] : [];
    } else {
      months = checked
        ? [...new Set([...months, month])]
        : months.filter((m) => m !== month && m !== 'All Months');
    }

    updated[index].monthsOperated = months;
    setForm({ ...form, specificPSICs: updated });
  };




  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto p-4 space-y-6">
      {/* Home Consumption */}

      {/* Question 1 */}
      <div>
        <label htmlFor="homeConsumption" className="block mb-1">
          Did you or any household member produce goods mainly for home consumption (July 2021–June 2022)?
        </label>
        <select
          id="homeConsumption"
          name="homeConsumption"
          value={form.homeConsumption}
          onChange={handleChange}
          required
          className="border p-2 rounded w-full"
        >
          <option value="">-- Select --</option>
          <option value="yes">YES</option>
          <option value="no">NO</option>
        </select>
      </div>

      {/* Sustenance Activities */}
      <div>
        <label htmlFor="sustenanceActivities" className="block mb-1">
          What is/are the sustenance activity/ies conducted by your household?
        </label>
        <select
          id="sustenanceActivities"
          name="sustenanceActivities"
          value={form.sustenanceActivities}
          onChange={handleChange}
          className="border p-2 rounded w-full"
        >
          <option value="">-- Select --</option>
          <option value="fishing">Fishing, Gathering shells, snails, seaweed, etc.</option>
          <option value="logging">Logging, Gathering forest products</option>
          <option value="hunting">Hunting and Trapping</option>
          <option value="farming">Farming and Gathering</option>
          <option value="livestock">Raising livestock and poultry</option>
        </select>
      </div>

      {/* Entrepreneurial Activity Type */}
      <div>
        <label htmlFor="entrepreneurialActivities" className="block mb-1">
          Did you or any household member engage in any of the following entrepreneurial activities?
        </label>
        <select
          id="entrepreneurialActivities"
          name="entrepreneurialActivities"
          value={form.entrepreneurialActivities}
          onChange={handleChange}
          required
          className="border p-2 rounded w-full"
        >
          <option value="">-- Select --</option>
          {psihCodes.map(({ label, code }) => (
            <option key={code} value={code}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Specific PSIC Activities */}
      {form.specificPSICs.map((item, index) => (
        <div key={item.id} className="border p-4 rounded mb-4">
          {/* Activity Dropdown */}
          <label htmlFor={`activity-${index}`} className="block mb-1">
            What are the specific entrepreneurial activities?
          </label>
          <select
            id={`activity-${index}`}
            name={`activity-${index}`}
            value={item.value}
            onChange={(e) => handleSpecificPSICChange(index, 'value', e.target.value)}
            className="border p-2 rounded w-full"
          >
            <option value="">-- Select --</option>
            {psihCodes.map(({ label, code }) => (
              <option key={code} value={code}>{label}</option>
            ))}
          </select>

          {/* PSIC Code */}
          <label htmlFor={`psicCode-${index}`} className="block mt-4 mb-1">Enter PSIC Code</label>
          <input
            id={`psicCode-${index}`}
            name={`psicCode-${index}`}
            value={item.psicCode}
            onChange={(e) => handleSpecificPSICChange(index, 'psicCode', e.target.value)}
            className="border p-2 rounded w-full"
          />

          {/* E-commerce */}
          <label htmlFor={`ecommerce-${index}`} className="block mt-4 mb-1">Does the activity use e-commerce?</label>
          <select
            id={`ecommerce-${index}`}
            name={`ecommerce-${index}`}
            value={item.useEcommerce}
            onChange={(e) => handleSpecificPSICChange(index, 'useEcommerce', e.target.value)}
            className="border p-2 rounded w-full"
          >
            <option value="">-- Select --</option>
            <option value="yes">YES</option>
            <option value="no">NO</option>
          </select>

          {/* Social Media */}
          <label htmlFor={`socialMedia-${index}`} className="block mt-4 mb-1">Does the activity use social media?</label>
          <select
            id={`socialMedia-${index}`}
            name={`socialMedia-${index}`}
            value={item.useSocialMedia}
            onChange={(e) => handleSpecificPSICChange(index, 'useSocialMedia', e.target.value)}
            className="border p-2 rounded w-full"
          >
            <option value="">-- Select --</option>
            <option value="yes">YES</option>
            <option value="no">NO</option>
          </select>

          {/* Start Year */}
          <label htmlFor={`startYear-${index}`} className="block mt-4 mb-1">What year did it start?</label>
          <select
            id={`startYear-${index}`}
            name={`startYear-${index}`}
            value={item.startYear}
            onChange={(e) => handleSpecificPSICChange(index, 'startYear', e.target.value)}
            className="border p-2 rounded w-full"
          >
            <option value="">-- Select Year --</option>
            {years.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>

          {/* Months Operated */}
          <label className="block mt-4 mb-1">Which months was the activity operated?</label>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-auto border p-2 rounded">
            {months.map((month) => (
              <label key={month} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`monthsOperated-${index}-${month}`}
                  name={`monthsOperated-${index}`}
                  value={month}
                  checked={item.monthsOperated.includes(month)}
                  onChange={(e) => {
                    handleMonthChange(index, month, e.target.checked);
                  }}
                />
                <span>{month}</span>
              </label>
            ))}
          </div>

          {/* Workers Counts */}
          <label htmlFor={`workingOwners-${index}`} className="block mt-4 mb-1">Number of working owners:</label>
          <input
            id={`workingOwners-${index}`}
            name={`workingOwners-${index}`}
            type="number"
            min={0}
            value={item.workingOwners}
            onChange={(e) => handleSpecificPSICChange(index, 'workingOwners', e.target.value)}
            className="border p-2 rounded w-full"
          />

          <label htmlFor={`unpaidWorkers-${index}`} className="block mt-4 mb-1">Number of unpaid workers:</label>
          <input
            id={`unpaidWorkers-${index}`}
            name={`unpaidWorkers-${index}`}
            type="number"
            min={0}
            value={item.unpaidWorkers}
            onChange={(e) => handleSpecificPSICChange(index, 'unpaidWorkers', e.target.value)}
            className="border p-2 rounded w-full"
          />

          <label htmlFor={`paidEmployees-${index}`} className="block mt-4 mb-1">Number of paid employees:</label>
          <input
            id={`paidEmployees-${index}`}
            name={`paidEmployees-${index}`}
            type="number"
            min={0}
            value={item.paidEmployees}
            onChange={(e) => handleSpecificPSICChange(index, 'paidEmployees', e.target.value)}
            className="border p-2 rounded w-full"
          />

          {/* Registration Agency */}
          <label htmlFor={`registrationAgency-${index}`} className="block mt-4 mb-1">
            Registration Agency
          </label>
          <select
            id={`registrationAgency-${index}`}
            name={`registrationAgency-${index}`}
            value={item.registrationAgency}
            onChange={(e) => handleSpecificPSICChange(index, 'registrationAgency', e.target.value)}
            className="border p-2 rounded w-full"
          >
            <option value="">-- Select --</option>
            {registrationOptions.map(({ label, code }) => (
              <option key={code} value={code}>{label}</option>
            ))}
          </select>

          {/* Remove Button */}
          {form.specificPSICs.length > 1 && (
            <button
              type="button"
              onClick={() => removePSIC(index)}
              className="text-red-500 hover:underline mt-2 block cursor-pointer"
            >
              Remove
            </button>
          )}
        </div>
      ))}

      {/* Add Another Activity Button */}
      <div className="w-full">
        <button
          type="button"
          onClick={addPSIC}
          className="text-green-600 hover:underline mt-4 block w-full text-left cursor-pointer"
        >
          + Add another activity
        </button>
      </div>

      {/* Submit Button */}
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
