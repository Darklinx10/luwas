// ===================
// 🔹 Susceptibility
// ===================
export function normalizeSusceptibility(value) {
  if (!value || typeof value !== "string") return "Unknown";

  const val = value.toLowerCase();

  if (val.includes("high")) return "High Susceptibility";
  if (val.includes("moderate")) return "Moderate Susceptibility";
  if (val.includes("low") || val.includes("least")) return "Low Susceptibility";
  if (val.includes("general")) return "Generally Susceptible";

  return "Unknown";
}

export function formatSusceptibility(value) {
  const normalized = normalizeSusceptibility(value);
  const colorMap = {
    "High Susceptibility": "text-red-700",
    "Moderate Susceptibility": "text-purple-700",
    "Low Susceptibility": "text-yellow-600",
    "Generally Susceptible": "text-orange-700",
    "Unknown": "text-gray-500",
  };

  return (
    <span className={`font-semibold ${colorMap[normalized]}`}>
      {normalized}
    </span>
  );
}

// ===================
// 🔹 Storm Surge
// ===================
export function normalizeStormSurge(value) {
  if (!value || typeof value !== "string") return "Unknown";

  const val = value.toLowerCase();

  if (val.includes("greater") || val.includes("4m")) return "Greater than 4m";
  if (val.includes(">1m") || val.includes("1m. to 4m.")) return "1m to 4m";
  if (val.includes("up to 1.0m") || val.includes("<=1m")) return "Up to 1m";

  return "Unknown";
}
export function formatStormSurge(value) {
  const normalized = normalizeStormSurge(value);
  const colorMap = {
    "Greater than 4m": "text-red-700",
    "1m to 4m": "text-orange-600",
    "Up to 1m": "text-yellow-600",
    "Unknown": "text-gray-500",
  };

  return <span className={`font-semibold ${colorMap[normalized]}`}>{normalized}</span>;
}


// ===================
// 🔹 Tsunami
// ===================
export function normalizeTsunami(value) {
  if (!value || typeof value !== "string") return "Unknown";

  const val = value.toLowerCase();

  if (val.includes("inundation")) return "Inundation Zone";
  if (val.includes("safe")) return "Safe Zone";

  return "Unknown";
}

export function formatTsunami(value) {
  const normalized = normalizeTsunami(value);
  const colorMap = {
    "Inundation Zone": "text-blue-700",
    "Safe Zone": "text-green-600",
    "Unknown": "text-gray-500",
  };

  return (
    <span className={`font-semibold ${colorMap[normalized]}`}>
      {normalized}
    </span>
  );
}

// ===================
// 🔹 Ground Shaking
// ===================
export function normalizeGroundShaking(intensity) {
  const val = Number(intensity) || 0;

  
  if (val >= 8) return "Intensity 8 and above";
  if (val >= 7) return "Up to Intensity 7";
  if (val >= 5) return "Up to Intensity 5–6";
  if (val >= 3) return "Up to Intensity 3–4";
  if (val > 0) return "Up to Intensity 1–2";
  return "Unknown";
}

export function formatGroundShaking(intensity) {
  const normalized = normalizeGroundShaking(intensity);
  const colorMap = {
    "Intensity 8 and above": "text-red-800",
    "Up to Intensity 7": "text-orange-300",
    // "Very Strong (VII)": "text-orange-600",
    // "Strong (V–VI)": "text-yellow-600",
    // "Moderate (III–IV)": "text-green-600",
    // "Weak (I–II)": "text-blue-600",
    // "Unknown": "text-gray-500",
  };

  return (
    <span className={`font-semibold ${colorMap[normalized]}`}>
      {normalized}
    </span>
  );
}
