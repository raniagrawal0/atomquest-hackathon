import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import EmployeeDashboard from '@/components/EmployeeDashboard';
import ManagerDashboard from '@/components/ManagerDashboard';
import AdminDashboard from '@/components/AdminDashboard';
import Link from 'next/link';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;

  if (!role) {
    redirect('/');
  }

  const user = await prisma.user.findFirst({
    where: { role: role },
    include: {
      goals: { include: { achievements: true } },
      employees: { 
        include: { 
          goals: { include: { achievements: true } },
          checkIns: true,
        } 
      },
    },
  });

  if (!user) {
    return <div>User not found</div>;
  }

  return (
    <main className="container">
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <h2>Welcome, {user.name} ({user.role})</h2>
        <Link href="/" className="btn btn-secondary">Logout</Link>
      </div>

      {user.role === 'EMPLOYEE' && <EmployeeDashboard user={user} />}
      {user.role === 'MANAGER' && <ManagerDashboard user={user} />}
      {user.role === 'ADMIN' && <AdminDashboard user={user} />}
    </main>
  );
}
