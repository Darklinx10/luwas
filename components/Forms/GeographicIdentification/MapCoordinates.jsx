import React from 'react';

export default function MapCoordinates({ form, setMapOpen }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="flex flex-col">
        <label htmlFor="latitude">Latitude</label>
        <input
          id="latitude"
          type="text"
          value={form.latitude}
          readOnly
          placeholder="Latitude will appear here"
          className="border p-2 rounded w-full"
        />
      </div>
      <div className="flex flex-col">
        <label htmlFor="longitude">Longitude</label>
        <input
          id="longitude"
          type="text"
          value={form.longitude}
          readOnly
          placeholder="Longitude will appear here"
          className="border p-2 rounded w-full"
        />
      </div>
      <div className="sm:col-span-2">
        <button
          type="button"
          onClick={() => setMapOpen(true)}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Pick Location from Map
        </button>
      </div>
    </div>
  );
}
