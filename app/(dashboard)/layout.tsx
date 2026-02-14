// ============================================================
// src/app/(dashboard)/layout.tsx
//
// This layout wraps ALL dashboard pages.
// It runs on the server and checks auth before rendering.
// If not authenticated, the middleware already handles the
// redirect, but this is a secondary check.
// ============================================================

import { getAuthUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DashboardNav from '@/components/features/DashboardNav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side auth check
  const user = await getAuthUser();
  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen">
      <DashboardNav user={{ name: user.name, email: user.email }} />
      <main className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
