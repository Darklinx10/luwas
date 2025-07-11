'use client';

import React, { useState } from 'react';
import { db } from '@/firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

export default function SocialProtectionProgramsForm({ householdId, goToNext }) {
  const [form, setForm] = useState({
    socialInsurance: {
      SSS: '', GSIS: '', OWWA: '', otherHealthInsurance: '', lifeInsurance: '', pagibig: '', philHealth: '',
      sssReceived: '', gsisReceived: '', owwaReceived: '', otherHealthReceived: '', lifeInsuranceReceived: '', pagibigReceived: '', philHealthReceived: '',
      benefitsRecipients: '', philHealthMembershipType: '',
    },
    socialAssistance: {
      programs: {}, beneficiaries: '', timesReceived: '', hasMore: '',
    },
    feeding: {
      received: '', beneficiaries: '', timesReceived: '', hasMore: '',
    },
    labor: {
      programs: {}, beneficiaries: '', timesReceived: '', hasMore: '',
    },
    agri: {
      programs: {},
    },
    bayanihan: {
      programs: {},
    },
  });

  const yesNoOptions = ['YES', 'NO'];

  const handleChange = (section, field, value) => {
    setForm((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  const handleCheckboxChange = (section, field, option) => {
    const current = form[section][field] || {};
    setForm((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: {
          ...current,
          [option]: !current[option],
        },
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const docRef = doc(db, 'households', householdId, 'socialProtectionPrograms', 'main');
      await setDoc(docRef, {
        ...form,
        timestamp: new Date(),
      });
      toast.success('Social Protection Programs saved!');
      if (goToNext) goToNext();
    } catch (error) {
      console.error('Error saving form:', error);
      toast.error('Failed to save data.');
    }
  };

  const renderYesNoSelect = (section, field, label) => (
    <div>
      <label className="block font-medium mb-1">{label}</label>
      <select
        className="border p-2 rounded w-full"
        value={form[section][field]}
        onChange={(e) => handleChange(section, field, e.target.value)}
      >
        <option value="">-- Select --</option>
        {yesNoOptions.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );

  const renderCheckboxGroup = (section, field, options, label) => (
    <div>
      <label className="block font-medium mb-2">{label}</label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border p-3 rounded">
        {options.map((option) => (
          <label key={option} className="inline-flex items-center">
            <input
              type="checkbox"
              className="mr-2"
              checked={form[section][field]?.[option] || false}
              onChange={() => handleCheckboxChange(section, field, option)}
            />
            {option}
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-6 space-y-6">
      <h2 className="text-xl font-bold text-green-700 mb-4">
        Social Insurance Programs
      </h2>

      <p className="font-semibold mb-4">Now, we would like to ask if any of the household members received assistance/benefits from or is a member of any social protection programs.</p>

      {/* Program Membership Section */}
      <p className=" mb-2">Is any member of your household (including OFW) a dependent/beneficiary/member of the following?</p>

      {[
        'A. SSS',
        'B. GSIS',
        'C. OWWA',
        'D. Other Health Insurance',
        'E. Life Insurance',
        'F. Pag-IBIG',
        'G. PhilHealth',
      ].map(program => (
        <div key={program} className="mb-2">
          <label className="block mb-1">{program}</label>
          <select className="border p-2 rounded w-full">
            <option value="">-- Select --</option>
            <option value="YES">YES</option>
            <option value="NO">NO</option>
          </select>
        </div>
      ))}

      {/* Member Names */}
      <div className="mt-4">
        <label className="block mb-1">
          Who among the household members is a member of the program?
        </label>
        <input type="text" className="border p-2 rounded w-full" placeholder="Enter NAME here" />
      </div>

      {/* PhilHealth Membership Type */}
      <div className="mt-4">
        <label className="block mb-1">What is (NAME)’s type of PhilHealth membership?</label>
        <select className="border p-2 rounded w-full">
          <option value="">-- Select Type --</option>
          <option value="Paying">Paying</option>
          <option value="Non-Paying">Non-Paying</option>
        </select>
      </div>

      {/* Availing Benefits in the past 12 months */}
      <h3 className="mt-6 mb-2">
        Did any member receive benefits/grants/assistance from the program from July 01, 2021 - June 30, 2022?
      </h3>

      {[
        'A. SSS',
        'B. GSIS',
        'C. OWWA',
        'D. Other Health Insurance',
        'E. Life Insurance',
        'F. Pag-IBIG',
        'G. PhilHealth',
      ].map(program => (
        <div key={`${program}-received`} className="mb-2">
          <label className="block mb-1">{program}?</label>
          <select className="border p-2 rounded w-full">
            <option value="">-- Select --</option>
            <option value="YES">YES</option>
            <option value="NO">NO</option>
          </select>
        </div>
      ))}

      <div className="mt-4">
        <label className="block mb-1">
          Who among the household members received assistance?
        </label>
        <input type="text" className="border p-2 rounded w-full" placeholder="Enter NAME here" />
      </div>

      {/* Additional members */}
      <div className="mt-4">
        <label className="block mb-1">
          Are there other household members who are members of social/health insurance programs?
        </label>
        <select className="border p-2 rounded w-full">
          <option value="">-- Select --</option>
          <option value="YES">YES</option>
          <option value="NO">NO</option>
        </select>
      </div>

      {/* Social Assistance */}
      <h2 className="text-xl font-bold text-green-700 mb-4">
        Social Assistance Programs
      </h2>

      <p className="mb-4">
        In the past 12 months (July 01, 2021 - June 30, 2022), did any member of your household avail/receive benefits/grants/assistance/payment from any of the following social assistance programs?
      </p>

      {/* Program list */}
      {[
        'Regular 4Ps (Pantawid Pamilyang Pilipino Program)',
        'Modified 4Ps',
        'Unconditional Cash Transfer (UCT)',
        'Senior Citizen’s Social Pension',
        'Medical Assistance Program',
        'Student Financial Assistance',
        'Senior High School Voucher Program',
        'Emergency Shelter Assistance (ESA)',
        'Housing Program',
        'Health Assistance',
        'Others',
      ].map((program, idx) => (
        <div key={idx} className="mb-2">
          <label className="block mb-1">{String.fromCharCode(65 + idx)}. {program}</label>
          <select className="border p-2 rounded w-full">
            <option value="">-- Select --</option>
            <option value="YES">YES</option>
            <option value="NO">NO</option>
          </select>
        </div>
      ))}

      {/* Recipient name */}
      <div className="mt-4">
        <label className="block mb-1">
          Who among the household members received the benefits/grants/assistance/payment?
        </label>
        <input type="text" className="border p-2 rounded w-full" placeholder="Enter NAME here" />
      </div>

      {/* Number of times received */}
      <div className="mt-4">
        <label className="block mb-1">
          How many times did your household receive these benefits/grants/assistance?
        </label>
        <input type="text" className="border p-2 rounded w-full" placeholder="Enter number of times" />
      </div>

      {/* Other household members */}
      <div className="mt-4">
        <label className="block mb-1">
          Are there other household members who also received benefits from these programs?
        </label>
        <select className="border p-2 rounded w-full">
          <option value="">-- Select --</option>
          <option value="YES">YES</option>
          <option value="NO">NO</option>
        </select>
      </div>

      {/* Feeding */}
      <h3 className="text-lg font-bold text-green-700">Government Feeding Programs</h3>
      {renderYesNoSelect('feeding', 'received', 'In the past 12 months (July 01, 2021 - June 30, 2022). did any member of your household benefit from any feeding program by the government?')}
      <div className="mt-4">
        <label className="block mb-1 font-medium">Who among the household members benefitted from/availed the feeding program?</label>
        <input
          type="text"
          placeholder="Enter name(s) of beneficiaries"
          className="border p-2 rounded w-full"
          value={form.feeding.beneficiaries}
          onChange={(e) => handleChange('feeding', 'beneficiaries', e.target.value)}
        />
      </div>

      <div className="mt-4">
        <label className="block mb-1 font-medium">In the past 12 months (July 01, 2021 - June 30, 2022). how many times did your household benefit from the feeding program?</label>
        <input
          type="text"
          placeholder="Enter number of times received"
          className="border p-2 rounded w-full"
          value={form.feeding.timesReceived}
          onChange={(e) => handleChange('feeding', 'timesReceived', e.target.value)}
        />
      </div>

      {renderYesNoSelect('feeding', 'hasMore', 'Are there other members of your household who benefitted from/availed the feeding program?')}

      {/* Labor */}
      <h3 className="text-lg font-bold text-green-700 mt-6">Labor Market Intervention Programs</h3>
      <p className="mb-2 text-sm">
        In the past 12 months (July 01, 2021 - June 30, 2022), did any member of your household benefit from or avail any of the following labor market intervention programs?
      </p>

      {renderCheckboxGroup('labor', 'programs', [
        'Micro Enterprise Development Track/ Sustainable Livelihood Program (SLP)',
        'Employment Facilitation Track/ Sustainable Livelihood Program (SLP)',
        'Integrated Livelihood/Kabuhayan Program under Department of Labor and Employment',
        'Cash For Work',
        'Food for Work',
        'Community-Based Employment Program',
        'DOLE TUPAD “Barangay ko, Buhay Ko”'
      ], 'Select programs availed')}

      <div className="mt-4">
        <label className="block mb-1 font-medium">Who among the household members benefitted from/availed the(NAME OF LABOR MARKET INTERVENTATION PROGRAM)?</label>
        <input
          type="text"
          placeholder="Enter name(s) of beneficiaries"
          className="border p-2 rounded w-full"
          value={form.labor.beneficiaries}
          onChange={(e) => handleChange('labor', 'beneficiaries', e.target.value)}
        />
      </div>

      <div className="mt-4">
        <label className="block mb-1 font-medium">In the past 12 months (July 01, 2021 - June 30, 2022). how many times did your household receive benefits/grants/assistance/payment from the (NAME OF LABOR MARKET INTERVENTION PROGRAM)?</label>
        <input
          type="text"
          placeholder="Enter number of times received"
          className="border p-2 rounded w-full"
          value={form.labor.timesReceived}
          onChange={(e) => handleChange('labor', 'timesReceived', e.target.value)}
        />
      </div>

      {renderYesNoSelect('labor', 'hasMore', 'Are there other household members who received the benefits/grants/assistance/payment from the social assistance programs?')}


      {/* Agriculture */}
      <h3 className="text-lg font-bold text-green-700 mt-6">Agriculture and Fisheries Programs</h3>
      <p className="mb-2 text-sm">
        In the past 12 months (July 01, 2021 - June 30, 2022), what kind of benefits/grants/assistance/payment did any member of your household receive?
      </p>

      {renderCheckboxGroup('agri', 'programs', [
        'Production support services (e.g, seeds, fertilizer, pesticides)',
        'Production, post-production, postharvest and irrigation equipment/facilities',
        'Capacity development/training/technology transfer programs on agriculture and fisheries',
        'Cash',
        'Others'
      ], 'Select types of benefits/assistance received')}


      {/* Bayanihan */}
      <h3 className="text-lg font-bold text-green-700 mt-6">Bayanihan Act Social Assistance</h3>
      <p className="mb-2 text-sm">
        In the past 12 months (July 01, 2021 - June 30, 2022), did any member of your household receive benefit/grants/assistance/payment from any of the following social assistance programs?
      </p>

      {renderCheckboxGroup('bayanihan', 'programs', [
        'SAP (DSWD)',
        'DOLE CAMP (COVID-19 Adjustment Measures Program)',
        'DOLE AKAP (Assistance to Displaced Land- and Sea-based Workers)',
        'DTI Livelihood Seeding/Negosyo Serbisyo',
        'DA Rice Financial Aid (RFFA/FSRF)',
        'DSWD/Government COVID-19 Relief Assistance',
        'Non-Government Relief Assistance',
        'Bayanihan 2 (Health Workers Assistance)',
        'Bayanihan 2 (Agrarian Reform Beneficiaries)',
        'Bayanihan 2 (Students Assistance)',
        'Bayanihan 2 (Teachers Assistance)'
      ], 'Select programs availed')}


      <div className="pt-4">
        <button
          type="submit"
          className="bg-green-700 text-white px-6 py-2 rounded hover:bg-green-800"
        >
          Save & Continue &gt;
        </button>
      </div>
    </form>
  );
}
