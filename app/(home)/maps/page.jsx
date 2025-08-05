// src/app/page.jsx
"use client"; // Marks this as a client component in Next.js 13+ (required for client-side behavior)

// Dynamically import the OSMMap component, disabling server-side rendering for it
import dynamic from 'next/dynamic';
import RoleGuard from '@/components/roleGuard';

const OSMMap = dynamic(() => import('@/components/OSMMap'), { ssr: false });

export default function MapPage() {
  return (
    <RoleGuard allowedRoles={['SeniorAdmin', 'OfficeStaff']}>
      <div className="p-4">
        <OSMMap />
      </div>
    </RoleGuard>
  );
}