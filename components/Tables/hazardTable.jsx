'use client';

export default function HazardTable({ data, title }) {
  return (
    <div className="p-4">
      {/* ✅ Breadcrumb */}
      <div className="text-sm text-right text-gray-500 mb-2">
        Home / Reports / Hazards
      </div>
      
      {/* ✅ Table */}
      <table className="w-full border-collapse  border-gray-400 text-sm ">
        <thead>
          <tr>
            <th
              colSpan="4"
              className="text-lg font-semibold text-white bg-green-600 p-3 text-left rounded-t-md" 
            >
              {title}
            </th>
          </tr>
          <tr className="bg-gray-100">
            <th className="border p-2 text-center">Hazard Type</th>
            <th className="border p-2 text-center">Location</th>
            <th className="border p-2 text-center">Date</th>
            <th className="border p-2 text-center">Map</th>
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((h, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="border p-2 text-center">{h.type}</td>
                <td className="border p-2 text-center">{h.location}</td>
                <td className="border p-2 text-center">{h.date}</td>
                <td className="border p-2 text-center">
                  <button className="bg-green-600 text-white px-3 py-1 text-xs rounded hover:bg-green-700">
                    Map
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="text-center text-gray-500 p-4">
                Loading...
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
