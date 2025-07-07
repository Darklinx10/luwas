"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const ageData = [
  { age: "Under 1", count: 80 },
  { age: "1-4", count: 120 },
  { age: "5-9", count: 150 },
  { age: "10-14", count: 130 },
  { age: "15-19", count: 90 },
  { age: "20-24", count: 100 },
  { age: "25-29", count: 110 },
  { age: "30-34", count: 105 },
];

export default function AgeBracketChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        layout="vertical"
        data={ageData}
        margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis dataKey="age" type="category" />
        <Tooltip />
        <Bar dataKey="count" fill="#fbbf24" />
      </BarChart>
    </ResponsiveContainer>
  );
}
