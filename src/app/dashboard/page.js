'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/signin');
      return;
    }

    // Redirect to role-specific dashboard
    if (session.user.role === 'ADMIN') {
      router.push('/dashboard/admin');
    } else if (session.user.role === 'MEMBER') {
      router.push('/dashboard/member');
    } else {
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h1 className="text-xl font-semibold text-gray-900">
          Redirecting to dashboard...
        </h1>
        <p className="text-gray-500 mt-2">
          Please wait while we load your dashboard
        </p>
      </div>
    </div>
  );
}
