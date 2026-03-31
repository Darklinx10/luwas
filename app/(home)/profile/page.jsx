'use client';

import RoleGuard from "@/components/roleGuard";
import UserProfile from "@/features/Profile/UserProfile";

/**
 * Profile page - displays current user's profile information
 * Protected by RoleGuard - all authenticated users can view
 */
export default function ProfilePage() {
  return (
    <RoleGuard 
      allowedRoles={['Brgy-Secretary', 'MDRRMC-Personnel', 'MDRRMC-Admin']}
      redirectTo="/dashboard"
    >
      <UserProfile />
    </RoleGuard>
  );
}