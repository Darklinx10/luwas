'use client';

import { useState } from 'react';
import { db } from '@/firebase/config';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import geoData from '@/utils/geoData-ph.json';

/**
 * Migration component
 * @param {string} householdId - Firestore household document ID
 * @param {Array} members - Array of household members [{ id, firstName, ... }]
 * @param {function} goToNext - Callback to go to next step
 */
export default function Migration({ householdId, members, goToNext }) {
  const [isSaving, setIsSaving] = useState(false);

  // Initialize one migration form per member
  const [forms, setForms] = useState(
    (members || []).map((member) => ({
      memberId: member.id,
      region: '', province: '', city: '',
      motherRegion: '', motherProvince: '', motherCity: '', motherCountry: '',
      prevRegion: '', prevProvince: '', prevCity: '', prevCountry: '',
      sixMoRegion: '', sixMoProvince: '', sixMoCity: '', sixMoCountry: '',
      reasonForMoving: '',
      isOFW: '',
      ofwType: '',
      departureDate: '',
      monthsAbroad: '',
    }))
  );

  // Helper: Get regions
  const getRegions = () => geoData.regions;

  // Helper: Get provinces for a region
  const getProvinces = (regionCode) => {
    const region = geoData.regions.find(r => r.code === regionCode);
    return region?.provinces || [];
  };

  // Helper: Get cities for region + province
  const getCities = (regionCode, provinceCode) => {
    const region = geoData.regions.find(r => r.code === regionCode);
    if (!region) return [];
    if (provinceCode) {
      const province = region.provinces.find(p => p.code === provinceCode);
      return province?.cities || [];
    }
    return region.cities || [];
  };

  // Handle input changes
  const handleChange = (index, e) => {
    const { name, value } = e.target;
    const updatedForms = [...forms];
    updatedForms[index][name] = value;

    // Reset dependent fields for cascading dropdowns
    if (name.includes('Region')) {
      const prefix = name.replace('Region', '');
      updatedForms[index][`${prefix}Province`] = '';
      updatedForms[index][`${prefix}City`] = '';
    } else if (name.includes('Province')) {
      const prefix = name.replace('Province', '');
      updatedForms[index][`${prefix}City`] = '';
    }

    setForms(updatedForms);
  };

  // Save to Firestore
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const saveTasks = forms.map(async (form) => {
        const memberRef = doc(db, 'households', householdId, 'members', form.memberId);
        const migrationRef = doc(memberRef, 'migration', 'main');
        await setDoc(migrationRef, form);
      });

      await Promise.all(saveTasks);

      // Save migration summary to household doc
      await updateDoc(doc(db, 'households', householdId), {
        migrationData: forms,
      });

      toast.success('Migration information saved!');
      goToNext();
    } catch (error) {
      console.error('❌ Error saving migration data:', error);
      toast.error('Failed to save migration data.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pr-2">
      <h2 className="text-lg font-semibold text-green-600">
        Migration Information (For all household members 5 years old and over)
      </h2>

      {forms.map((form, index) => (
        <fieldset key={form.memberId} className="border border-gray-300 rounded p-4 space-y-6">
          <legend className="text-sm font-semibold text-gray-600 px-2">
            Household Member {index + 1}{' '}
            <span className="font-normal text-gray-500">
              ({members[index]?.firstName || 'Unknown'})
            </span>
          </legend>

          {/* Mother's Address at Birth */}
          <div>
            <h3 className="font-semibold">Mother’s Address at Birth</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Region */}
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-700">Region</label>
                <select
                  name="motherRegion"
                  value={form.motherRegion}
                  onChange={(e) => handleChange(index, e)}
                  className="border p-2 rounded"
                >
                  <option value="">Select Region</option>
                  {getRegions().map(r => (
                    <option key={r.code} value={r.code}>{r.name}</option>
                  ))}
                </select>
              </div>

              {/* Province */}
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-700">Province</label>
                <select
                  name="motherProvince"
                  value={form.motherProvince}
                  onChange={(e) => handleChange(index, e)}
                  className="border p-2 rounded"
                  disabled={!form.motherRegion || getProvinces(form.motherRegion).length === 0}
                >
                  <option value="">Select Province</option>
                  {getProvinces(form.motherRegion).map(p => (
                    <option key={p.code} value={p.code}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* City */}
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-700">City / Municipality</label>
                <select
                  name="motherCity"
                  value={form.motherCity}
                  onChange={(e) => handleChange(index, e)}
                  className="border p-2 rounded"
                  disabled={!form.motherRegion || (!form.motherProvince && getCities(form.motherRegion).length === 0)}
                >
                  <option value="">Select City / Municipality</option>
                  {getCities(form.motherRegion, form.motherProvince).map(c => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Country */}
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-700">Country</label>
                <input
                  name="motherCountry"
                  value={form.motherCountry}
                  onChange={(e) => handleChange(index, e)}
                  placeholder="Country"
                  className="border p-2 rounded"
                />
              </div>
            </div>
          </div>

          {/* Residence 5 Years Ago */}
          <div>
            <h3 className="font-semibold">Residence 5 Years Ago</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {['prevRegion', 'prevProvince', 'prevCity', 'prevCountry'].map(field => (
                <div key={field} className="flex flex-col">
                  <label className="mb-1 text-sm font-medium text-gray-700">
                    {field.includes('Region') ? 'Region' :
                     field.includes('Province') ? 'Province' :
                     field.includes('City') ? 'City/Municipality' : 'Country'}
                  </label>

                  {field.includes('Region') ? (
                    <select
                      name={field}
                      value={form[field]}
                      onChange={(e) => handleChange(index, e)}
                      className="border p-2 rounded"
                    >
                      <option value="">Select Region</option>
                      {getRegions().map(r => (
                        <option key={r.code} value={r.code}>{r.name}</option>
                      ))}
                    </select>
                  ) : field.includes('Province') ? (
                    <select
                      name={field}
                      value={form[field]}
                      onChange={(e) => handleChange(index, e)}
                      className="border p-2 rounded"
                      disabled={!form[`${field.replace('Province','Region')}`] || getProvinces(form[`${field.replace('Province','Region')}`]).length === 0}
                    >
                      <option value="">Select Province</option>
                      {getProvinces(form[`${field.replace('Province','Region')}`]).map(p => (
                        <option key={p.code} value={p.code}>{p.name}</option>
                      ))}
                    </select>
                  ) : field.includes('City') ? (
                    <select
                      name={field}
                      value={form[field]}
                      onChange={(e) => handleChange(index, e)}
                      className="border p-2 rounded"
                      disabled={!form[`${field.replace('City','Region')}`] || (!form[`${field.replace('City','Province')}`] && getCities(form[`${field.replace('City','Region')}`]).length === 0)}
                    >
                      <option value="">Select City / Municipality</option>
                      {getCities(form[`${field.replace('City','Region')}`], form[`${field.replace('City','Province')}`]).map(c => (
                        <option key={c.code} value={c.code}>{c.name}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      name={field}
                      value={form[field]}
                      onChange={(e) => handleChange(index, e)}
                      placeholder="Country"
                      className="border p-2 rounded"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Residence 6 Months Ago */}
          <div>
            <h3 className="font-semibold">Residence 6 Months Ago</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {['sixMoRegion', 'sixMoProvince', 'sixMoCity', 'sixMoCountry'].map(field => (
                <div key={field} className="flex flex-col">
                  <label className="mb-1 text-sm font-medium text-gray-700">
                    {field.includes('Region') ? 'Region' :
                     field.includes('Province') ? 'Province' :
                     field.includes('City') ? 'City/Municipality' : 'Country'}
                  </label>

                  {field.includes('Region') ? (
                    <select
                      name={field}
                      value={form[field]}
                      onChange={(e) => handleChange(index, e)}
                      className="border p-2 rounded"
                    >
                      <option value="">Select Region</option>
                      {getRegions().map(r => (
                        <option key={r.code} value={r.code}>{r.name}</option>
                      ))}
                    </select>
                  ) : field.includes('Province') ? (
                    <select
                      name={field}
                      value={form[field]}
                      onChange={(e) => handleChange(index, e)}
                      className="border p-2 rounded"
                      disabled={!form[`${field.replace('Province','Region')}`] || getProvinces(form[`${field.replace('Province','Region')}`]).length === 0}
                    >
                      <option value="">Select Province</option>
                      {getProvinces(form[`${field.replace('Province','Region')}`]).map(p => (
                        <option key={p.code} value={p.code}>{p.name}</option>
                      ))}
                    </select>
                  ) : field.includes('City') ? (
                    <select
                      name={field}
                      value={form[field]}
                      onChange={(e) => handleChange(index, e)}
                      className="border p-2 rounded"
                      disabled={!form[`${field.replace('City','Region')}`] || (!form[`${field.replace('City','Province')}`] && getCities(form[`${field.replace('City','Region')}`]).length === 0)}
                    >
                      <option value="">Select City / Municipality</option>
                      {getCities(form[`${field.replace('City','Region')}`], form[`${field.replace('City','Province')}`]).map(c => (
                        <option key={c.code} value={c.code}>{c.name}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      name={field}
                      value={form[field]}
                      onChange={(e) => handleChange(index, e)}
                      placeholder="Country"
                      className="border p-2 rounded"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Reason for Moving */}
          <div className="flex flex-col">
            <label htmlFor={`reasonForMoving-${index}`} className="mb-1 text-sm font-medium text-gray-700">
              Reason for Moving or Staying
            </label>
            <select
              id={`reasonForMoving-${index}`}
              name="reasonForMoving"
              value={form.reasonForMoving}
              onChange={(e) => handleChange(index, e)}
              className="border p-2 rounded"
            >
              <option value="">Select reason</option>
              {Array.from({length:19}, (_,i)=>(
                <option key={i}>{String(i+1).padStart(2,'0')} - Reason {i+1}</option>
              ))}
            </select>
          </div>

          {/* OFW Section */}
          <div className="flex flex-col">
            <label htmlFor={`isOFW-${index}`} className="mb-1 text-sm font-medium text-gray-700">
              Are you an Overseas Filipino?
            </label>
            <select
              id={`isOFW-${index}`}
              name="isOFW"
              value={form.isOFW}
              onChange={(e) => handleChange(index, e)}
              className="border p-2 rounded"
            >
              <option value="">Select</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>

          {form.isOFW === 'Yes' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label htmlFor={`ofwType-${index}`} className="mb-1 text-sm font-medium text-gray-700">OFW Type</label>
                <select
                  id={`ofwType-${index}`}
                  name="ofwType"
                  value={form.ofwType}
                  onChange={(e) => handleChange(index, e)}
                  className="border p-2 rounded"
                >
                  <option value="">Select OFW Type</option>
                  <option value="Contract">OFW with Contract</option>
                  <option value="NoContract">Other OFW (No Contract)</option>
                  <option value="Embassy">PH Embassy Employee</option>
                  <option value="Student">Student Abroad</option>
                  <option value="Tourist">Tourist</option>
                  <option value="NEC">Not Elsewhere Classified</option>
                  <option value="Resident">Resident (PH)</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label htmlFor={`departureDate-${index}`} className="mb-1 text-sm font-medium text-gray-700">Departure Date</label>
                <input
                  id={`departureDate-${index}`}
                  type="month"
                  name="departureDate"
                  value={form.departureDate}
                  onChange={(e) => handleChange(index, e)}
                  className="border p-2 rounded"
                />
              </div>

              <div className="flex flex-col">
                <label htmlFor={`monthsAbroad-${index}`} className="mb-1 text-sm font-medium text-gray-700">Months Abroad</label>
                <input
                  id={`monthsAbroad-${index}`}
                  type="number"
                  name="monthsAbroad"
                  value={form.monthsAbroad}
                  onChange={(e) => handleChange(index, e)}
                  placeholder="Months Abroad"
                  className="border p-2 rounded"
                />
              </div>
            </div>
          )}
        </fieldset>
      ))}

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
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
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
