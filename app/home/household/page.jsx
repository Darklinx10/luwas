'use client';

import { FiPlus, FiSearch } from 'react-icons/fi';
import { FaUserEdit } from 'react-icons/fa';

export default function HouseholdPage() {
  return (
    <div className="p-4">
      {/* Breadcrumb */}
      <div className="text-sm text-right text-gray-500 mb-2">Home/Households</div>

      {/* Header */}
      <div className="bg-green-600 text-white px-4 py-3 rounded-t-md font-semibold text-lg">
        Household Information (2025)
      </div>

      {/* Search and Add */}
      <div className="flex items-center justify-between bg-white border border-t-0 px-4 py-3">
        <div className="relative w-1/2 max-w-md">
          <FiSearch className="absolute top-2.5 left-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search Here"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
          <FiPlus />
          Add
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-t-0 rounded-b-md">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="p-2 border"> </th>
              <th className="p-2 border">Family Head</th>
              <th className="p-2 border">Barangay</th>
              <th className="p-2 border">Sex</th>
              <th className="p-2 border">Contact Number</th>
              <th className="p-2 border">Age</th>
              <th className="p-2 border">Map</th>
            </tr>
          </thead>
          <tbody>
            {/* Sample Data Row */}
            <tr className="hover:bg-gray-50">
              <td className="p-2 border text-center">
                <button className="text-green-600 hover:text-green-800">
                  <FaUserEdit />
                </button>
              </td>
              <td className="p-2 border">John Lyndon Sanggod</td>
              <td className="p-2 border">Poblacion Centro</td>
              <td className="p-2 border">Male</td>
              <td className="p-2 border">09817976666</td>
              <td className="p-2 border">45</td>
              <td className="p-2 border text-center">
                <button className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700">
                  Map
                </button>
              </td>
            </tr>

            {/* Empty Rows (for mock layout purposes) */}
            {[...Array(10)].map((_, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="p-2 border text-center">
                  <FaUserEdit className="text-green-600" />
                </td>
                <td className="p-2 border"></td>
                <td className="p-2 border"></td>
                <td className="p-2 border"></td>
                <td className="p-2 border"></td>
                <td className="p-2 border"></td>
                <td className="p-2 border text-center">
                  <button className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700">
                    Map
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
