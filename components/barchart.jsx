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

const data = [
  { name: "Zone 1", residents: 120 },
  { name: "Zone 2", residents: 98 },
  { name: "Zone 3", residents: 150 },
  { name: "Zone 4", residents: 130 },
  { name: "Zone 5", residents: 170 },
];

export default function BarChartComponent() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="residents" fill="#0BAD4A" />
      </BarChart>
    </ResponsiveContainer>
  );
}
