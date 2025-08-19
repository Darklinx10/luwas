// src/app/page.jsx
"use client";

// Dynamically import the OSMMap component, disabling server-side rendering for it
import dynamic from 'next/dynamic';
import RoleGuard from '@/components/roleGuard';

const OSMMap = dynamic(() => import('@/components/map/OSMMap'), { ssr: false });

export default function MapPage() {
  return (
    <RoleGuard allowedRoles={['SeniorAdmin', 'OfficeStaff']}>
      <div className="p-4">
        <OSMMap />
      </div>
    </RoleGuard>
  );
}