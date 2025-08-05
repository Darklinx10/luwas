'use client';
import RoleGuard from '@/components/roleGuard';

export default function HazardsPage() {
  return (
    <RoleGuard allowedRoles={['SeniorAdmin']}>
      <div className="p-4">
        <h1 className="text-xl font-bold">Hazard Management</h1>
        {/* Admin functionality like hazard forms/map goes here */}
      </div>
    </RoleGuard>
  );
}
