'use client';

import RoleGuard from "@/components/roleGuard";
import EditProfile from "@/features/Profile/Edit-Profile/EditUserProfile";

export default function EditProfilePage() {
  return (
    <RoleGuard allowedRoles={['MDRRMC-Admin', 'MDRRMC-Personnel', 'Brgy-Secretary']}>
      <EditProfile />
    </RoleGuard>
  );
}