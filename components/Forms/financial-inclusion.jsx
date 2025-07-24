'use client';

import React, { useState } from 'react';
import { db } from '@/firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

export default function FinancialInclusion({ householdId, goToNext }) {
  // State to handle saving state (e.g., disabling button while saving)
  const [isSaving, setIsSaving] = useState(false);

  // Initial state for form data
  const [form, setForm] = useState({
    hasFinancialAccounts: '',
    financialAccountTypes: [],
    financialAccountUsage: '',
    reasonNoAccount: '',
    hasSavings: '',
    whereSavings: '',
    reasonNoSavings: '',
    hasLoans: '',
    whereLoan: '',
    loanPurpose: '',
    insuranceProducts: [],
  });

  // Handles form changes for both checkbox and other input types
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      // Update checkbox group values
      const updated = form[name] || [];
      if (checked) {
        setForm((prev) => ({
          ...prev,
          [name]: [...updated, value], // Add value
        }));
      } else {
        setForm((prev) => ({
          ...prev,
          [name]: updated.filter((item) => item !== value), // Remove value
        }));
      }
    } else {
      // Update text, select, or radio values
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handles form submission and writes data to Firestore
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true); // Start saving
    try {
      // Reference to the Firestore document
      const docRef = doc(db, 'households', householdId, 'financialInclusion', 'main');

      // Save data to Firestore
      await setDoc(docRef, {
        ...form,
        timestamp: new Date(), // Add timestamp
      });

      toast.success('Financial Inclusion saved!');

      // Go to next section if provided
      if (goToNext) goToNext();
    } catch (error) {
      // Log error to console and show toast
      console.error('Error saving financial inclusion:', error);
      toast.error('Failed to save data.');
    } finally {
      setIsSaving(false); // End saving
    }
  };

  // Options for financial account types
  const financialAccountTypes = [
    'FORMAL BANK ACCOUNT',
    'COOPERATIVE',
    'DIGITAL BANK ACCOUNT (e.g., UnionBank)',
    'MICROFINANCE',
    'E-MONEY ACCOUNT (e.g., GCash)',
    'NON-STOCKS SAVINGS & LOAN ASSOCIATION',
  ];

  // Options for how financial accounts are used
  const financialAccountUsage = [
    'SAVING - FOR EDUCATION',
    'SAVING - FOR LEISURE TRAVEL',
    'OPENING BUSINESS / BUSINESS EXPANSION',
    'SAVING - FOR FUTURE EVENTS',
    'SAVING - FOR INVESTMENTS',
    'SAVING - FOR OTHER PURPOSES',
    'PAYMENT - FOR ELECTRONIC BANKING',
    'FOR AUTOMATIC DEBIT ARRANGEMENT',
    'FOR CHECK PAYMENT',
    'FOR ONLINE SHOPPING',
    'PAYMENT - FOR LOANS',
    'RECEIVING BENEFITS FROM GOVT. PROGRAMS',
    'RECEIVING SALARY',
    'RECEIVING LOANS',
    'RECEIVING ALLOWANCE',
    'BUSINESS OPERATIONS',
    'REMITTANCES',
    'OTHERS',
  ];

  // Reasons for not having a financial account
  const noAccountReasons = [
    'DO NOT KNOW THE DETAILS',
    'DON’T HAVE DOCUMENTARY REQUIREMENTS',
    'DON’T TRUST FINANCIAL INSTITUTIONS',
    'RELIGIOUS BELIEFS',
    'FIND SO EXPENSIVE',
    'NOT INTERESTED / NOT NEEDED / PREFER CASH',
    'INSUFFICIENT MONEY TO OPEN',
    'FINANCIAL INSTITUTIONS IS TOO FAR',
    'PERSONAL REASONS',
    'TOO OLD / TOO YOUNG',
    'OTHERS',
  ];

  // Where savings are stored
  const savingsLocations = [
    'FORMAL FINANCIAL ACCOUNT',
    'AT HOME',
    'ASK OTHER PEOPLE TO KEEP THE MONEY',
    'GROUP SAVINGS',
    'GOVERNMENT INSTITUTIONS (GSIS etc)',
    'OTHERS',
  ];

  // Reasons for not saving money
  const noSavingsReasons = [
    'EARN JUST ENOUGH / NO EXTRA',
    'UNEMPLOYMENT / UNSTABLE INCOME',
    'USE FOR EMERGENCY AND ETC',
    'FELT NO NEED TO SAVE',
    'OTHERS',
  ];

  // Sources of loan
  const loanSources = [
    'BANK',
    'NSSLA',
    'COOPERATIVE',
    'MICROFINANCE INSTITUTION',
    'FINANCING/LENDING COMPANY',
    'ONLINE LENDING PLATFORM',
    'PAWNSHOP',
    'GOVERNMENT INSTITUTIONS',
    'FAMILY/RELATIVE/FRIEND',
    'INFORMAL LENDER',
    'SALARY ADVANCE FROM EMPLOYER',
    'IN-HOUSE FINANCING',
    'OTHERS',
  ];

  // Purposes for loan
  const loanPurposes = [
    'BUSINESS/ENTREPRENEURIAL',
    'EDUCATION',
    'TRAVEL/LEISURE',
    'MEDICAL NEEDS',
    'DAILY NEEDS (e.g., FOOD)',
    'VEHICLE',
    'REAL ESTATE',
    'PAYMENT FOR ANOTHER LOAN',
    'APPLIANCE/FURNITURE/GADGETS',
    'INSURANCE',
    'EVENTS (e.g., BIRTHDAYS)',
    'OTHERS',
  ];

  // Insurance product types
  const insuranceOptions = [
    'LIFE INSURANCE',
    'ACCIDENT INSURANCE',
    'HEALTH INSURANCE',
    'NON-LIFE & LIFE INSURANCE',
    'FIRE INSURANCE',
    'VEHICLE INSURANCE',
    'MICROINSURANCE',
    'CROP INSURANCE',
    'LIVESTOCK/POULTRY INSURANCE',
    'FISHERIES INSURANCE',
    'OTHERS',
  ];


  return (
    <form onSubmit={handleSubmit} className="h-full overflow-y-auto max-w-5xl mx-auto p-4 space-y-6">
      {/*Question 1. Financial Account */}
      <div>
        <label htmlFor="hasFinancialAccounts" className="block mb-2">Do you have financial accounts?</label>
        <select
          id="hasFinancialAccounts"
          name="hasFinancialAccounts"
          value={form.hasFinancialAccounts}
          onChange={handleChange}
          className="border p-2 rounded w-full"
          required
        >
          <option value="">-- Select --</option>
          <option value="YES">YES</option>
          <option value="NO">NO</option>
        </select>
      </div>

      {/*Question 2. Financial Account */}
      {form.hasFinancialAccounts === 'YES' && (
        <>
          <label className="block mb-2" htmlFor='financialAccountTypes'>Check all financial accounts that you have:</label> 
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border p-3 rounded">
            {financialAccountTypes.map((option) => (
              <label key={option} className="inline-flex items-center">
                <input
                  id='financialAccountTypes'
                  type="checkbox"
                  name="financialAccountTypes"
                  value={option}
                  checked={form.financialAccountTypes.includes(option)}
                  onChange={handleChange}
                  className="mr-2"
                />
                {option}
              </label>
            ))}
          </div>
          
          {/*Question 3. Financial Account */}
          <div className="mt-4">
            <label className="block mb-1" htmlFor='financialAccountUsage'>How did you use the financial accounts in the past 12 months?</label>
            <select
              id='financialAccountUsage'
              name="financialAccountUsage"
              value={form.financialAccountUsage}
              onChange={handleChange}
              className="border p-2 rounded w-full"
            >
              <option value="">-- Select Purpose --</option>
              {financialAccountUsage.map((purpose) => (
                <option key={purpose} value={purpose}>{purpose}</option>
              ))}
            </select>
          </div>
        </>
      )}

      {form.hasFinancialAccounts === 'NO' && (
        <div>
          <label className="block mb-1" htmlFor='reasonNoAccount'>Select the reason for not having any financial accounts:</label> {/*Question 4. Financial Account */}
          <select
            id='reasonNoAccount'
            name="reasonNoAccount"
            value={form.reasonNoAccount}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            required
          >
            <option value="">-- Select Reason --</option>
            {noAccountReasons.map((reason) => (
              <option key={reason} value={reason}>{reason}</option>
            ))}
          </select>
        </div>
      )}

      {/*Question 5. Savings */}
      <div>
        <label className="block mb-1" htmlFor='hasSavings'>Do you or any household members have savings?</label>
        <select
          id='hasSavings'
          name="hasSavings"
          value={form.hasSavings}
          onChange={handleChange}
          className="border p-2 rounded w-full"
        >
          <option value="">-- Select --</option>
          <option value="YES">YES</option>
          <option value="NO">NO</option>
          <option value="PREFER NOT TO ANSWER">PREFER NOT TO ANSWER</option>
        </select>
      </div>

      {form.hasSavings === 'YES' && (
        <div>
          <label className="block mb-1" htmlFor='whereSavings'>Where do you or any household members keep the savings?</label> {/*Question 6. Savings */}
          <select
            id='whereSavings'
            name="whereSavings"
            value={form.whereSavings}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          >
            <option value="">-- Select Place --</option>
            {savingsLocations.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
      )}

      {form.hasSavings === 'NO' && (
        <div>
          <label className="block mb-1" htmlFor='reasonNoSavings'>If no, state the reason why:</label> {/*Question 7. Savings */}
          <select
            id='reasonNoSavings'
            name="reasonNoSavings"
            value={form.reasonNoSavings}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          >
            <option value="">-- Select Reason --</option>
            {noSavingsReasons.map((reason) => (
              <option key={reason} value={reason}>{reason}</option>
            ))}
          </select>
        </div>
      )}

      {/*Question 8 Loans */}
      <div>
        <label className="block mb-1" htmlFor='hasLoans'>Do you or any household members have any loans?</label>
        <select
          id='hasLoans'
          name="hasLoans"
          value={form.hasLoans}
          onChange={handleChange}
          className="border p-2 rounded w-full"
        >
          <option value="">-- Select --</option>
          <option value="YES">YES</option>
          <option value="NO">NO</option>
          <option value="PREFER NOT TO ANSWER">PREFER NOT TO ANSWER</option>
        </select>
      </div>

      {/*Question 9 Loans */}
      {form.hasLoans === 'YES' && (
        <>
          <div>
            <label className="block mb-1" htmlFor='whereLoan'>Where did you acquire this/these loans?</label> 
            <select
              id='whereLoan'
              name="whereLoan"
              value={form.whereLoan}
              onChange={handleChange}
              className="border p-2 rounded w-full"
            >
              <option value="">-- Select Place --</option>
              {loanSources.map((src) => (
                <option key={src} value={src}>{src}</option>
              ))}
            </select>
          </div>

          {/*Question 10 Loans */}
          <div>
            <label className="block mb-1" htmlFor='loanPurpose'>Purpose/s of this/these loans:</label>
            <select
              id='loanPurpose'
              name="loanPurpose"
              value={form.loanPurpose}
              onChange={handleChange}
              className="border p-2 rounded w-full"
            >
              <option value="">-- Select Purpose --</option>
              {loanPurposes.map((purpose) => (
                <option key={purpose} value={purpose}>{purpose}</option>
              ))}
            </select>
          </div>
        </>
      )}

      {/*Question 11 Insurance */}
      <div>
        <label className="block mb-1" htmlFor='insuranceProducts'>Select the following insurance products you or any HH members have:</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border p-3 rounded">
          {insuranceOptions.map((insurance) => (
            <label key={insurance} className="inline-flex items-center">
              <input
                id='insuranceProducts'
                type="checkbox"
                name="insuranceProducts"
                value={insurance}
                checked={form.insuranceProducts.includes(insurance)}
                onChange={handleChange}
                className="mr-2"
              />
              {insurance}
            </label>
          ))}
        </div>
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
