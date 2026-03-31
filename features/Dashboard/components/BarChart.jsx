'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import Spinner from './Spinner';

export default function BarChartComponent({ data = [], loading }) {
  if (loading) return <Spinner />;

  if (!data.length) {
    return (
      <div className="flex justify-center items-center h-[500px] text-gray-500">
        No Residents data available
      </div>
    );
  }

  const COLORS = [
    '#2563eb',
    '#16a34a',
    '#f59e0b',
    '#ef4444',
    '#9333ea',
    '#0ea5e9',
    '#14b8a6',
  ];

  // Capitalize first letter of each name
  const formattedData = data.map((d) => ({
    ...d,
    name: d.name
      ? d.name
          .split(' ')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ')
      : '',
  }));

  return (
    <ResponsiveContainer width="100%" height={500}>
      <BarChart data={formattedData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis
          label={{
            value: 'Residents',
            angle: -90,
            position: 'insideLeft',
          }}
        />
        <Tooltip formatter={(value) => [`${value} residents`, 'Count']} />
        <Bar dataKey="residents" radius={[8, 8, 0, 0]}>
          {formattedData.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
