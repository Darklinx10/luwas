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

          // Get the barangay from geographicIdentification/main
          const geoSnap = await getDocs(
            collection(db, 'households', householdId, 'geographicIdentification')
          );

          geoSnap.forEach((geoDoc) => {
            const geoData = geoDoc.data();
            const barangay = geoData.barangay;

            if (barangay) {
              // Count 1 for the household head
              barangayCounts[barangay] = (barangayCounts[barangay] || 0) + 1;
            }
          });

          // Get member count for each household
          const membersSnap = await getDocs(
            collection(db, 'households', householdId, 'members')
          );
          const memberCount = membersSnap.size;

          geoSnap.forEach((geoDoc) => {
            const geoData = geoDoc.data();
            const barangay = geoData.barangay;

            if (barangay) {
              // Add all members
              barangayCounts[barangay] = (barangayCounts[barangay] || 0) + memberCount;
            }
          });
        }

        const chartData = Object.entries(barangayCounts).map(([name, residents]) => ({
          name,
          residents,
        }));

        // Sort by descending resident count
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
