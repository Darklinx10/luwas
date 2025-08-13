import React from 'react';

export default function AddressFields({ form, handleChange }) {
  const fields = [
    { name: 'floorNo', label: 'Floor Number', placeholder: 'Enter floor number', autoComplete: 'address-line1' },
    { name: 'houseNo', label: 'House Number', placeholder: 'Enter house number', autoComplete: 'street-address' },
    { name: 'blockLotNo', label: 'Block / Lot Number', placeholder: 'Enter block/lot number', autoComplete: 'address-line2' },
    { name: 'streetName', label: 'Street Name', placeholder: 'Enter street name', autoComplete: 'address-line1' },
    { name: 'subdivision', label: 'Subdivision', placeholder: 'Enter subdivision', autoComplete: 'address-line3' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {fields.map(({ name, label, placeholder, autoComplete }) => (
        <div key={name} className="flex flex-col">
          <label htmlFor={name}>{label}</label>
          <input
            id={name}
            name={name}
            type="text"
            value={form[name]}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            placeholder={placeholder}
            autoComplete={autoComplete}
          />
        </div>
      ))}
    </div>
  );
}
