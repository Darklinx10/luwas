'use client';

import React, { useState } from 'react';
import { db } from '@/firebase/config'; 
import { doc, setDoc } from 'firebase/firestore'; 
import { toast } from 'react-toastify'; 

export default function OnlineEcommerceActivities({ householdId, goToNext }) {
  const [isSaving, setIsSaving] = useState(false); 

  // Form state to capture user inputs
  const [form, setForm] = useState({
    hasInternetAccess: '',                        // Question 1
    internetAccessLocations: '',                  // Question 2
    hasOwnInternetAtHome: '',                     // Question 3
    internetConnectionTypes: [],                  // Question 4
    payForInternet: '',                           // Question 5
    internetUsageActivities: '',                  // Question 6
    engagedInOnlinePurchasing: '',                // Question 7
    ecommercePlatformsUsed: [],                   // Question 8
    engagedInOnlineWork: '',                      // Question 9
  });

  // Handles form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // If input is checkbox (multiple selection)
    if (type === 'checkbox') {
      const list = [...form[name]]; // Clone the current list
      if (checked) list.push(value); // Add value if checked
      else list.splice(list.indexOf(value), 1); // Remove if unchecked
      setForm((prev) => ({ ...prev, [name]: list })); // Update state
    } else {
      setForm((prev) => ({ ...prev, [name]: value })); // For single-value inputs
    }
  };

  // Options for Question 2: Where internet is accessed
  const internetAccessLocationsOptions = [
    'HOME',
    'WHILE COMMUTING, IN TRANSPORT, OR WALKING',
    'SCHOOL/WORKPLACE',
    'RELATIVES/FRIENDS/NEIGHBOR’S HOME',
    'BARANGAY/COMMUNITY FACILITY',
    'COMPUTER SHOP',
    'BUSINESS ESTABLISHMENT (STORE, TOWN MALL)',
    'OTHERS',
  ];

  // Options for Question 4: Internet connection types
  const internetConnectionTypesOptions = [
    'FIXED (WIRED) NARROWBAND/BROADBAND NETWORK',
    'FIXED (WIRELESS) BROADBAND NETWORK',
    'SATELLITE BROADBAND NETWORK',
    'MOBILE BROADBAND NETWORK',
  ];

  // Options for Question 6: Types of internet activities
  const internetUsageActivitiesOptions = [
    'BROWSING/INFORMATION SEARCH',
    'SOCIAL MEDIA',
    'ONLINE SHOPPING',
    'ONLINE BANKING',
    'ONLINE EDUCATION',
    'ENTERTAINMENT (VIDEO/STREAMING/GAMES)',
    'OTHERS',
  ];

  // Options for Question 8: Ecommerce platforms used
  const ecommercePlatformsOptions = [
    'E-COMMERCE PLATFORM (Lazada, Shopee, Amazon, E-bay, Grab, Metromart, Angkas, Booking.com, Klook, etc.)',
    'SOCIAL MEDIA SITE / MARKETPLACE (Facebook Marketplace, Instagram, TikTok Shop, etc.)',
    'OFFICIAL STORE / SERVICE PROVIDER WEBSITE',
    'OTHERS',
  ];

  // General Yes/No options (used for Q1, Q3, Q5, Q7, Q9)
  const yesNoOptions = [
    { label: 'YES', value: 'YES' },
    { label: 'NO', value: 'NO' },
  ];

  // Handles form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true); // ✅ Begin saving state
    try {
      // Reference to Firestore document
      const docRef = doc(db, 'households', householdId, 'ecommerceDigitalEconomy', 'main');
      await setDoc(docRef, {
        ...form,
        timestamp: new Date(),
      });
      toast.success('Ecommerce Digital Economy Information saved!'); 
      if (goToNext) goToNext(); 
    } catch (error) {
      console.error('Error saving form:', error); 
      toast.error('Failed to save data.'); 
    } finally {
      setIsSaving(false); 
    }
  };



  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto p-4 space-y-6">
      <h2 className="text-xl font-bold text-green-600 mb-4">
        Household Online E-Commerce Activities (Past 12 months)
      </h2>

      {/* Q1: Access to internet */}
      <div>
        <label className="block mb-2" htmlFor='hasInternetAccess'>
          In the past 12 months, do you or any member of household have access to internet?
        </label>
        <select
          id='hasInternetAccess'
          name="hasInternetAccess"
          value={form.hasInternetAccess}
          onChange={handleChange} // Q1 handler
          className="border p-2 rounded w-full"
          required
        >
          <option value="">-- Select --</option>
          {yesNoOptions.map(({ label, value }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Q2: Where access internet — conditional on Q1 = YES */}
      {form.hasInternetAccess === 'YES' && (
        <div>
          <label className="block mb-2" htmlFor='internetAccessLocations'>
            Where do you or any member of your household access the internet?
          </label>
          <select
            id='internetAccessLocations'
            name="internetAccessLocations"
            value={form.internetAccessLocations}
            onChange={handleChange} // Q2 handler
            className="border p-2 rounded w-full"
          >
            <option value="">-- Select where access internet --</option>
            {internetAccessLocationsOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      )}

      {/* Q3: Own internet at home — conditional on Q1 = YES */}
      {form.hasInternetAccess === 'YES' && (
        <div>
          <label className="block mb-2" htmlFor='hasOwnInternetAtHome'>
            Does this household have its own internet at home which can be used by any household member when needed?
          </label>
          <select
            id='hasOwnInternetAtHome'
            name="hasOwnInternetAtHome"
            value={form.hasOwnInternetAtHome}
            onChange={handleChange} // Q3 handler
            className="border p-2 rounded w-full"
          >
            <option value="">-- Select --</option>
            {yesNoOptions.map(({ label, value }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Q4: Types of internet connection — conditional on Q3 = YES */}
      {form.hasOwnInternetAtHome === 'YES' && (
        <div>
          <label className="block mb-2" htmlFor='internetConnectionTypes'>
            What types of internet connection are available at home?
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border p-3 rounded">
            {internetConnectionTypesOptions.map((option) => (
              <label key={option} className="inline-flex items-center">
                <input
                  id='internetConnectionTypes'
                  type="checkbox"
                  name="internetConnectionTypes"
                  value={option}
                  checked={form.internetConnectionTypes.includes(option)}
                  onChange={handleChange} // Q4 handler
                  className="mr-2"
                />
                {option}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Q5: Pay for internet — conditional on Q1 = YES */}
      {form.hasInternetAccess === 'YES' && (
        <div>
          <label className="block mb-2" htmlFor='payForInternet'>
            Do you or any member of your household pay (whether prepaid or postpaid) when accessing the internet?
          </label>
          <select
            id='payForInternet'
            name="payForInternet"
            value={form.payForInternet}
            onChange={handleChange} // Q5 handler
            className="border p-2 rounded w-full"
          >
            <option value="">-- Select --</option>
            {yesNoOptions.map(({ label, value }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Q6: Internet usage activities — conditional on Q1 = YES */}
      {form.hasInternetAccess === 'YES' && (
        <div>
          <label className="block mb-2" htmlFor='internetUsageActivities'>
            In the past 12 months, for which of the following activities did you or any of your household member use the internet?
          </label>
          <select
            id='internetUsageActivities'
            name="internetUsageActivities"
            value={form.internetUsageActivities}
            onChange={handleChange} // Q6 handler
            className="border p-2 rounded w-full"
          >
            <option value="">-- Select internet usage --</option>
            {internetUsageActivitiesOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      )}

      {/* Q7: Online purchasing — conditional on Q1 = YES */}
      {form.hasInternetAccess === 'YES' && (
        <div>
          <label className="block mb-2" htmlFor='engagedInOnlinePurchasing'>
            In the past 12 months, did you or any of your household members engage in purchasing goods and/or services online?
          </label>
          <select
            id='engagedInOnlinePurchasing'
            name="engagedInOnlinePurchasing"
            value={form.engagedInOnlinePurchasing}
            onChange={handleChange} // Q7 handler
            className="border p-2 rounded w-full"
          >
            <option value="">-- Select --</option>
            {yesNoOptions.map(({ label, value }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Q8: Ecommerce platforms used — conditional on Q7 = YES */}
      {form.engagedInOnlinePurchasing === 'YES' && (
        <div>
          <label className="block mb-2" htmlFor='ecommercePlatformsUsed'>
            What were the e-commerce platforms/applications/websites that the household members have used in the past 12 months?
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border p-3 rounded">
            {ecommercePlatformsOptions.map((option) => (
              <label key={option} className="inline-flex items-center">
                <input
                  id='ecommercePlatformsUsed'
                  type="checkbox"
                  name="ecommercePlatformsUsed"
                  value={option}
                  checked={form.ecommercePlatformsUsed.includes(option)}
                  onChange={handleChange} // Q8 handler
                  className="mr-2"
                />
                {option}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Q9: Online work — conditional on Q1 = YES */}
      {form.hasInternetAccess === 'YES' && (
        <div>
          <label className="block mb-2" htmlFor='engagedInOnlineWork'>
            In the past 12 months, did you or any of your household members engage in online work (online seller, tutor, freelance writer, Grab, Angkas) through an online platform such as Upwork, OnlineJobs.ph?
          </label>
          <select
            id='engagedInOnlineWork'
            name="engagedInOnlineWork"
            value={form.engagedInOnlineWork}
            onChange={handleChange} // Q9 handler
            className="border p-2 rounded w-full"
          >
            <option value="">-- Select --</option>
            {yesNoOptions.map(({ label, value }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
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
    </form>
  );
}