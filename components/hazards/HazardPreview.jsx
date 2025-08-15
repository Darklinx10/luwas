import dynamic from 'next/dynamic';
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const GeoJSON = dynamic(() => import('react-leaflet').then(mod => mod.GeoJSON), { ssr: false });

export default function HazardPreview({ hazard, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg w-[90%] max-w-4xl p-4">
        <div className="flex justify-between items-center border-b pb-2 mb-4">
          <h2 className="text-lg font-bold">Preview Hazard Layer</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">✕</button>
        </div>
        <div className="h-[500px] w-full">
          <MapContainer center={[12.8797, 121.7740]} zoom={6} className="h-full w-full">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            {hazard.geojson && <GeoJSON data={hazard.geojson} />}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
