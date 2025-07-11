'use client';

import React, { useState } from 'react';
import { db } from '@/firebase/config'; // ✅ adjust if needed
import { doc, setDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';


export default function OnlineEcommerceActivities({householdId, goToNext}) {
  const [form, setForm] = useState({
    hasInternetAccess: '',
    internetAccessLocations: '',
    hasOwnInternetAtHome: '',
    internetConnectionTypes: [],
    payForInternet: '',
    internetUsageActivities: '',
    engagedInOnlinePurchasing: '',
    ecommercePlatformsUsed: [],
    engagedInOnlineWork: '',
  });




  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      const list = [...form[name]];
      if (checked) list.push(value);
      else list.splice(list.indexOf(value), 1);
      setForm((prev) => ({ ...prev, [name]: list }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

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

  const internetConnectionTypesOptions = [
    'FIXED (WIRED) NARROWBAND/BROADBAND NETWORK',
    'FIXED (WIRELESS) BROADBAND NETWORK',
    'SATELLITE BROADBAND NETWORK',
    'MOBILE BROADBAND NETWORK',
  ];

  const internetUsageActivitiesOptions = [
    'BROWSING/INFORMATION SEARCH',
    'SOCIAL MEDIA',
    'ONLINE SHOPPING',
    'ONLINE BANKING',
    'ONLINE EDUCATION',
    'ENTERTAINMENT (VIDEO/STREAMING/GAMES)',
    'OTHERS',
  ];

  const ecommercePlatformsOptions = [
    'E-COMMERCE PLATFORM (Lazada, Shopee, Amazon, E-bay, Grab, Metromart, Angkas, Booking.com, Klook, etc.)',
    'SOCIAL MEDIA SITE / MARKETPLACE (Facebook Marketplace, Instagram, TikTok Shop, etc.)',
    'OFFICIAL STORE / SERVICE PROVIDER WEBSITE',
    'OTHERS',
  ];

  const yesNoOptions = [
    { label: 'YES', value: 'YES' },
    { label: 'NO', value: 'NO' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
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
    }
  };


  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto p-4 space-y-6">
      <h2 className="text-xl font-bold text-green-600 mb-4">
        Household Online E-Commerce Activities (Past 12 months)
      </h2>

      {/* Access to internet */}
      <div>
        <label className="block mb-2">
          In the past 12 months, do you or any member of household have access to internet?
        </label>
        <select
          name="hasInternetAccess"
          value={form.hasInternetAccess}
          onChange={handleChange}
          className="border p-2 rounded w-full"
          required
        >
          <option value="">-- Select --</option>
          {yesNoOptions.map(({ label, value }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Where access internet */}
      {form.hasInternetAccess === 'YES' && (
        <div>
          <label className="block mb-2">
            Where do you or any member of your household access the internet?
          </label>
          <select
            name="internetAccessLocations"
            value={form.internetAccessLocations}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          >
            <option value="">-- Select where access internet --</option>
            {internetAccessLocationsOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      )}

      {/* Own internet at home */}
      {form.hasInternetAccess === 'YES' && (
        <div>
          <label className="block mb-2">
            Does this household have its own internet at home which can be used by any household member when needed?
          </label>
          <select
            name="hasOwnInternetAtHome"
            value={form.hasOwnInternetAtHome}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          >
            <option value="">-- Select --</option>
            {yesNoOptions.map(({ label, value }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Types of internet connection */}
      {form.hasOwnInternetAtHome === 'YES' && (
        <div>
          <label className="block mb-2">
            What types of internet connection are available at home?
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border p-3 rounded">
            {internetConnectionTypesOptions.map((option) => (
              <label key={option} className="inline-flex items-center">
                <input
                  type="checkbox"
                  name="internetConnectionTypes"
                  value={option}
                  checked={form.internetConnectionTypes.includes(option)}
                  onChange={handleChange}
                  className="mr-2"
                />
                {option}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Pay for internet */}
      {form.hasInternetAccess === 'YES' && (
        <div>
          <label className="block mb-2">
            Do you or any member of your household pay (whether prepaid or postpaid) when accessing the internet?
          </label>
          <select
            name="payForInternet"
            value={form.payForInternet}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          >
            <option value="">-- Select --</option>
            {yesNoOptions.map(({ label, value }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Internet usage activities */}
      {form.hasInternetAccess === 'YES' && (
        <div>
          <label className="block mb-2">
            In the past 12 months, for which of the following activities did you or any of your household member use the internet?
          </label>
          <select
            name="internetUsageActivities"
            value={form.internetUsageActivities}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          >
            <option value="">-- Select internet usage --</option>
            {internetUsageActivitiesOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      )}

      {/* Engaged in online purchasing */}
      {form.hasInternetAccess === 'YES' && (
        <div>
          <label className="block mb-2">
            In the past 12 months, did you or any of your household members engage in purchasing goods and/or services online?
          </label>
          <select
            name="engagedInOnlinePurchasing"
            value={form.engagedInOnlinePurchasing}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          >
            <option value="">-- Select --</option>
            {yesNoOptions.map(({ label, value }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      )}

      {/* E-commerce platforms used */}
      {form.engagedInOnlinePurchasing === 'YES' && (
        <div>
          <label className="block mb-2">
            What were the e-commerce platforms/applications/websites that the household members have used in the past 12 months?
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border p-3 rounded">
            {ecommercePlatformsOptions.map((option) => (
              <label key={option} className="inline-flex items-center">
                <input
                  type="checkbox"
                  name="ecommercePlatformsUsed"
                  value={option}
                  checked={form.ecommercePlatformsUsed.includes(option)}
                  onChange={handleChange}
                  className="mr-2"
                />
                {option}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Engaged in online work */}
      {form.hasInternetAccess === 'YES' && (
        <div>
          <label className="block mb-2">
            In the past 12 months, did you or any of your household members engage in online work (online seller, tutor, freelance writer, Grab, Angkas) through an online platform such as Upwork, OnlineJobs.ph?
          </label>
          <select
            name="engagedInOnlineWork"
            value={form.engagedInOnlineWork}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          >
            <option value="">-- Select --</option>
            {yesNoOptions.map(({ label, value }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      )}

      <div className="pt-4">
        <button
          type="submit"
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-800"
        >
          Save & Continue &gt;
        </button>
      </div>
    </form>
  );
}