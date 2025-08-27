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
import { useEffect, useState } from 'react';
import { db } from '@/firebase/config';
import { collection, getDocs } from 'firebase/firestore';

export default function BarChartComponent() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBarangayCounts = async () => {
      setLoading(true);
      try {
        const snapshot = await getDocs(collection(db, 'households'));
        const barangayCounts = {};

        await Promise.all(
          snapshot.docs.map(async (doc) => {
            const householdId = doc.id;

            const [geoSnap, membersSnap] = await Promise.all([
              getDocs(collection(db, 'households', householdId, 'geographicIdentification')),
              getDocs(collection(db, 'households', householdId, 'members')),
            ]);

            const memberCount = membersSnap.size;

            geoSnap.forEach((geoDoc) => {
              const geoData = geoDoc.data();
              const barangay = geoData.barangay;

              if (barangay) {
                barangayCounts[barangay] = (barangayCounts[barangay] || 0) + memberCount;
              }
            });
          })
        );

        const chartData = Object.entries(barangayCounts).map(([name, residents]) => ({
          name,
          residents,
        }));

        chartData.sort((a, b) => b.residents - a.residents);
        setData(chartData);
      } catch (error) {
        console.error('Error fetching barangay residents count:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBarangayCounts();
  }, []);

  if (loading) return <Spinner />;

  const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#ef4444", "#9333ea", "#0ea5e9", "#14b8a6"];

  return (
    <ResponsiveContainer width="100%" height={500}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="name"
          angle={0} // horizontal
          textAnchor="middle"
          interval={0}
          tick={{ fontSize: 12 }}
        />
        <YAxis label={{ value: 'Residents', angle: -90, position: 'insideLeft' }} />
        <Tooltip formatter={(value) => [`${value} residents`, "Count"]} />
        <Bar dataKey="residents">
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center items-center h-64">
      <svg
        className="animate-spin h-8 w-8 text-green-500"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v8z"
        />
      </svg>
    </div>
  );
}
