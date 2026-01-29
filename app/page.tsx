import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  // Redirect based on user role
  const userRole = (session.user as any)?.role;

  if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
    redirect('/admin/dashboard');
  } else {
    redirect('/demandes');
  }
}
