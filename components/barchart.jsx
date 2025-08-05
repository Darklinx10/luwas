'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
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

        for (const doc of snapshot.docs) {
          const householdId = doc.id;

          const geoSnap = await getDocs(
            collection(db, 'households', householdId, 'geographicIdentification')
          );

          const membersSnap = await getDocs(
            collection(db, 'households', householdId, 'members')
          );
          const memberCount = membersSnap.size;

          geoSnap.forEach((geoDoc) => {
            const geoData = geoDoc.data();
            const barangay = geoData.barangay;

            if (barangay) {
              barangayCounts[barangay] = (barangayCounts[barangay] || 0) + memberCount;
            }
          });
        }

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

  return (
    <ResponsiveContainer width="100%" height={500}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 80 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="name"
          angle={-45}
          textAnchor="end"
          interval={0}
          height={120}
        />
        <YAxis label={{ value: 'Residents', angle: -90, position: 'insideLeft' }} />
        <Tooltip />
        <Bar dataKey="residents" fill="#0BAD4A" />
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
