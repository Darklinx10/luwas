'use client';

import { useState, useRef } from 'react';
import { db } from '@/firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

// Dropdown options (used for select inputs)
const buildingTypes = [
  'Single House',
  'Duplex',
  'Multi-unit Residential (e.g., apartment)',
  'Commercial/Industrial/Agricultural Building',
  'Institutional Living Quarters (e.g., dormitory, hospital)',
  'Other Housing Unit (e.g., makeshift, boat, cave)',
  'None (e.g., street dwelling)',
];

const roofMaterials = [
  'Galvanized Iron/Aluminum',
  'Cogon/Nipa/Anahaw',
  'Asbestos',
  'Makeshift/Salvaged/Improvised Materials',
  'Concrete/Clay Tile',
  'Half Galvanized Iron and Half Concrete',
  'Wood/Bamboo',
  'Others',
];


const roofFramingMaterials = [
  'Wood',
  'Steel/Metal',
  'Bamboo',
  'Coconut Lumber',
  'Concrete',
  'Others',
];


const wallMaterials = [
  'Concrete/Brick/Stone',
  'Wood',
  'Half Concrete / Half Wood',
  'Bamboo / Sawali / Cogon / Nipa',
  'Asbestos',
  'Makeshift / Salvaged / Improvised Materials',
  'Half Concrete/Brick/Stone and Half Wood',
  'Galvanized Iron/Aluminum',
  'Glass',
  'Concrete Hollow Blocks',
  'Concrete Hollow Blocks/Wood',
  'Shear Walls',
  'Others',
];


const floorMaterials = [
  'Wood Planks',
  'Ceramic Tile/Marble/Granite',
  'Cement/Brick/Stone',
  'Wood Tiles/Parquet',
  'Vinyl/Carpet Tiles',
  'Linoleum',
  'None',
  'Others',
];

const mainFloorMaterial = [
  'Concrete',
  'Coconut Lumber',
  'Bamboo',
  'Earth/Sand/Mud',
  'Vinyl/Carpet Tiles',
  'Makeshift/Salvaged/Improvised Materials',
  'Others, Specify',
]


const tenureStatuses = [
  'Own or Owner-Like Possession of the House and Lot Own house, Rent Lot',
  'Own house, Rent-Free Lot with Consent of Owner',
  'Own house, Rent-Free Lot without Consent of Owner',
  'Rent House/Room, Including Lot',
  'Rent-Free House Lot with Consent of Owner',
  'Rent-Free House Lot without Consent of Owner',
];

const electricitySources = [
  'Electric Company (e.g., MERALCO)',
  'Solar Panel',
  'Generator',
  'Battery / Power Bank',
  'None',
  'Other Source',
];

const lightingFuels = [
  'Electricity',
  'Kerosene',
  'Battery-powered Light',
  'Solar Lamp',
  'Candle',
  'None',
  'Other Fuel',
];

const cookingFuels = [
  'Liquefied Petroleum Gas (LPG)',
  'Kerosene',
  'Charcoal',
  'Wood',
  'Electricity',
  'None',
  'Other Fuel',
];

const framingMaterials = [
  'Wood',
  'Wood Column Only',
  'Concrete',
  'Steel',
  'Bamboo',
  'Light Metal',
  'Concrete GF + Wood 2F',
  'Concrete Column Only, No Beam',
  'Concrete Column Only + Wood 2F/ No Concrete Column 1F + Wood 2F',
  'Concrete Column Only, Wooden Beam',
  'Concrete Column Only, Steel Beam',
  'Steel Column, Wooden Beam',
  'None',
  'Others, Specify',

];

const ownedItems = [
  'HOUSEHOLD CONVENIENCES',
  'Refrigerator/ Freezer',
  'Stove with oven/Gas Range',
  'Electric Fan',
  'Air Conditioner',
  'Microwave Oven',
  'Washing Machine',
  'Vacuum Cleaner',
  'Rice Cooker',
  'Electric Kettle',
  'Television',

  'ICT DEVICES',
  'Laptop/Computer',
  'Tablet',
  'Smartphone',
  'Internet Router/Modem',
  'Television',
  'Radio/Radio cassette (AM, FM, and transistor)',
  'CD/DVD/VCD Player',
  'Audio component/Stereo set/Karaoke/Videoke',
  'Landline/Wireless telephone',

  'VEHICLES',
  'Bicycle',
  'Motorcycle',
  'Car',
  'Truck',
  'Pedicab',
  'Jeep',
  'Van',
  'Motorized boat/Banca',
  'Non-Motorized boat/Banca',
  'Tricycle',
];

const televisionServices = [
  'Cable TV (CATV)',
  'Direct-To-Home (DTH) Satellite Services',
  'IPTV',
  'Digital Terrestrial TV (DTT)',
  'Analog Television',
]

const ownAnimals = [
  'Carabao',
  'Cattle',
  'Horses',
  'Swine',
  'Goats',
  'Sheep',
  'Chickens/Duck/Poultry',
  'Others, specify',
]

export default function HousingAmenitiesForm({ householdId, goToNext }) {
  // Main form state
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
    electricitySources: [],  // array
    lightingFuel: '',
    cookingFuel: '',
    ownedItems: [],  
    ownAnimals: [],
    televisionServices: [],  
  });

  const [isSaving, setIsSaving] = useState(false); // Used to disable form while saving

  // General change handler
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Fix toggleMultiSelect: update state inside setFormData callback without calling handleChange
  const toggleMultiSelect = (value) => {
    setFormData(prev => {
      const currentArray = prev.electricitySources || [];
      const updated = currentArray.includes(value)
        ? currentArray.filter(i => i !== value)
        : [...currentArray, value];
      return { ...prev, electricitySources: updated };
    });
  };

  // Submit handler remains unchanged
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const ref = doc(db, 'households', householdId, 'housingCharacteristics', 'main');
      await setDoc(ref, {
        ...formData,
        timestamp: new Date(),
      });

      toast.success('Housing & Amenities info saved!');
      if (goToNext) goToNext();
    } catch (error) {
      console.error('Failed to save housing amenities info:', error);
      toast.error('Failed to save data.');
    } finally {
      setIsSaving(false);
    }
  };




  return (
    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto p-6 space-y-6">
      <h2 className="text-xl font-bold mb-4">Housing & Amenities Section</h2>

      {/**Question 1 */}
      <label htmlFor='buildingType' className="block">
        What is the type of building occupied by your household?
        <select
          id='buildingType'
          name='buildingType'
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
      
      {/**Question 2 */}
      <label htmlFor='floorsCount' className="block mt-4">
        How many floors are there in this building?
        <input 
          id='floorsCount'
          name='floorsCount'
          type="number"
          min="1"
          className="w-full border p-2 rounded mt-1"
          value={formData.floorsCount}
          onChange={e => handleChange('floorsCount', e.target.value)}
          placeholder="Enter number of floors"
        />
      </label>

      {/**Question 3 */}    
      <label htmlFor='roofMaterial' className="block mt-4">
        What is the main construction material of the roof of this building/housing unit?
        <select
          id='roofMaterial'
          name='roofMaterial'
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
      
      {/**Question 3.1 */}
      <label htmlFor='roofFramingMaterial' className="block mt-4">
        What is the main construction material for the roof framing of this building/housing unit?
        <select
          id='roofFramingMaterial'
          name='roofFramingMaterial'
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
      
      {/**Question 4 */}
      <label htmlFor='outerWallMaterial' className="block mt-4">
        What is the construction material of the outer walls of this building/housing unit?
        <select
          id='outerWallMaterial'
          name='outerWallMaterial'
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
      
      {/**Question 5 */}
      <label htmlFor='floorFinishMaterial' className="block mt-4">
        What is the finishing material of the floor of the housing unit?
        <select
          id='floorFinishMaterial'
          name='floorFinishMaterial'
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
      
      {/**Question 6 */}
      <label htmlFor='mainFloorMaterial' className="block mt-4">
        What is the main construction material of the floor of this housing unit?
        <select
          id='mainFloorMaterial'
          name='mainFloorMaterial'
          className="w-full border p-2 rounded mt-1"
          value={formData.mainFloorMaterial}
          onChange={e => handleChange('mainFloorMaterial', e.target.value)}
        >
          <option value="">Select type of floor material</option>
          {mainFloorMaterial.map(material => (
            <option key={material} value={material}>{material}</option>
          ))}
        </select>
      </label>
        
      {/**Question 7 */}
      <label htmlFor='estimatedFloorArea' className="block mt-4">
        What is the estimated floor area of this housing unit? (in square meters)
        <input
          id='estimatedFloorArea'
          name='estimatedFloorArea'
          type="number"
          min="0"
          className="w-full border p-2 rounded mt-1"
          value={formData.estimatedFloorArea}
          onChange={e => handleChange('estimatedFloorArea', e.target.value)}
          placeholder="Enter floor area"
        />
      </label>
      
      {/**Question 8 */}
      <label htmlFor='frameMaterial' className="block mt-4">
        What is the frame material of this housing unit?
        <select
          id='frameMaterial'
          name='frameMaterial'
          className="w-full border p-2 rounded mt-1"
          value={formData.frameMaterial}
          onChange={e => handleChange('frameMaterial', e.target.value)}
        >
          <option value="">Select type of frame material</option>
          {framingMaterials.map(material => (
            <option key={material} value={material}>{material}</option>
          ))}
        </select>
      </label>
      
      {/**Question 9 */}
      <label htmlFor='bedroomsCount' className="block mt-4">
        How many bedrooms does the housing unit have?
        <input
          id='bedroomsCount'
          name='bedroomsCount'
          type="number"
          min="0"
          className="w-full border p-2 rounded mt-1"
          value={formData.bedroomsCount}
          onChange={e => handleChange('bedroomsCount', e.target.value)}
          placeholder="Enter number of bedrooms"
        />
      </label>

      {/**Question 10 */} 
      <label htmlFor='tenureStatus' className="block mt-4">
        What is the tenure status of the housing unit and lot occupied by your household?
        <select
          id='tenureStatus'
          name='tenureStatus'
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
      
      {/**Question 10.1 */}
      <label htmlFor='constructionYear' className="block mt-4">
        When was the housing unit/building constructed? (Year)
        <input
          id='constructionYear'
          name='constructionYear'
          type="number"
          min="1800"
          max={new Date().getFullYear()}
          className="w-full border p-2 rounded mt-1"
          value={formData.constructionYear}
          onChange={e => handleChange('constructionYear', e.target.value)}
          placeholder="Enter year of construction"
        />
      </label>
      
      {/**Question 11 */}
      <label htmlFor='imputedRent' className="block mt-4">
        By your own estimate, how much is the imputed rent per month for the house and/or lot? (Currency)
        <input
          id='imputedRent'
          name='imputedRent'
          type="number"
          min="0"
          step="0.01"
          className="w-full border p-2 rounded mt-1"
          value={formData.imputedRent}
          onChange={e => handleChange('imputedRent', e.target.value)}
          placeholder="Enter imputed rent"
        />
      </label>

      {/**Question 12 */}
      <label htmlFor='hasElectricity' className="block mt-4">
        Is there any electricity in the dwelling place?
        <select
          id='hasElectricity'
          name='hasElectricity'
          className="w-full border p-2 rounded mt-1"
          value={formData.hasElectricity}
          onChange={e => handleChange('hasElectricity', e.target.value)}
        >
          <option value="">Select</option>
          <option value="YES">YES</option>
          <option value="NO">NO</option>
        </select>
      </label>
      
      {/**Question 13 */}
      {formData.hasElectricity === 'YES' && (
        <fieldset className="mt-4 border rounded p-3">
          <legend className="font-semibold">What is/are the source/s of electricity in the dwelling place? (Select all that apply)</legend>
          {electricitySources.map(source => (
            <label htmlFor='electricitySources' key={source} className="block">
              <input
                id='electricitySources'
                name='electricitySources'
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

      {/**Question 14 */}
      <label htmlFor='lightingFuel' className="block mt-4">
        What type of fuel does this household use for lighting?
        <select
          id='lightingFuel'
          name='lightingFuel'
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
      
      {/**Question 15 */}
      <label htmlFor='cookingFuel' className="block mt-4">
        What type of fuel does this household use most of the time for cooking?
        <select
          id='cookingFuel'
          name='cookingFuel'
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
      
      {/* Question 16 - Fix ownedItemsCount → ownedItems */}
      <label className="block mt-4">
        Please select all the items that the household owns:
        <div className="mt-2 border border-gray-300 rounded-md p-4 max-w-md max-h-60 overflow-y-auto">
          {ownedItems.map((item, index) => {
            const isCategory =
              item === 'HOUSEHOLD CONVENIENCES' ||
              item === 'ICT DEVICES' ||
              item === 'VEHICLES';

            if (isCategory) {
              return (
                <div
                  key={index}
                  className="font-bold text-gray-500 mt-3 mb-1 select-none"
                >
                  {item}
                </div>
              );
            }

            return (
              <div key={index} className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id={`ownedItem-${index}`}
                  name="ownedItems"
                  value={item}
                  checked={formData.ownedItems.includes(item)}  // corrected here
                  onChange={e => {
                    const { checked, value } = e.target;
                    let updatedItems = [...formData.ownedItems];

                    if (checked) {
                      if (!updatedItems.includes(value)) {
                        updatedItems.push(value);
                      }
                    } else {
                      updatedItems = updatedItems.filter(i => i !== value);
                    }

                    handleChange('ownedItems', updatedItems);  // corrected here
                  }}
                  className="mr-2"
                />
                <label htmlFor={`ownedItem-${index}`}>{item}</label>
              </div>
            );
          })}
        </div>
      </label>

      {/* Question 17 */}
      <label className="block mt-4">
        Does this household have any of the following television services?
        <div className="mt-2 border border-gray-300 rounded-md p-4 max-w-md max-h-60 overflow-y-auto">
          {televisionServices.map((item, index) => {
            // If you have any categories, define them here:
            const isCategory =
              item === 'CABLE SERVICES' ||
              item === 'SATELLITE SERVICES' ||
              item === 'INTERNET TV'; // Example categories (adjust as needed)

            if (isCategory) {
              return (
                <div
                  key={index}
                  className="font-bold text-gray-500 mt-3 mb-1 select-none"
                >
                  {item}
                </div>
              );
            }

            return (
              <div key={index} className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id={`televisionService-${index}`}
                  name="televisionServices"
                  value={item}
                  checked={formData.televisionServices.includes(item)}
                  onChange={e => {
                    const { checked, value } = e.target;
                    let updatedServices = [...formData.televisionServices];

                    if (checked) {
                      if (!updatedServices.includes(value)) {
                        updatedServices.push(value);
                      }
                    } else {
                      updatedServices = updatedServices.filter(s => s !== value);
                    }

                    handleChange('televisionServices', updatedServices);
                  }}
                  className="mr-2"
                />
                <label htmlFor={`televisionService-${index}`}>{item}</label>
              </div>
            );
          })}
        </div>
</label>



      {/** Question 18 */}
      <label className="block mt-4">
        Please select all the animals this household owns:
        <div className="mt-2 border border-gray-300 rounded-md p-4 max-w-md">
          {ownAnimals.map((animal, index) => (
            <div key={index} className="flex items-center mb-2">
              <input
                type="checkbox"
                id={`ownAnimal-${index}`}
                name="ownAnimals"
                value={animal}
                checked={formData.ownAnimals.includes(animal)}
                onChange={e => {
                  const { checked, value } = e.target;
                  let updatedAnimals = [...formData.ownAnimals];

                  if (checked) {
                    if (!updatedAnimals.includes(value)) {
                      updatedAnimals.push(value);
                    }
                  } else {
                    updatedAnimals = updatedAnimals.filter(a => a !== value);
                  }

                  handleChange('ownAnimals', updatedAnimals);
                }}
                className="mr-2"
              />
              <label htmlFor={`ownAnimal-${index}`}>{animal}</label>
            </div>
          ))}
        </div>
      </label>

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
