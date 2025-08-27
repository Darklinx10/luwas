import * as XLSX from "xlsx";
import fs from "fs";

// Load workbook
const fileBuffer = fs.readFileSync("C:/Users/Admin/bmis/public/PSGC-2Q-2025-Publication-Datafile.xlsx");
const workbook = XLSX.read(fileBuffer, { type: "buffer" });
const sheet = workbook.Sheets["PSGC"];
const rows = XLSX.utils.sheet_to_json(sheet);

// Initialize hierarchy
const geoData = { regions: [] };
let currentRegion = null;
let currentProvince = null;
let currentCityOrMun = null;

rows.forEach(row => {
  const code = String(row["10-digit PSGC"] || "").trim();
  const correspondence = String(row["Correspondence Code"] || "").trim();
  const name = String(row["Name"] || "").trim();
  const level = String(row["Geographic Level"] || "").trim();

  if (!code || !name || !level) return;

  switch (level) {
    case "Reg":
      // Start new region
      currentRegion = { code, correspondence, name };
      // Only add 'provinces' if there is at least one province
      currentRegion.provinces = [];
      currentRegion.cities = [];
      geoData.regions.push(currentRegion);
      currentProvince = null;
      currentCityOrMun = null;
      break;

    case "Prov":
      // Start new province
      currentProvince = { code, correspondence, name, cities: [] };
      if (currentRegion) currentRegion.provinces.push(currentProvince);
      currentCityOrMun = null;
      break;

    case "City":
    case "Mun":
      // Start new city/municipality
      currentCityOrMun = { code, correspondence, name, barangays: [] };
      if (currentProvince) {
        // City belongs to a province
        currentProvince.cities.push(currentCityOrMun);
      } else if (currentRegion) {
        // City directly under region (no province)
        currentRegion.cities.push(currentCityOrMun);
      }
      break;

    case "Bgy":
      if (currentCityOrMun) {
        currentCityOrMun.barangays.push({ code, correspondence, name });
      }
      break;
  }
});

// Cleanup empty provinces arrays
geoData.regions.forEach(region => {
  if (region.provinces.length === 0) {
    delete region.provinces; // remove empty provinces
  }
});

// Save JSON
fs.writeFileSync("public/data/geoData-ph.json", JSON.stringify(geoData, null, 2));
console.log(`✅ geoData-ph.json generated! Regions: ${geoData.regions.length}`);
