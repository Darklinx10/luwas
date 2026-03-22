'use client';

import RoleGuard from "@/components/roleGuard";
import UserManagement from "@/features/UserManagement/UserManagement";

export default function UserManagementPage() {
  return (
    <RoleGuard allowedRoles={['MDRRMC-Admin']}>
      <UserManagement/>
    </RoleGuard>
  )
}