'use client';

import { useState, useRef } from 'react';
import { db } from '@/firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

const buildingTypes = [
  'Single house',
  'Duplex house',
  'Apartment/Flat',
  'Condominum/CondoTel',
  'Other Multi-Unit Residential',
  'Commercial/Industrial/Agricultural',
  'Institutional Living Quarter',
  'None(Homeless, Cart)',
  'Other types of building',
  'Temporary evacuation center',
];

const roofMaterials = [
  'Galvanized Iron/Aluminum',
  'Concrete/Clay Tile',
  'Half Galvanized Iron and Half Concrete',
  'Wood/Bamboo',
  'Cogon/Nipa/Anahaw',
  'Asbestos',
  'Makeshift/Salvaged/Improvised materials',
  'Other',
];

const roofFramingMaterials = [
  'Concrete',
  'Steel',
  'Wood',
  'Bamboo',
  'None',
  'Other',
];

const wallMaterials = [
  'Concrete/Brick/Stone',
  'Half Concrete/Brick/Stone and Half Wood',
  'Wood',
  'Galvanized Iron/Aluminum',
  'Bamboo/Sawali/cogon/nipa',
  'Asbestos',
  'Glass',
  'Makeshift/Salvaged/Improvised materials',
  'None',
  'Concrete Hollow Blocks',
  'Concrete Hollow Blocks/Wood',
  'Shear Walls',
  'Other',
];

const floorMaterials = [
  'Ceramic Tile/Marble/Granite',
  'Cement/Brick/Stone',
  'Wood Plank',
  'Wood Tile/Parquet',
  'Vinyl/Carpet Tile',
  'Linoleum',
  'None',
  'Other',
];

const tenureStatuses = [
  'Owned',
  'Rented',
  'Occupied rent-free',
  'Other',
];

const electricitySources = [
  'Electricity Company',
  'Solar',
  'Generator',
  'Battery',
  'Other',
];

const lightingFuels = [
  'Electricity',
  'Kerosene',
  'Liquified Petroleum Gas',
  'Oil (Vegetable, Animal, and Others)',
  'Solar Panel/Solar Lamp',
  'None',
  'Other',
];

const cookingFuels = [
  'Electricity',
  'Kerosene',
  'Liquified Petroleum Gas',
  'Wood',
  'Charcoal',
  'None',
  'Other',
];

 

export default function HousingAmenitiesForm({ householdId, goToNext }) {
  const [formData, setFormData] = useState({
    buildingType: '',
    floorsCount: '',
    roofMaterial: '',
    roofFramingMaterial: '',
    outerWallMaterial: '',
    floorFinishMaterial: '',
    mainFloorMaterial: '',
    estimatedFloorArea: '',
    frameMaterial: '',
    bedroomsCount: '',
    tenureStatus: '',
    constructionYear: '',
    imputedRent: '',
    hasElectricity: '',
    electricitySources: [],
    lightingFuel: '',
    cookingFuel: '',
    ownedItemsCount: '',
  });

  const saveTimeout = useRef(null);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    setSaving(true);
    setSaveMessage('Saving...');

    saveTimeout.current = setTimeout(() => {
      setSaving(false);
      setSaveMessage('All changes saved.');
    }, 1500);
  };

  const toggleMultiSelect = (value) => {
    setFormData(prev => {
      const currentArray = prev.electricitySources || [];
      const updated = currentArray.includes(value)
        ? currentArray.filter(i => i !== value)
        : [...currentArray, value];
      handleChange('electricitySources', updated);
      return { ...prev, electricitySources: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveMessage('Saving...');

    try {
      const ref = doc(db, 'households', householdId, 'housingCharacteristics', 'main');
      await setDoc(ref, {
        ...formData,
        timestamp: new Date(),
      });

      toast.success('Housing & Amenities info saved!');
      setSaving(false);
      setSaveMessage('All changes saved.');
      if (goToNext) goToNext();
    } catch (error) {
      console.error('Failed to save housing amenities info:', error);
      toast.error('Failed to save data.');
      setSaving(false);
      setSaveMessage('Failed to save changes.');
    }
  };


  return (
    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto p-6 space-y-6">
      <h2 className="text-xl font-bold mb-4">Housing & Amenities Section</h2>

      <label className="block">
        What is the type of building occupied by your household?
        <select
          className="w-full border p-2 rounded mt-1"
          value={formData.buildingType}
          onChange={e => handleChange('buildingType', e.target.value)}
        >
          <option value="">-- Select type of building occupied --</option>
          {buildingTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </label>

      <label className="block mt-4">
        How many floors are there in this building?
        <input
          type="number"
          min="1"
          className="w-full border p-2 rounded mt-1"
          value={formData.floorsCount}
          onChange={e => handleChange('floorsCount', e.target.value)}
          placeholder="Enter number of floors"
        />
      </label>

      <label className="block mt-4">
        What is the main construction material of the roof of this building/housing unit?
        <select
          className="w-full border p-2 rounded mt-1"
          value={formData.roofMaterial}
          onChange={e => handleChange('roofMaterial', e.target.value)}
        >
          <option value="">Select type of construction material</option>
          {roofMaterials.map(material => (
            <option key={material} value={material}>{material}</option>
          ))}
        </select>
      </label>

      <label className="block mt-4">
        What is the main construction material for the roof framing of this building/housing unit?
        <select
          className="w-full border p-2 rounded mt-1"
          value={formData.roofFramingMaterial}
          onChange={e => handleChange('roofFramingMaterial', e.target.value)}
        >
          <option value="">Select type of roof framing</option>
          {roofFramingMaterials.map(material => (
            <option key={material} value={material}>{material}</option>
          ))}
        </select>
      </label>

      <label className="block mt-4">
        What is the construction material of the outer walls of this building/housing unit?
        <select
          className="w-full border p-2 rounded mt-1"
          value={formData.outerWallMaterial}
          onChange={e => handleChange('outerWallMaterial', e.target.value)}
        >
          <option value="">Select type of outer walls building</option>
          {wallMaterials.map(material => (
            <option key={material} value={material}>{material}</option>
          ))}
        </select>
      </label>

      <label className="block mt-4">
        What is the finishing material of the floor of the housing unit?
        <select
          className="w-full border p-2 rounded mt-1"
          value={formData.floorFinishMaterial}
          onChange={e => handleChange('floorFinishMaterial', e.target.value)}
        >
          <option value="">Select type of floor material</option>
          {floorMaterials.map(material => (
            <option key={material} value={material}>{material}</option>
          ))}
        </select>
      </label>

      <label className="block mt-4">
        What is the main construction material of the floor of this housing unit?
        <select
          className="w-full border p-2 rounded mt-1"
          value={formData.mainFloorMaterial}
          onChange={e => handleChange('mainFloorMaterial', e.target.value)}
        >
          <option value="">Select type of floor material</option>
          {floorMaterials.map(material => (
            <option key={material} value={material}>{material}</option>
          ))}
        </select>
      </label>

      <label className="block mt-4">
        What is the estimated floor area of this housing unit? (in square meters)
        <input
          type="number"
          min="0"
          className="w-full border p-2 rounded mt-1"
          value={formData.estimatedFloorArea}
          onChange={e => handleChange('estimatedFloorArea', e.target.value)}
          placeholder="Enter floor area"
        />
      </label>

      <label className="block mt-4">
        What is the frame material of this housing unit?
        <select
          className="w-full border p-2 rounded mt-1"
          value={formData.frameMaterial}
          onChange={e => handleChange('frameMaterial', e.target.value)}
        >
          <option value="">Select type of frame material</option>
          {floorMaterials.map(material => (
            <option key={material} value={material}>{material}</option>
          ))}
        </select>
      </label>

      <label className="block mt-4">
        How many bedrooms does the housing unit have?
        <input
          type="number"
          min="0"
          className="w-full border p-2 rounded mt-1"
          value={formData.bedroomsCount}
          onChange={e => handleChange('bedroomsCount', e.target.value)}
          placeholder="Enter number of bedrooms"
        />
      </label>

      <label className="block mt-4">
        What is the tenure status of the housing unit and lot occupied by your household?
        <select
          className="w-full border p-2 rounded mt-1"
          value={formData.tenureStatus}
          onChange={e => handleChange('tenureStatus', e.target.value)}
        >
          <option value="">Select type of tenure status</option>
          {tenureStatuses.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </label>

      <label className="block mt-4">
        When was the housing unit/building constructed? (Year)
        <input
          type="number"
          min="1800"
          max={new Date().getFullYear()}
          className="w-full border p-2 rounded mt-1"
          value={formData.constructionYear}
          onChange={e => handleChange('constructionYear', e.target.value)}
          placeholder="Enter year of construction"
        />
      </label>

      <label className="block mt-4">
        By your own estimate, how much is the imputed rent per month for the house and/or lot? (Currency)
        <input
          type="number"
          min="0"
          step="0.01"
          className="w-full border p-2 rounded mt-1"
          value={formData.imputedRent}
          onChange={e => handleChange('imputedRent', e.target.value)}
          placeholder="Enter imputed rent"
        />
      </label>

      <label className="block mt-4">
        Is there any electricity in the dwelling place?
        <select
          className="w-full border p-2 rounded mt-1"
          value={formData.hasElectricity}
          onChange={e => handleChange('hasElectricity', e.target.value)}
        >
          <option value="">Select</option>
          <option value="YES">YES</option>
          <option value="NO">NO</option>
        </select>
      </label>

      {formData.hasElectricity === 'YES' && (
        <fieldset className="mt-4 border rounded p-3">
          <legend className="font-semibold">What is/are the source/s of electricity in the dwelling place? (Select all that apply)</legend>
          {electricitySources.map(source => (
            <label key={source} className="block">
              <input
                type="checkbox"
                checked={formData.electricitySources.includes(source)}
                onChange={() => toggleMultiSelect(source)}
                className="mr-2"
              />
              {source}
            </label>
          ))}
        </fieldset>
      )}

      <label className="block mt-4">
        What type of fuel does this household use for lighting?
        <select
          className="w-full border p-2 rounded mt-1"
          value={formData.lightingFuel}
          onChange={e => handleChange('lightingFuel', e.target.value)}
        >
          <option value="">Select type of fuel</option>
          {lightingFuels.map(fuel => (
            <option key={fuel} value={fuel}>{fuel}</option>
          ))}
        </select>
      </label>

      <label className="block mt-4">
        What type of fuel does this household use most of the time for cooking?
        <select
          className="w-full border p-2 rounded mt-1"
          value={formData.cookingFuel}
          onChange={e => handleChange('cookingFuel', e.target.value)}
        >
          <option value="">Select type of fuel for cooking</option>
          {cookingFuels.map(fuel => (
            <option key={fuel} value={fuel}>{fuel}</option>
          ))}
        </select>
      </label>

      <label className="block mt-4">
        How many of each of the following items does the household own? (You can type numbers separated by commas or list items)
        <input
          type="text"
          className="w-full border p-2 rounded mt-1"
          value={formData.ownedItemsCount}
          onChange={e => handleChange('ownedItemsCount', e.target.value)}
          placeholder="Enter counts or list of items"
        />
      </label>

      <div className="pt-6 flex justify-end">
        <button
          className="bg-green-700 text-white px-6 py-2 rounded hover:bg-green-800"
          type="submit"
        >
          Save &amp; Continue &gt;
        </button>
      </div>
    </form>
  );
}
