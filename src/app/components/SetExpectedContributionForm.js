'use client';

import { useState, useEffect } from 'react';
import MemberMultiSelect from './MemberMultiSelect';

export default function SetExpectedContributionForm({ onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    contribution_type: 'MONTHLY_CONTRIBUTION',
    expected_amount: '',
    effective_from: new Date().toISOString().split('T')[0],
    effective_until: '',
    notes: '',
  });
  const [selectedMembers, setSelectedMembers] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (selectedMembers.length === 0) {
        throw new Error('Please select at least one member');
      }

      if (!formData.expected_amount) {
        throw new Error('Please enter an expected amount');
      }

      const res = await fetch('/api/financial/expected-contribution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberIds: selectedMembers,
          contribution_type: formData.contribution_type,
          expected_amount: parseFloat(formData.expected_amount),
          effective_from: formData.effective_from,
          effective_until: formData.effective_until || null,
          notes: formData.notes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to set expected contribution');
      }

      // selectedMembers is an array of IDs — use the API response message or fall back to count
      const memberNames = data.message || `${selectedMembers.length} member(s)`;

      setSuccess(`Expected contribution set successfully for ${memberNames}!`);
      setFormData({
        contribution_type: 'MONTHLY_CONTRIBUTION',
        expected_amount: '',
        effective_from: new Date().toISOString().split('T')[0],
        effective_until: '',
        notes: '',
      });
      setSelectedMembers([]);

      if (onSuccess) {
        onSuccess(data.data);
      }

      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-8">
      <h3 className="text-xl font-bold mb-6 text-gray-900">Set Expected Contribution</h3>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Member Selection - Using Dropdown Selector */}
        <MemberMultiSelect 
          selectedMembers={selectedMembers}
          onSelectionChange={setSelectedMembers}
        />

        {/* Contribution Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Contribution Type *</label>
            <select
              name="contribution_type"
              value={formData.contribution_type}
              onChange={handleChange}
              required
              className="w-full border rounded px-3 py-2"
            >
              <option value="MONTHLY_CONTRIBUTION">Monthly Contribution</option>
              <option value="SOCIAL_WELFARE">Social Welfare</option>
              <option value="SPECIAL">Special</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Expected Amount (KSh) *</label>
            <input
              type="number"
              name="expected_amount"
              value={formData.expected_amount}
              onChange={handleChange}
              required
              step="0.01"
              min="0"
              placeholder="e.g., 5000"
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Effective From *</label>
            <input
              type="date"
              name="effective_from"
              value={formData.effective_from}
              onChange={handleChange}
              required
              className="w-full border rounded px-3 py-2"
            />
            <p className="text-xs text-gray-500 mt-1">When this expected amount becomes active</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Effective Until (Optional)</label>
            <input
              type="date"
              name="effective_until"
              value={formData.effective_until}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
            <p className="text-xs text-gray-500 mt-1">Leave blank for indefinite</p>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="e.g., Q1 2026 contribution amount, Due by end of month"
            rows="2"
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <button
          type="submit"
          disabled={loading || selectedMembers.length === 0}
          className="w-full md:w-auto bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Setting...' : `Set Expected Contribution for ${selectedMembers.length || 0} Member(s)`}
        </button>
      </form>
    </div>
  );
}