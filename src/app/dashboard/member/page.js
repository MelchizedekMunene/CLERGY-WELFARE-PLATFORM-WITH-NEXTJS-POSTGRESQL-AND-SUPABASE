'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ContributionForm from '@/app/components/ContributionForm';
import MemberFinancialSummary from '@/app/components/MemberFinancialSummary';

export default function MemberDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

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
              { id: 'assets', label: 'Assets', icon: '🏦' },
              { id: 'events', label: 'Events', icon: '📅' },
              { id: 'profile', label: 'Profile', icon: '👤' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-1 py-4 font-medium text-sm border-b-2 transition ${activeTab === tab.id
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
            {/* Quick Info */}
            <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                🎯 Welcome to Your Member Dashboard
              </h2>
              <p className="text-gray-600 mb-4">
                Your member dashboard is set up and ready to use. Here's what you can do:
              </p>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>✅ <strong>Contributions Tab:</strong> View your financial summary and record your contributions</li>
                <li>✅ <strong>Assets Tab:</strong> See details about group investments and assets</li>
                <li>✅ <strong>Events Tab:</strong> Stay informed about upcoming community events</li>
                <li>✅ <strong>Profile Tab:</strong> Manage your personal information</li>
              </ul>
              <p className="text-gray-700 font-medium mt-4 pt-4 border-t">
                💰 <strong>Getting Started:</strong> Go to the <strong>Contributions</strong> tab to see your expected obligations and record contributions.
              </p>
            </div>

            {/* Financial Summary */}
            <MemberFinancialSummary memberId={userProfile?.id} key={refreshKey} />
          </div>
        )}

        {/* Contributions Tab */}
        {activeTab === 'contributions' && (
          <div className="space-y-8">
            {/* Refresh Button */}
            <div className="flex justify-end">
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm flex items-center gap-2"
              >
                🔄 Refresh Data
              </button>
            </div>

            {/* Info Card */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border border-green-200 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">📋 How It Works</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="inline-block bg-green-500 text-white rounded-full w-6 h-6 text-center font-bold text-xs leading-6">1</span>
                  <p className="mt-2 text-gray-700"><strong>Expectations Set</strong> by your admin</p>
                </div>
                <div className="text-center">→</div>
                <div>
                  <span className="inline-block bg-green-500 text-white rounded-full w-6 h-6 text-center font-bold text-xs leading-6">2</span>
                  <p className="mt-2 text-gray-700"><strong>You Record</strong> your contribution</p>
                </div>
              </div>
              <p className="text-gray-600 mt-3 text-xs">
                The balance will show you how much you still owe or if you've paid more than expected.
              </p>
            </div>

            <MemberFinancialSummary memberId={userProfile?.id} key={refreshKey} />
            <ContributionForm memberId={userProfile?.id} onSuccess={handleRefresh} refreshKey={refreshKey} />
          </div>
        )}

        {/* Assets Tab */}
        {activeTab === 'assets' && (
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Group Assets & Investments
            </h2>
            <p className="text-gray-600">
              No assets recorded. Contact your administrator to view or add group
              investments and related documents.
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
