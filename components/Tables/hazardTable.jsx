'use client';

export default function HazardTable({ data = [], title = 'Hazard Reports (2025)' }) {
  return (
    <div className="p-4">
      {/* ✅ Breadcrumb */}
      <div className="text-sm text-right text-gray-500 mb-2">
        Home / Reports / Hazards
      </div>

      {/* ✅ Header */}
      <div className="bg-green-600 text-white px-4 py-3 rounded-t-md font-semibold text-lg">
        {title}
      </div>

      {/* ✅ Table Wrapper */}
      <div className="overflow-x-auto shadow border-t-0 rounded-b-md bg-white p-4">
        {data.length === 0 ? (
          <p className="text-center text-gray-500 py-6 animate-pulse">Loading hazard records...</p>
        ) : (
          <table className="w-full text-sm text-center">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                <th className="px-4 py-2 border">Hazard Type</th>
                <th className="px-4 py-2 border">Location</th>
                <th className="px-4 py-2 border">Date</th>
                <th className="px-4 py-2 border">Map</th>
              </tr>
            </thead>
            <tbody>
              {data.map((h, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border">{h.type}</td>
                  <td className="px-4 py-2 border">{h.location}</td>
                  <td className="px-4 py-2 border">{h.date}</td>
                  <td className="px-4 py-2 border">
                    <button className="bg-green-600 text-white px-3 py-1 text-xs rounded hover:bg-green-700 cursor-pointer">
                      Map
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
