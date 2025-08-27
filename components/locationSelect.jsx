'use client';

import { useEffect, useState } from 'react';

export default function LocationSelect() {
  const [geoData, setGeoData] = useState([]);

  useEffect(() => {
    fetch('/data/geoData-ph.json')
      .then((res) => res.json())
      .then((data) => setGeoData(data));
  }, []);

  return (
    <div>
      <h2 className="font-bold">Select Province</h2>
      <select className="border rounded p-2 w-full">
        {geoData.map((province) => (
          <option key={province.code} value={province.code}>
            {province.name}
          </option>
        ))}
      </select>
    </div>
  );
}
