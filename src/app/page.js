//Entry Point - Redirect Based on Authentication and Role
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;

    if (session) {
      // User is authenticated, redirect based on role
      if (session.user.role === 'ADMIN') {
        router.push('/dashboard/admin');
      } else if (session.user.role === 'MEMBER') {
        router.push('/dashboard/member');
      }
    } else {
      // No session, redirect to signin
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Loading...</h1>
        <p className="text-gray-500">Redirecting you...</p>
      </div>
    </div>
  );
}
