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
  const [savingId, setSavingId] = useState(null);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

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
    setSaveError('');
    setSaveSuccess('');
    setEditingId(contribution.id);
    setEditData({
      amount: Number(contribution.amount) || 0,
      expectedAmount: Number(contribution.expectedAmount) || Number(contribution.amount) || 0,
      status: contribution.status || 'PENDING',
      // Ensure notes is always a string, never null/undefined
      notes: contribution.notes ?? '',
    });
  };

  const handleEditChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveEdit = async (contributionId) => {
    setSaveError('');
    setSaveSuccess('');
    setSavingId(contributionId);

    try {
      // Build a clean payload — coerce types and guard against null/undefined
      const payload = {
        amount: parseFloat(editData.amount) || 0,
        expectedAmount: parseFloat(editData.expectedAmount) || 0,
        status: editData.status || 'PENDING',
        notes: editData.notes !== null && editData.notes !== undefined
          ? String(editData.notes)
          : '',
      };

      const res = await fetch(`/api/financial/contributions/${contributionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update contribution');
      }

      setSaveSuccess('Saved successfully');
      setEditingId(null);

      // Refresh table data
      await fetchContributions();

      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(''), 3000);
    } catch (err) {
      setSaveError(err.message || 'Save failed. Please try again.');
    } finally {
      setSavingId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
    setSaveError('');
    setSaveSuccess('');
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

      {/* Global fetch error */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-4 font-bold text-red-700 hover:text-red-900">✕</button>
        </div>
      )}

      {/* Save success banner */}
      {saveSuccess && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded flex justify-between items-center">
          <span>✅ {saveSuccess}</span>
          <button onClick={() => setSaveSuccess('')} className="ml-4 font-bold text-green-700 hover:text-green-900">✕</button>
        </div>
      )}

      {/* Save error banner */}
      {saveError && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded flex justify-between items-center">
          <span>❌ {saveError}</span>
          <button onClick={() => setSaveError('')} className="ml-4 font-bold text-red-700 hover:text-red-900">✕</button>
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
              const isEditing = editingId === contrib.id;
              const isSaving = savingId === contrib.id;

              const expectedAmount = isEditing
                ? (parseFloat(editData.expectedAmount) || 0)
                : (Number(contrib.expectedAmount) || Number(contrib.amount) || 0);
              const actualAmount = isEditing
                ? (parseFloat(editData.amount) || 0)
                : (Number(contrib.amount) || 0);
              const balance = expectedAmount - actualAmount;
              const balanceColor =
                balance === 0 ? 'text-green-600' : balance < 0 ? 'text-blue-600' : 'text-red-600';

              return (
                <tr key={contrib.id} className={`hover:bg-gray-50 ${isEditing ? 'bg-yellow-50' : ''}`}>
                  <td className="border p-2">{contrib.user?.full_name || 'Unknown'}</td>
                  <td className="border p-2">
                    <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                      {contrib.contribution_type.replace(/_/g, ' ')}
                    </span>
                  </td>

                  {/* Expected Amount */}
                  <td className="border p-2 text-right">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editData.expectedAmount}
                        onChange={(e) => handleEditChange('expectedAmount', e.target.value)}
                        className="border rounded px-2 py-1 w-24"
                        step="0.01"
                        min="0"
                        disabled={isSaving}
                      />
                    ) : (
                      `KSh ${expectedAmount.toLocaleString()}`
                    )}
                  </td>

                  {/* Actual Amount */}
                  <td className="border p-2 text-right">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editData.amount}
                        onChange={(e) => handleEditChange('amount', e.target.value)}
                        className="border rounded px-2 py-1 w-24"
                        step="0.01"
                        min="0"
                        disabled={isSaving}
                      />
                    ) : (
                      `KSh ${actualAmount.toLocaleString()}`
                    )}
                  </td>

                  {/* Balance — updates live while editing */}
                  <td className={`border p-2 text-right font-semibold ${balanceColor}`}>
                    KSh {Math.abs(balance).toLocaleString()}
                    <span className="text-xs ml-1">
                      ({balance === 0 ? 'Paid' : balance < 0 ? 'Overpaid' : 'Due'})
                    </span>
                  </td>

                  <td className="border p-2">
                    {new Date(contrib.contribution_date).toLocaleDateString()}
                  </td>

                  {/* Status */}
                  <td className="border p-2">
                    {isEditing ? (
                      <select
                        value={editData.status}
                        onChange={(e) => handleEditChange('status', e.target.value)}
                        className="border rounded px-2 py-1"
                        disabled={isSaving}
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

                  {/* Notes — now editable */}
                  <td className="border p-2 text-sm">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.notes}
                        onChange={(e) => handleEditChange('notes', e.target.value)}
                        className="border rounded px-2 py-1 w-36"
                        placeholder="Add notes..."
                        disabled={isSaving}
                      />
                    ) : (
                      contrib.notes || '-'
                    )}
                  </td>

                  {/* Actions */}
                  <td className="border p-2 text-center whitespace-nowrap">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => handleSaveEdit(contrib.id)}
                          disabled={isSaving}
                          className="text-green-600 hover:text-green-800 font-bold mr-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSaving ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={isSaving}
                          className="text-gray-600 hover:text-gray-800 disabled:opacity-50"
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