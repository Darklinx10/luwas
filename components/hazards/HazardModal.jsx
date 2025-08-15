import { FiUploadCloud } from 'react-icons/fi';

export default function HazardModal({
  hazardType, setHazardType,
  description, setDescription,
  geojsonFile, setGeojsonFile,
  onClose, onSave
}) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-[90%] max-w-md">
        <h2 className="text-xl font-bold mb-4 text-center">Add Hazard Layer</h2>

        {/* Type */}
        <label className="block text-sm font-medium mb-1">Hazard Type</label>
        <select
          value={hazardType}
          onChange={(e) => setHazardType(e.target.value)}
          className="w-full border rounded px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Select type</option>
          <option value="Active Faults">Active Faults</option>
          <option value="Landslide">Landslide</option>
          <option value="Earthquake Induced Landslide">Earthquake Induced Landslide</option>
          <option value="Storm Surge">Storm Surge</option>
          <option value="Tsunami">Tsunami</option>
          <option value="Rain Induced Landslide">Rain Induced Landslide</option>
          <option value="Ground Shaking">Ground Shaking</option>
          <option value="Liquefaction">Liquefaction</option>
          <option value="Other">Other</option>
        </select>

        {/* Description */}
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border rounded px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Enter hazard description..."
        />

        {/* Upload */}
        <label
          htmlFor="hazardGeojsonUpload"
          className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-6 cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all"
        >
          <FiUploadCloud className="text-4xl text-green-600 mb-2" />
          <p className="text-gray-700 font-medium">
            {geojsonFile ? geojsonFile.name : 'Click to upload GeoJSON file'}
          </p>
          <input
            id="hazardGeojsonUpload"
            type="file"
            accept=".geojson,application/geo+json"
            className="hidden"
            onChange={(e) => setGeojsonFile(e.target.files[0])}
          />
        </label>

        {/* Buttons */}
        <div className="flex justify-end gap-2 mt-6">
          <button
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            onClick={onSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
