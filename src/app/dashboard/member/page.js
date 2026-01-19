'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function MemberDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (status === 'loading') return;

    if (!session || session.user.role !== 'MEMBER') {
      router.push('/auth/signin');
      return;
    }

    // Profile data is already in session
    setUserProfile(session.user);
    setIsLoading(false);
  }, [session, status, router]);

  const handleSignOut = async () => {
    const { signOut } = await import('next-auth/react');
    signOut({ callbackUrl: '/auth/signin' });
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold">Loading...</h1>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">
            Error Loading Profile
          </h1>
          <p className="text-gray-500 mt-2">Please try signing in again</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Member Dashboard
              </h1>
              <p className="text-sm text-gray-500">
                Welcome, {userProfile?.full_name || 'Member'}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'contributions', label: 'Contributions', icon: '💰' },
              { id: 'loans', label: 'Loans', icon: '📋' },
              { id: 'events', label: 'Events', icon: '📅' },
              { id: 'profile', label: 'Profile', icon: '👤' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-1 py-4 font-medium text-sm border-b-2 transition ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Contributions</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      KES 0
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-xl">💰</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Active Loans</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">0</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xl">📋</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Upcoming Events</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">0</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-xl">📅</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Info */}
            <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Summary
              </h2>
              <p className="text-gray-600">
                Your member dashboard is set up and ready to use. Explore the
                tabs above to view your contributions, loans, upcoming events,
                and manage your profile.
              </p>
            </div>
          </div>
        )}

        {/* Contributions Tab */}
        {activeTab === 'contributions' && (
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Your Contributions
            </h2>
            <p className="text-gray-600">
              No contributions yet. Once you make a contribution, it will appear
              here.
            </p>
          </div>
        )}

        {/* Loans Tab */}
        {activeTab === 'loans' && (
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Your Loans
            </h2>
            <p className="text-gray-600">
              No active loans. You can apply for a loan through the loans
              section.
            </p>
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Upcoming Events
            </h2>
            <p className="text-gray-600">
              No upcoming events. Check back later for community events.
            </p>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Your Profile
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <p className="mt-1 text-gray-900">{userProfile?.full_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <p className="mt-1 text-gray-900">{userProfile?.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <p className="mt-1 text-gray-900">{userProfile?.phone}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Church Name
                </label>
                <p className="mt-1 text-gray-900">{userProfile?.church_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Member ID
                </label>
                <p className="mt-1 text-gray-900 font-mono text-sm">
                  {userProfile?.id}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <p className="mt-1">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    {userProfile?.role}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
