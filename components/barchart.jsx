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

  useEffect(() => {
    const fetchBarangayCounts = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'households'));
        const barangayCounts = {};

        for (const doc of snapshot.docs) {
          const householdId = doc.id;
          const geoSnap = await getDocs(
            collection(db, 'households', householdId, 'geographicIdentification')
          );

          geoSnap.forEach((geoDoc) => {
            const geoData = geoDoc.data();
            const barangay = geoData.barangay;

            if (barangay) {
              barangayCounts[barangay] = (barangayCounts[barangay] || 0) + 1;
            }
          });
        }

        const chartData = Object.entries(barangayCounts).map(([name, residents]) => ({
          name,
          residents,
        }));

        // Optional: Sort by residents count descending
        chartData.sort((a, b) => b.residents - a.residents);

        setData(chartData);
      } catch (error) {
        console.error('Error fetching barangay residents count:', error);
      }
    };

    fetchBarangayCounts();
  }, []);

  return (
    <ResponsiveContainer width="100%" height={500}>
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 0, bottom: 80 }}
      >
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
