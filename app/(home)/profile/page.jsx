'use client';

import RoleGuard from "@/components/roleGuard";
import UserProfile from "@/features/Profile/UserProfile"; // Import your profile component

export default function ProfilePage() {
  return (
    <RoleGuard allowedRoles={['Brgy-Secretary', 'MDRRMC-Personnel', 'MDRRMC-Admin']}>
      <UserProfile />
    </RoleGuard>
  );
}