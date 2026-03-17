'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AdminMemberForm from '@/app/components/AdminMemberForm';
import MemberDetailModal from '@/app/components/MemberDetailModal';
import AdminFinancialDashboard from '@/app/components/AdminFinancialDashboard';
import AdminEventsManager from '@/app/components/AdminEventsManager';
import AdminAssetsManager from '@/app/components/AdminAssetsManager';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [members, setMembers] = useState([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session || session.user.role !== 'ADMIN') {
      router.push('/auth/signin');
      return;
    }

    fetchMembers();
  }, [session, status, router]);

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/members');
      if (response.ok) {
        const data = await response.json();
        setMembers(data.members || []);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const handleMemberCreated = (newMember) => {
    setMembers((prev) => [newMember, ...prev]);
    setTimeout(() => setShowMemberForm(false), 2000);
  };

  const handleMemberUpdated = (updatedMember) => {
    if (!updatedMember) {
      setMembers((prev) => prev.filter((m) => m.id !== selectedMember.id));
      setSelectedMember(null);
    } else {
      setMembers((prev) =>
        prev.map((m) => (m.id === updatedMember.id ? updatedMember : m))
      );
      setSelectedMember(null);
    }
  };

  const filteredMembers = members.filter((member) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      member.full_name.toLowerCase().includes(searchLower) ||
      member.email.toLowerCase().includes(searchLower) ||
      member.phone.includes(searchTerm) ||
      member.church_name.toLowerCase().includes(searchLower)
    );
  });

  const handleSignOut = async () => {
    const { signOut } = await import('next-auth/react');
    signOut({ callbackUrl: '/auth/signin' });
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold">Loading...</h1>
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
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-500">
                Welcome, {session?.user?.full_name || 'Admin'}
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
          <nav className="flex space-x-8 overflow-x-auto" aria-label="Tabs">
            {[
              { id: 'overview',  label: 'Overview',         icon: '📊' },
              { id: 'members',   label: 'Members',           icon: '👥' },
              { id: 'financial', label: 'Financial Records', icon: '💰' },
              { id: 'assets',    label: 'Assets',            icon: '🏛️' },
              { id: 'events',    label: 'Events',            icon: '📅' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-1 py-4 font-medium text-sm border-b-2 whitespace-nowrap transition ${
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

        {/* ── Overview Tab ─────────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Members</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{members.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Active Members</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">
                      {members.filter((m) => m.is_active).length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Inactive Members</p>
                    <p className="text-3xl font-bold text-gray-600 mt-1">
                      {members.filter((m) => !m.is_active).length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Workflow Guide */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200 shadow-sm mb-8">
              <h3 className="font-semibold text-gray-900 mb-4">🚀 Your Admin Workflow</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg">
                  <span className="inline-block bg-blue-500 text-white rounded-full w-8 h-8 text-center font-bold text-sm leading-8 mb-2">1</span>
                  <h4 className="font-semibold text-gray-900 mb-2">Set Expectations</h4>
                  <p className="text-sm text-gray-600">Go to Financial Records → Set Expected Contribution. Select members and define their contribution amounts.</p>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <span className="inline-block bg-blue-500 text-white rounded-full w-8 h-8 text-center font-bold text-sm leading-8 mb-2">2</span>
                  <h4 className="font-semibold text-gray-900 mb-2">Manage Assets</h4>
                  <p className="text-sm text-gray-600">Go to Assets tab to record what the welfare owns and upload supporting documents for transparency.</p>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <span className="inline-block bg-blue-500 text-white rounded-full w-8 h-8 text-center font-bold text-sm leading-8 mb-2">3</span>
                  <h4 className="font-semibold text-gray-900 mb-2">Create Events</h4>
                  <p className="text-sm text-gray-600">Go to Events tab to schedule meetings and activities. Members will see them on their dashboard.</p>
                </div>
              </div>
              <p className="text-sm text-blue-800 mt-4 pt-4 border-t border-blue-200">
                ℹ️ <strong>Tip:</strong> Members are not automatically notified of changes. Consider messaging them after updating expectations, assets, or events.
              </p>
            </div>
          </div>
        )}

        {/* ── Members Tab ───────────────────────────────────────────────────── */}
        {activeTab === 'members' && (
          
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Members</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{members.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Active Members</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">
                      {members.filter((m) => m.is_active).length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Inactive Members</p>
                    <p className="text-3xl font-bold text-gray-600 mt-1">
                      {members.filter((m) => !m.is_active).length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Members</h2>
                  <p className="text-sm text-gray-500 mt-1">Manage all registered members</p>
                </div>
                <button
                  onClick={() => setShowMemberForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add New Member
                </button>
              </div>
              <div className="mt-4">
                <input
                  type="text"
                  placeholder="Search by name, email, phone, or church..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              {isLoadingMembers ? (
                <div className="p-8 text-center text-gray-500">Loading members...</div>
              ) : filteredMembers.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  {searchTerm ? 'No members match your search.' : 'No members found. Click Add New Member to get started.'}
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Church</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{member.full_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{member.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{member.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{member.church_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            member.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {member.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => setSelectedMember(member)}
                            className="text-blue-600 hover:text-blue-900 font-semibold text-sm"
                          >
                            View/Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── Financial Records Tab ─────────────────────────────────────────── */}
        {activeTab === 'financial' && (
          <AdminFinancialDashboard />
        )}

        {/* ── Assets Tab ────────────────────────────────────────────────────── */}
        {activeTab === 'assets' && (
          <AdminAssetsManager />
        )}

        {/* ── Events Tab ────────────────────────────────────────────────────── */}
        {activeTab === 'events' && (
          <AdminEventsManager />
        )}

      </main>

      {/* Member Form Modal */}
      {showMemberForm && (
        <AdminMemberForm
          onClose={() => setShowMemberForm(false)}
          onSuccess={handleMemberCreated}
        />
      )}

      {/* Member Detail Modal */}
      {selectedMember && (
        <MemberDetailModal
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
          onSuccess={handleMemberUpdated}
        />
      )}
    </div>
  );
}