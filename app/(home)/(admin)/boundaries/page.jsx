'use client';


import RoleGround from '@/components/roleGuard'

const BoundariesPage = () => {
  

  return (
    <RoleGround allowedRoles={['SeniorAdmin']}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Barangay Boundaries</h1>
      </div>
    </RoleGround>
  );
};

export default BoundariesPage;
