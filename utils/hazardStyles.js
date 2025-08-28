// hazardStyles.js

export const styleBySusceptibility = (value) => {
  let fillColor = '#ccc', fillOpacity = 0.7;
  switch (value) {
    case 'High Susceptibility':
    case 'Highly Susceptible': fillColor = '#e31a1c'; break;
    case 'Moderate Susceptibility':
    case 'Moderately Susceptible': fillColor = '#7e22ce'; break;
    case 'Low Susceptibility':
    case 'Least Susceptible': fillColor = '#facc15'; break;
    case 'Generally Susceptible': fillColor = '#fb923c'; break;
  }
  return { color: '#555', weight: 0.5, fillOpacity, fillColor };
};

export const activeFaultStyle = (feature) => {
  const value = feature.properties?.Risk || feature.properties?.Susceptibility || 'Unknown';
  let color = '#ccc', dashArray = '5,5';
  switch (value.toLowerCase()) {
    case 'high': color = '#b91c1c'; break;
    case 'moderate': color = '#f97316'; break;
    case 'low': color = '#facc15'; break;
  }
  return { color, weight: 3, opacity: 1, dashArray };
};

export const stormSurgeStyle = (feature) => {
  const value = feature.properties?.Inundation || feature.properties?.Inundiation || "N/A";
  console.log("🌊 Storm Surge properties:", feature.properties);
  console.log("🌊 Storm Surge value picked:", value);

  let fillColor = '#0ea5e9', fillOpacity = 0.6;
  switch (value.trim()) {
    case '>1m. to 4m. surges': fillColor = '#e31a1c'; break;
    case '>1m. to 4m.':
    case '1.0m to 4.0m': fillColor = '#f97316'; break;
    case 'Up to 1.0m':
    case '<=1m': fillColor = '#fde68a'; break;
    default: console.warn("⚠️ Storm Surge unmatched value:", value);
  }

  return { color: '#555', weight: 0.5, fillOpacity, fillColor };
};

export const tsunamiStyle = (feature) => {
  const desc = feature.properties?.descrption || feature.properties?.description || "";
  console.log("🌊 Tsunami properties:", feature.properties);
  console.log("🌊 Tsunami description picked:", desc);

  let fillColor = '#ea580c';
  if (desc.toLowerCase().includes("inundation")) fillColor = '#f97316';
  else console.warn("⚠️ Tsunami unmatched description:", desc);

  return { color: '#ea580c', weight: 1, fillOpacity: 0.7, fillColor };
};

export const groundShakingStyle = (feature) => {
  const intensity = parseFloat(feature.properties?.Intensity ?? 0);
  console.log("🌍 Ground Shaking properties:", feature.properties);
  console.log("🌍 Ground Shaking intensity picked:", intensity);

  let fillColor = '#ccc';
  if (intensity >= 9) fillColor = '#b91c1c';
  else if (intensity >= 8) fillColor = '#e31a1c';
  else if (intensity >= 7) fillColor = '#e3a081';
  else if (intensity >= 5) fillColor = '#f97316';
  else if (intensity >= 3) fillColor = '#facc15';
  else if (intensity > 0) fillColor = '#22c55e';
  else console.warn("⚠️ Ground Shaking unmatched intensity:", intensity);

  return { color: '#555', weight: 0.5, fillOpacity: 0.7, fillColor };
};

