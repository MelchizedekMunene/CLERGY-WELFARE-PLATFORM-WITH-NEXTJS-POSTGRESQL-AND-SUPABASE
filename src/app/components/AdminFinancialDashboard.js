'use client';

import { useState, useEffect } from 'react';
import SetExpectedContributionForm from './SetExpectedContributionForm';

export default function AdminFinancialDashboard() {
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    fetchContributions();
  }, [filter]);

  const fetchContributions = async () => {
    try {
      setLoading(true);
      const url = new URL('/api/financial/contributions', window.location.origin);
      if (filter) url.searchParams.append('type', filter);
      url.searchParams.append('limit', '100');

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch contributions');
      }

      setContributions(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (contribution) => {
    setEditingId(contribution.id);
    setEditData({
      amount: Number(contribution.amount) || 0,
      expectedAmount: Number(contribution.expectedAmount) || Number(contribution.amount) || 0,
      status: contribution.status,
      notes: contribution.notes,
    });
  };

  const handleEditChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveEdit = async (contributionId) => {
    try {
      const res = await fetch(`/api/financial/contributions/${contributionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update contribution');
      }

      setEditingId(null);
      fetchContributions();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (contributionId) => {
    if (!confirm('Are you sure you want to delete this contribution?')) return;

    try {
      const res = await fetch(`/api/financial/contributions/${contributionId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete contribution');
      }

      fetchContributions();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await fetch('/api/financial/export');
      if (!res.ok) throw new Error('Failed to export');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'financial-report.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="text-center text-gray-500 py-8">Loading...</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Financial Dashboard</h2>
        <button
          onClick={handleExportCSV}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          📥 Export CSV
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Set Expected Contribution Form - Section Header */}
      <div className="mb-8 p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">💡 Setup Member Expectations</h3>
        <p className="text-blue-800 text-sm">
          Define how much each member is expected to contribute. Members will see these amounts when they record contributions, helping them understand what they owe.
        </p>
      </div>

      {/* Set Expected Contribution Form */}
      <SetExpectedContributionForm onSuccess={fetchContributions} />

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Filter by Type</label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">All Types</option>
          <option value="MONTHLY_CONTRIBUTION">Monthly Contribution</option>
          <option value="SOCIAL_WELFARE">Social Welfare</option>
          <option value="SPECIAL">Special</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2 text-left">Member Name</th>
              <th className="border p-2 text-left">Type</th>
              <th className="border p-2 text-right">Expected</th>
              <th className="border p-2 text-right">Actual</th>
              <th className="border p-2 text-right">Balance</th>
              <th className="border p-2 text-left">Date</th>
              <th className="border p-2 text-left">Status</th>
              <th className="border p-2 text-left">Notes</th>
              <th className="border p-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {contributions.map(contrib => {
              const expectedAmount = Number(contrib.expectedAmount) || Number(contrib.amount) || 0;
              const actualAmount = Number(contrib.amount) || 0;
              const balance = expectedAmount - actualAmount;
              const balanceColor = balance === 0 ? 'text-green-600' : balance < 0 ? 'text-blue-600' : 'text-red-600';
              
              return (
              <tr key={contrib.id} className="hover:bg-gray-50">
                <td className="border p-2">{contrib.user?.full_name || 'Unknown'}</td>
                <td className="border p-2">
                  <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                    {contrib.contribution_type.replace('_', ' ')}
                  </span>
                </td>
                <td className="border p-2 text-right">
                  {editingId === contrib.id ? (
                    <input
                      type="number"
                      value={editData.expectedAmount}
                      onChange={(e) => handleEditChange('expectedAmount', parseFloat(e.target.value) || 0)}
                      className="border rounded px-2 py-1 w-24"
                      step="0.01"
                      min="0"
                    />
                  ) : (
                    `KSh ${expectedAmount.toLocaleString()}`
                  )}
                </td>
                <td className="border p-2 text-right">
                  {editingId === contrib.id ? (
                    <input
                      type="number"
                      value={editData.amount}
                      onChange={(e) => handleEditChange('amount', parseFloat(e.target.value) || 0)}
                      className="border rounded px-2 py-1 w-24"
                      step="0.01"
                      min="0"
                    />
                  ) : (
                    `KSh ${actualAmount.toLocaleString()}`
                  )}
                </td>
                <td className={`border p-2 text-right font-semibold ${balanceColor}`}>
                  KSh {Math.abs(balance).toLocaleString()}
                  <span className="text-xs ml-1">({balance === 0 ? 'Paid' : balance < 0 ? 'Overpaid' : 'Due'})</span>
                </td>
                <td className="border p-2">{new Date(contrib.contribution_date).toLocaleDateString()}</td>
                <td className="border p-2">
                  {editingId === contrib.id ? (
                    <select
                      value={editData.status}
                      onChange={(e) => handleEditChange('status', e.target.value)}
                      className="border rounded px-2 py-1"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="PARTIAL">Partial</option>
                      <option value="PAID">Paid</option>
                    </select>
                  ) : (
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        contrib.status === 'PAID'
                          ? 'bg-green-100 text-green-800'
                          : contrib.status === 'PARTIAL'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {contrib.status}
                    </span>
                  )}
                </td>
                <td className="border p-2 text-sm">{contrib.notes || '-'}</td>
                <td className="border p-2 text-center">
                  {editingId === contrib.id ? (
                    <>
                      <button
                        onClick={() => handleSaveEdit(contrib.id)}
                        className="text-green-600 hover:text-green-800 font-bold mr-2"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEditClick(contrib)}
                        className="text-blue-600 hover:text-blue-800 mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(contrib.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            );
            })}
          </tbody>
        </table>
      </div>

      {contributions.length === 0 && (
        <div className="text-center py-8 text-gray-500">No contributions found</div>
      )}
    </div>
  );
}
