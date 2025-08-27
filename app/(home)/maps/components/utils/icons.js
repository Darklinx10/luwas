import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x.src,
  iconUrl: markerIcon.src,
  shadowUrl: markerShadow.src,
});

export const houseIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/7720/7720546.png',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -32]
});

export const accidentIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/564/564619.png',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -32]
});

export const affectedIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/4539/4539472.png',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -32]
});

export const plusMarkerIcon = L.divIcon({
  className: 'custom-plus-icon',
  html: '<div style="color: red; font-size: 24px;">➕</div>',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});
