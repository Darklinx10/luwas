import { FiTrash2 } from 'react-icons/fi';

export default function HazardTable({ hazards, onPreview, onDelete }) {
  return (
    <table className="w-full text-sm text-center">
      <thead className="bg-gray-100 text-gray-600">
        <tr>
          <th className="p-2 border">Type</th>
          <th className="p-2 border">Description</th>
          <th className="p-2 border">Date Uploaded</th>
          <th className="p-2 border">View</th>
          <th className="p-2 border">Actions</th>
        </tr>
      </thead>
      <tbody>
        {hazards.map((hazard) => (
          <tr key={hazard.id} className="hover:bg-gray-50">
            <td className="p-2 border">{hazard.type}</td>
            <td className="p-2 border">{hazard.description}</td>
            <td className="p-2 border">
              {hazard.createdAt
                ? new Date(hazard.createdAt.seconds * 1000).toLocaleString()
                : 'N/A'}
            </td>
            <td className="p-2 border">
              <button
                onClick={() => onPreview(hazard)}
                className="px-2 py-1 text-white bg-green-600 hover:bg-green-700 rounded"
              >
                Preview
              </button>
            </td>
            <td className="p-2 border">
              <button
                onClick={() => onDelete(hazard.id)}
                className="text-red-600 hover:text-red-800 cursor-pointer"
              >
                <FiTrash2 size={16} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
