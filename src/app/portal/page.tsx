import { PortalDashboard } from '@/components/portal/PortalDashboard';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function PortalPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('portal_auth');

  if (!token) {
    redirect('/portal/login');
  }

  // Very simple role extraction from token value for demo
  const role = token.value.includes('admin') ? 'Admin' : 'Doctor';

  return <PortalDashboard role={role} />;
}
