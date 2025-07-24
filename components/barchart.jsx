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
  // State to hold chart-ready data
  const [data, setData] = useState([]);

 {/* useEffect(() => {
    const fetchBarangayCounts = async () => {
      try {
        // Fetch all household documents
        const snapshot = await getDocs(collection(db, 'households'));

        // Object to count total residents per barangay
        const barangayCounts = {};

        // Iterate through each household
        for (const doc of snapshot.docs) {
          const householdId = doc.id;

          // 🔍 Get the geographicIdentification subcollection
          const geoSnap = await getDocs(
            collection(db, 'households', householdId, 'geographicIdentification')
          );

          // ✅ First pass: Count household head by barangay
          geoSnap.forEach((geoDoc) => {
            const geoData = geoDoc.data();
            const barangay = geoData.barangay;

            if (barangay) {
              // Add 1 count for the household head
              barangayCounts[barangay] = (barangayCounts[barangay] || 0) + 1;
            }
          });

          // 🔍 Get members subcollection to count all members
          const membersSnap = await getDocs(
            collection(db, 'households', householdId, 'members')
          );
          const memberCount = membersSnap.size;

          // ✅ Second pass: Add all household members to the same barangay count
          geoSnap.forEach((geoDoc) => {
            const geoData = geoDoc.data();
            const barangay = geoData.barangay;

            if (barangay) {
              // Add number of members to the same barangay
              barangayCounts[barangay] = (barangayCounts[barangay] || 0) + memberCount;
            }
          });
        }

        // 🔧 Format and sort chart data
        const chartData = Object.entries(barangayCounts).map(([name, residents]) => ({
          name,
          residents,
        }));

        // 📊 Sort chart data descending by resident count
        chartData.sort((a, b) => b.residents - a.residents);

        // Update chart data state
        setData(chartData);
      } catch (error) {
        // Log any errors for debugging
        console.error('Error fetching barangay residents count:', error);
      }
    };

    // Run the fetch logic on mount
    fetchBarangayCounts();
  }, []);
*/}

  useEffect(() => {
    const fetchBarangayCounts = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'households'));
        const barangayCounts = {};

        for (const doc of snapshot.docs) {
          const householdId = doc.id;

          // Get geographicIdentification to extract barangay info
          const geoSnap = await getDocs(
            collection(db, 'households', householdId, 'geographicIdentification')
          );

          // Get members to count all residents (excluding head)
          const membersSnap = await getDocs(
            collection(db, 'households', householdId, 'members')
          );
          const memberCount = membersSnap.size;

          geoSnap.forEach((geoDoc) => {
            const geoData = geoDoc.data();
            const barangay = geoData.barangay;

            if (barangay) {
              // ONLY count members, NOT the head
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
      }
    };

    fetchBarangayCounts();
  }, []);



  // Render bar chart with barangay names and resident counts
  return (
    <ResponsiveContainer width="100%" height={500}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 80 }}>
        {/* Background grid */}
        <CartesianGrid strokeDasharray="3 3" />

        {/* X-axis: rotated barangay names */}
        <XAxis
          dataKey="name"
          angle={-45}
          textAnchor="end"
          interval={0}
          height={120}
        />

        {/* Y-axis: shows resident counts */}
        <YAxis label={{ value: 'Residents', angle: -90, position: 'insideLeft' }} />

        {/* Tooltip on hover */}
        <Tooltip />

        {/* Bars representing resident counts */}
        <Bar dataKey="residents" fill="#0BAD4A" />
      </BarChart>
    </ResponsiveContainer>
  );
}
