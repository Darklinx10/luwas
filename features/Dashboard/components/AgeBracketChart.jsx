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

export default function AgeBracketChart({ data = [], loading }) {
  if (loading) return <Spinner />;

  // Check if there is any data with count > 0
  const hasData = data.some((item) => item.count > 0);

  if (!hasData) {
    return (
      <div className="flex justify-center items-center h-[500px] text-gray-500">
        No Age data available
      </div>
    );
  }

  const COLORS = [
    '#0ea5e9',
    '#22c55e',
    '#f59e0b',
    '#ef4444',
    '#9333ea',
    '#14b8a6',
    '#6366f1',
  ];

  return (
    <ResponsiveContainer width="100%" height={500}>
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 20, right: 30, left: 60, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis dataKey="age" type="category" width={80} />
        <Tooltip formatter={(value) => [`${value} residents`, 'Age Bracket']} />
        <Bar dataKey="count">
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
