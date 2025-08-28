// geoUtils.js
import proj4 from 'proj4';

export const sourceProj = 'EPSG:32651'; // Adjust to your GeoJSON source CRS
export const targetProj = 'EPSG:4326';

// Recursively reproject coordinates
export const reprojectCoordinates = (coords) => {
  if (typeof coords[0] === 'number') {
    return proj4(sourceProj, targetProj, coords);
  } else {
    return coords.map(reprojectCoordinates);
  }
};

// Reproject GeoJSON and update CRS
export const reprojectGeoJSON = (geojson) => {
  if (geojson.type === 'FeatureCollection') {
    geojson.features = geojson.features.map((feature) => {
      feature.geometry.coordinates = reprojectCoordinates(feature.geometry.coordinates);
      return feature;
    });
  } else if (geojson.type === 'Feature') {
    geojson.geometry.coordinates = reprojectCoordinates(geojson.geometry.coordinates);
  }

  // Update CRS to EPSG:4326
  geojson.crs = {
    type: 'name',
    properties: { name: 'urn:ogc:def:crs:EPSG::4326' },
  };

  return geojson;
};
