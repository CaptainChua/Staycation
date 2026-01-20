'use client';

import { useSession } from "next-auth/react";
import CleanersDashboard from '@/Components/admin/Cleaners/CleanersDashboard';
import CleanersManagementPage from '@/Components/admin/Cleaners/CleanersManagementPage';

export default function Cleaners() {
  const { data: session } = useSession();
  const role = session?.user?.role;

  // Owners and CSRs see the management dashboard with the map
  if (role === 'Owner' || role === 'Csr') {
    return <CleanersManagementPage />;
  }

  // Cleaners see their own portal
  return <CleanersDashboard />;
}