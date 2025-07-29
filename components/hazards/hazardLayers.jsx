'use client';
import { useEffect } from 'react';
import * as esri from 'esri-leaflet';
import L from 'leaflet';
import { faultCategories } from '@/app/utils/faultcategories';

export default function HazardLayers({ activeHazard, map, setLoading }) {
  useEffect(() => {
    if (!map || !activeHazard) return;

    let infoDiv;
    const info = L.control({ position: 'bottomright' });

    info.onAdd = function () {
      infoDiv = L.DomUtil.create('div');
      infoDiv.innerHTML = `
        <div id="info-content" class="w-[320px] sm:w-[400px] max-h-[40vh] overflow-y-auto p-4 bg-white rounded-lg shadow-lg text-sm border border-gray-200">
          <h4 class="font-semibold text-lg mb-2">Hazard Map Info</h4>
          <p>Select hazard layers using the dropdown.</p>
          <p>Zoom and pan to explore Bohol.</p>
        </div>`;
      return infoDiv;
    };

    info.addTo(map);

    function updateInfo(title, description) {
      const content = infoDiv?.querySelector('#info-content');
      if (content) {
        content.innerHTML = `
          <h4 class="font-semibold text-lg mb-2">${title}</h4>
          <p>${description}</p>
        `;
      }
    }

    const hazardLayers = {
      'Active Faults': esri.dynamicMapLayer({
        url: 'https://ulap-hazards.georisk.gov.ph/arcgis/rest/services/PHIVOLCSPublic/ActiveFault/MapServer',
        opacity: 1,
      })
        .on('loading', () => {
          setLoading(true);
          updateInfo(
            'Active Faults',
            `
            <p class="mb-2">Shows known active faults in the region.</p>
            <div class="space-y-1 text-xs">
                ${faultCategories.map(fault => {
                const strokeStyle =
                    fault.type.includes('Dashed') ? 'border-dashed' :
                    fault.type.includes('Dotted') ? 'border-dotted' : 'border-solid';

                const line =
                    fault.type.includes('Sawteeth') ? `
                    <svg width="40" height="10">
                        <path d="M0 5 L40 5" stroke="${fault.color}" stroke-width="2"/>
                        <path d="M5 0 L10 5 L5 10" fill="none" stroke="${fault.color}" stroke-width="1"/>
                        <path d="M15 0 L20 5 L15 10" fill="none" stroke="${fault.color}" stroke-width="1"/>
                    </svg>
                    ` :
                    `<div class="w-10 border-t-2 ${strokeStyle}" style="border-color:${fault.color};"></div>`;

                return `
                    <div class="flex items-center space-x-2">
                    ${line}
                    <span>${fault.category}, ${fault.type}</span>
                    </div>`;
                }).join('')}
            </div>
            `
            );
        })
        .on('load', () => setLoading(false)),

      'Liquefaction': esri.dynamicMapLayer({
        url: 'https://ulap-hazards.georisk.gov.ph/arcgis/rest/services/PHIVOLCSPublic/Liquefaction/MapServer',
        opacity: 0.7,
      })
        .on('loading', () => {
          setLoading(true);
          updateInfo('Liquefaction', `
        <p class="mb-3 text-gray-700">
            Soil areas likely to lose stability during strong earthquakes.
        </p>
        <h5 class="text-sm font-medium mb-2">Liquefaction Classes:</h5>
        <ul class="space-y-2">
            <li class="flex items-center gap-2">
                <span class="w-4 h-4 bg-[repeating-linear-gradient(-45deg,#000000,#000000_2px,#b91c1c_2px,#b91c1c_4px)] border border-black inline-block"></span>
                <span>High Potential</span>
            </li>
            <li class="flex items-center gap-2">
                <span class="w-4 h-4 bg-[repeating-linear-gradient(-45deg,#000000,#000000_2px,#5b21b6_2px,#5b21b6_4px)] border border-black inline-block"></span>
                <span>Moderate Potential</span>
            </li>
            <li class="flex items-center gap-2">
                <span class="w-4 h-4 bg-[repeating-linear-gradient(-45deg,#000000,#000000_2px,#eab308_2px,#eab308_4px)] border border-black inline-block"></span>
                <span>Low Potential</span>
            </li>
            <li class="flex items-center gap-2">
                <span class="w-4 h-4 bg-red-500 inline-block"></span>
                <span>Highly Susceptible</span>
            </li>
                <li class="flex items-center gap-2">
                <span class="w-4 h-4 bg-purple-700 inline-block"></span>
                <span>Moderately Susceptible</span>
            </li>
            <li class="flex items-center gap-2">
                <span class="w-4 h-4 bg-yellow-300 inline-block"></span>
                <span>Least Susceptible</span>
            </li>
            <li class="flex items-center gap-2">
                <span class="w-4 h-4 bg-orange-400 inline-block"></span>
                <span>Generally Susceptible</span>
            </li>
        </ul>
        `);

        })
        .on('load', () => setLoading(false)),

      'Rain Induced Landslide': esri.dynamicMapLayer({
        url: 'https://ulap-hazards.georisk.gov.ph/arcgis/rest/services/MGBPublic/RainInducedLandslide/MapServer',
        opacity: 0.7,
      })
        .on('loading', () => {
          setLoading(true);
          updateInfo('Rain Induced Landslide', `
        <p class="mb-3 text-gray-700">
            Rainfall-Induced Landslides (RIL) are slope failures triggered by prolonged or intense rainfall events.
        </p>
        <h5 class="text-sm font-medium mb-2">RIL Susceptibility Classes:</h5>
        <ul class="space-y-2">
            <li class="flex items-center gap-2">
            <span class="w-4 h-4 bg-[#8B4513] border border-[#8B4513]"></span>
            <span>Very High Susceptibility</span>
            </li>
            <li class="flex items-center gap-2">
            <span class="w-4 h-4 bg-[#FF0000] border border-red-600"></span>
            <span>High Susceptibility</span>
            </li>
            <li class="flex items-center gap-2">
            <span class="w-4 h-4 bg-[#049404] border border-green-600"></span>
            <span>Moderate Susceptibility</span>
            </li>
            <li class="flex items-center gap-2">
            <span class="w-4 h-4 bg-[#FFFF00] border border-yellow-400"></span>
            <span>Low Susceptibility</span>
            </li>
            <li class="flex items-center gap-2">
            <span class="w-4 h-4 bg-[repeating-linear-gradient(-45deg,#000000,#000000_2px,white_2px,white_4px)] border border-black"></span>
            <span>Debris Flow / Possible Accumulation Zone</span>
            </li>
        </ul>
        `);
        })
        .on('load', () => setLoading(false)),

      'Earthquake Induced Landslide': esri.dynamicMapLayer({
        url: 'https://ulap-hazards.georisk.gov.ph/arcgis/rest/services/PHIVOLCSPublic/EarthquakeInducedLandslide/MapServer',
        opacity: 0.7,
      })
        .on('loading', () => {
          setLoading(true);
          updateInfo('Earthquake InducedLandslide', `
        <p class="mb-3 text-gray-700">
            Earthquake-Induced Landslides (EIL) are slope movements triggered by seismic activity. Susceptibility varies depending on geological and topographical factors.
        </p>

        <h5 class="text-sm font-medium mb-2">EIL Susceptibility Classes:</h5>
        <ul class="space-y-2">
            <li class="flex items-center gap-2">
                <span class="w-4 h-4 bg-[#ff0000] inline-block  border-red-500"></span>
                <span>High Susceptibility</span>
            </li>
            <li class="flex items-center gap-2">
                <span class="w-4 h-4 bg-[#a200ff] inline-block  border-purple-500"></span>
                <span>Moderate Susceptibility</span>
            </li>
            <li class="flex items-center gap-2">
                <span class="w-4 h-4 bg-[#fffb00] inline-block  border-yellow-200"></span>
                <span>Low Susceptibility</span>
            </li>
            <li class="flex items-center gap-2">
                <span class="w-4 h-4 bg-[repeating-linear-gradient(-45deg,#87cefa,#87cefa_2px,white_2px,white_4px)] border border-blue-300 inline-block"></span>
                <span>Depositional Zone</span>
            </li>
        </ul>
        `);
        })
        .on('load', () => setLoading(false)),
        //No Access
      'Ground Shaking': esri.dynamicMapLayer({
        url: 'https://ulap-hazards.georisk.gov.ph/arcgis/rest/services/PHIVOLCS/GroundShaking/MapServer',
        opacity: 0.5,
      })
        .on('loading', () => {
          setLoading(true);
          updateInfo('Ground Shaking', 'Estimated seismic shaking intensity.');
        })
        .on('load', () => setLoading(false)),
        //No Access
      'Storm Surge': esri.dynamicMapLayer({
        url: 'https://ulap-hazards.georisk.gov.ph/arcgis/rest/services/PAGASAPublic/StormSurge/MapServer',
        opacity: 0.7,
      })
        .on('loading', () => {
          setLoading(true);
          updateInfo('Storm Surge', 'Flood-prone zones due to storm surge.');
        })
        .on('load', () => setLoading(false)),

      'Tsunami': esri.dynamicMapLayer({
        url: 'https://ulap-hazards.georisk.gov.ph/arcgis/rest/services/PHIVOLCSPublic/Tsunami/MapServer',
        opacity: 0.7,
      })
        .on('loading', () => {
          setLoading(true);
          updateInfo('Tsunami', `
            <p class="mb-3 text-gray-700">
                Inundation Description, Inundation Height
            </p>

            <ul class="space-y-2 text-sm">
                <li class="flex items-center gap-2">
                <span class="w-4 h-4 bg-[repeating-linear-gradient(-45deg,#ff0000,#ff0000_2px,white_2px,white_4px)] border border-red-600"></span>
                <span>General inundation, Inundated</span>
                </li>
                <li class="flex items-center gap-2">
                <span class="w-4 h-4 bg-[#FDEEDC] border border-gray-300"></span>
                <span>Inundation depth, &lt; 1 meter</span>
                </li>
                <li class="flex items-center gap-2">
                <span class="w-4 h-4 bg-[#FFFF00] border border-gray-300"></span>
                <span>Inundation depth, 1 to 1.99 meters</span>
                </li>
                <li class="flex items-center gap-2">
                <span class="w-4 h-4 bg-[#FFA500] border border-gray-300"></span>
                <span>Inundation depth, 2 to 2.99 meters</span>
                </li>
                <li class="flex items-center gap-2">
                <span class="w-4 h-4 bg-[#FFC0CB] border border-gray-300"></span>
                <span>Inundation depth, 3 to 3.99 meters</span>
                </li>
                <li class="flex items-center gap-2">
                <span class="w-4 h-4 bg-[#A020F0] border border-gray-300"></span>
                <span>Inundation depth, 4 to 4.99 meters</span>
                </li>
                <li class="flex items-center gap-2">
                <span class="w-4 h-4 bg-[#FF0000] border border-gray-300"></span>
                <span>Inundation depth, 5 to 6 meters</span>
                </li>
                <li class="flex items-center gap-2">
                <span class="w-4 h-4 bg-[#8B0000] border border-gray-300"></span>
                <span>Inundation depth, &gt; 6 meters</span>
                </li>
            </ul>
            `);

        })
        .on('load', () => setLoading(false)),
        //No Access
      'Landslide': esri.dynamicMapLayer({
        url: 'https://ulap-hazards.georisk.gov.ph/arcgis/rest/services/MGBPublic/Landslide/MapServer',
        opacity: 0.7,
      })
        .on('loading', () => {
          setLoading(true);
          updateInfo('Landslide', 'Areas susceptible to landslides.');
        })
        .on('load', () => setLoading(false)),
    };

    const selected = hazardLayers[activeHazard];
    if (selected) {
      selected.addTo(map);
    }

    return () => {
      info.remove();
      Object.values(hazardLayers).forEach((layer) => map.removeLayer(layer));
    };
  }, [map, activeHazard, setLoading]);

  return null;
}
