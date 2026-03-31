/**
 * app/(home)/map/page.jsx
 *
 * Map page wrapper - thin layer that delegates to MapContainer
 * Ensures proper role-based access while keeping logic in features/Map
 */
'use client';

import dynamic from 'next/dynamic';
import RoleGuard from '@/components/roleGuard';
import { ALLOWED_MAP_ROLES } from '@/features/Map/utils/mapConstants';

// Dynamically import main map component (disable SSR for Leaflet)
const MapContainer = dynamic(() => import('@/features/Map/components/Map/MapContainer'), { ssr: false });

export default function MapPage() {
  return (
    <RoleGuard allowedRoles={ALLOWED_MAP_ROLES}>
      <div className="p-4">
        <MapContainer />
      </div>
    </RoleGuard>
  );
}
