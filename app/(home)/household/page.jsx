import RoleGuard from '@/components/roleGuard';
import { HouseholdPageContent } from '@/features/Households';

export default function HouseholdPage() {
  return (
    <RoleGuard
      allowedRoles={['Brgy-Secretary', 'MDRRMC-Personnel', 'MDRRMC-Admin']}
    >
      <HouseholdPageContent />
    </RoleGuard>
  );
}