'use client';

import React, { useState } from 'react';
import { db } from '@/firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

export default function Entrepreneurship({ householdId, goToNext }) {
  const [form, setForm] = useState({
    homeConsumption: '',
    sustenanceActivities: '',
    entrepreneurialActivities: '',
    specificPSIC: '',
    psicCode: '',
    useEcommerce: '',
    useSocialMedia: '',
    startYear: '',
    monthsOperated: [],
    workingOwners: '',
    unpaidWorkers: '',
    paidEmployees: '',
    registrationAgency: '', // ✅ unified to match form element
  });

  const years = Array.from({ length: new Date().getFullYear() - 1999 }, (_, i) => 2000 + i);

  const months = [
    'July 2021', 'August 2021', 'September 2021', 'October 2021',
    'November 2021', 'December 2021', 'January 2022', 'February 2022',
    'March 2022', 'April 2022', 'May 2022', 'June 2022', 'All Months',
  ];

  const registrationOptions = [
    { label: 'Barangay LGU', code: 'A' },
    { label: 'City/Municipal LGU', code: 'B' },
    { label: 'DTI', code: 'C' },
    { label: 'BIR', code: 'D' },
    { label: 'Other Government Agency', code: 'E' },
    { label: 'Not Registered', code: 'F' },
    { label: "Don't Know", code: 'X' },
  ];

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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      if (name === 'monthsOperated') {
        let newMonths = [...form.monthsOperated];
        if (value === 'All Months') {
          newMonths = checked ? [...months] : [];
        } else {
          newMonths = checked
            ? [...newMonths, value]
            : newMonths.filter((m) => m !== value && m !== 'All Months');
        }
        setForm({ ...form, monthsOperated: newMonths });
      }
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const docRef = doc(db, 'households', householdId, 'entrepreneurialAndHousehold', 'main');
      await setDoc(docRef, {
        ...form,
        timestamp: new Date(),
      });
      toast.success('Entrepreneurship data saved!');
      if (goToNext) goToNext();
    } catch (error) {
      console.error('Error saving data:', error);
      toast.error('Failed to save data.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto p-4 space-y-6">
      <div>
        <label htmlFor="homeConsumption" className="block mb-1">
          In the past 12 months (July 01, 2021 - June 30, 2022), did you or any
          member of your household produce goods mainly for home consumption?
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

      <div>
        <label htmlFor="sustenanceActivities" className="block mb-1">
          What is/are the sustenance activity/ies conducted by your household?
        </label>
        <textarea
          id="sustenanceActivities"
          name="sustenanceActivities"
          value={form.sustenanceActivities}
          onChange={handleChange}
          rows={3}
          className="border p-2 rounded w-full"
        />
      </div>

      <div>
        <label htmlFor="entrepreneurialActivities" className="block mb-1">
          In the past 12 months (...), did you or any member ...?
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
          <option value="fishing">Fishing, Gathering shells, snails, seaweed, etc.</option>
          <option value="logging">Logging, Gathering forest products</option>
          <option value="hunting">Hunting and Trapping</option>
          <option value="farming">Farming and Gathering</option>
          <option value="livestock">Raising livestock and poultry</option>
        </select>
      </div>

      <div>
        <label htmlFor="specificPSIC" className="block mb-1">
          What is/are the specific entrepreneurial activity/ies of the household?
        </label>
        <select
          id="specificPSIC"
          name="specificPSIC"
          value={form.specificPSIC}
          onChange={handleChange}
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

      <div>
        <label htmlFor="psicCode" className="block mb-1">Enter PSIC Code</label>
        <input
          id="psicCode"
          name="psicCode"
          value={form.psicCode}
          onChange={handleChange}
          className="border p-2 rounded w-full"
        />
      </div>

      <div>
        <label htmlFor="useEcommerce" className="block mb-1">Does the entrepreneurial activity/ies use e-commerce?</label>
        <select
          id="useEcommerce"
          name="useEcommerce"
          value={form.useEcommerce}
          onChange={handleChange}
          required
          className="border p-2 rounded w-full"
        >
          <option value="">-- Select --</option>
          <option value="yes">YES</option>
          <option value="no">NO</option>
        </select>
      </div>

      <div>
        <label htmlFor="useSocialMedia" className="block mb-1">Does the activity use social media?</label>
        <select
          id="useSocialMedia"
          name="useSocialMedia"
          value={form.useSocialMedia}
          onChange={handleChange}
          required
          className="border p-2 rounded w-full"
        >
          <option value="">-- Select --</option>
          <option value="yes">YES</option>
          <option value="no">NO</option>
        </select>
      </div>

      <div>
        <label htmlFor="startYear" className="block mb-1">What year did it start?</label>
        <select
          id="startYear"
          name="startYear"
          value={form.startYear}
          onChange={handleChange}
          className="border p-2 rounded w-full"
        >
          <option value="">-- Select Year --</option>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block mb-1">Which months was the activity operated?</label>
        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-auto border p-2 rounded">
          {months.map((month, i) => (
            <div key={month}>
              <input
                id={`month-${i}`}
                type="checkbox"
                name="monthsOperated"
                value={month}
                checked={form.monthsOperated.includes(month)}
                onChange={handleChange}
                className="mr-2"
              />
              <label htmlFor={`month-${i}`}>{month}</label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block mb-2">Average persons working per month?</label>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label htmlFor="workingOwners" className="block mb-1">Working Owners</label>
            <input
              id="workingOwners"
              type="number"
              min="0"
              name="workingOwners"
              value={form.workingOwners}
              onChange={handleChange}
              className="border p-2 rounded w-full"
              placeholder="Number"
            />
          </div>
          <div>
            <label htmlFor="unpaidWorkers" className="block mb-1">Unpaid Workers</label>
            <input
              id="unpaidWorkers"
              type="number"
              min="0"
              name="unpaidWorkers"
              value={form.unpaidWorkers}
              onChange={handleChange}
              className="border p-2 rounded w-full"
              placeholder="Number"
            />
          </div>
          <div>
            <label htmlFor="paidEmployees" className="block mb-1">Paid Employees</label>
            <input
              id="paidEmployees"
              type="number"
              min="0"
              name="paidEmployees"
              value={form.paidEmployees}
              onChange={handleChange}
              className="border p-2 rounded w-full"
              placeholder="Number"
            />
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="registrationAgency" className="block mb-1">
          In which agency is it registered?
        </label>
        <select
          id="registrationAgency"
          name="registrationAgency"
          value={form.registrationAgency || ""}
          onChange={handleChange}
          className="border p-2 rounded w-full"
        >
          <option value="">-- Select an agency --</option>
          {registrationOptions.map(({ label, code }) => (
            <option key={code} value={code}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="mt-4 bg-green-700 text-white px-6 py-2 rounded hover:bg-green-800"
      >
        Save & Continue &gt;
      </button>
    </form>
  );
}
