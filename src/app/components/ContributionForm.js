'use client';

import { useState, useEffect } from 'react';

export default function ContributionForm({ memberId, onSuccess, refreshKey = 0 }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expectedAmounts, setExpectedAmounts] = useState({});
  const [formData, setFormData] = useState({
    amount: '',
    contribution_type: 'MONTHLY_CONTRIBUTION',
    contribution_date: new Date().toISOString().split('T')[0],
    payment_method: 'CASH',
    transaction_ref: '',
    notes: '',
  });

  // Fetch expected amounts for each contribution type from the new system
  const fetchExpectedAmounts = async () => {
    try {
      const res = await fetch(`/api/financial/expected-contribution?memberId=${memberId}&t=${Date.now()}`);
      const data = await res.json();
      if (res.ok) {
        setExpectedAmounts(data.data || {
          MONTHLY_CONTRIBUTION: 0,
          SOCIAL_WELFARE: 0,
          SPECIAL: 0,
        });
      }
    } catch (err) {
      console.error('Failed to fetch expected amounts:', err);
      setExpectedAmounts({
        MONTHLY_CONTRIBUTION: 0,
        SOCIAL_WELFARE: 0,
        SPECIAL: 0,
      });
    }
  };

  useEffect(() => {
    if (memberId) fetchExpectedAmounts();
  }, [memberId, refreshKey]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const expectedAmount = expectedAmounts[formData.contribution_type] || 0;
  const actualAmount = parseFloat(formData.amount) || 0;
  const balance = expectedAmount - actualAmount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/financial/contributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          expectedAmount,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to record contribution');
      }

      setSuccess('Contribution recorded successfully!');
      setFormData({
        amount: '',
        contribution_type: 'MONTHLY_CONTRIBUTION',
        contribution_date: new Date().toISOString().split('T')[0],
        payment_method: 'CASH',
        transaction_ref: '',
        notes: '',
      });

      if (onSuccess) {
        onSuccess(data.data);
      }

      // Refresh expected amounts to reflect any admin updates
      await fetchExpectedAmounts();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Record Contribution</h2>

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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
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
            <label className="block text-sm font-medium mb-1">Expected Amount (KSh)</label>
            <div className={`w-full border rounded px-3 py-2 font-semibold ${
              expectedAmount > 0 
                ? 'bg-gray-100 text-gray-700 cursor-not-allowed' 
                : 'bg-yellow-50 text-yellow-700 border-yellow-300'
            }`}>
              {expectedAmount > 0 ? expectedAmount.toLocaleString() : 'Not set yet'}
            </div>
            <p className={`text-xs mt-1 ${expectedAmount > 0 ? 'text-gray-500' : 'text-yellow-600'}`}>
              {expectedAmount > 0 
                ? '✓ Set by administrator' 
                : '⚠️ Ask your admin to set your expectation. You can still record contributions.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Amount Currently Contributing (KSh) *</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
              step="0.01"
              min="0"
              placeholder="0.00"
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Balance (KSh)</label>
            <div className={`w-full border rounded px-3 py-2 font-bold ${
              balance === 0 ? 'bg-green-50 text-green-700' : 
              balance < 0 ? 'bg-blue-50 text-blue-700' : 
              expectedAmount === 0 ? 'bg-gray-50 text-gray-700' :
              'bg-yellow-50 text-yellow-700'
            }`}>
              {expectedAmount === 0 ? 'N/A' : Math.abs(balance).toLocaleString()}
              {expectedAmount > 0 && (
                <span className="text-xs ml-1">
                  ({balance === 0 ? 'Paid' : balance < 0 ? 'Overpaid' : 'Due'})
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Contribution Date *</label>
            <input
              type="date"
              name="contribution_date"
              value={formData.contribution_date}
              onChange={handleChange}
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Payment Method</label>
            <select
              name="payment_method"
              value={formData.payment_method}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            >
              <option value="CASH">Cash</option>
              <option value="MPESA">M-Pesa</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CHEQUE">Cheque</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Transaction Reference</label>
          <input
            type="text"
            name="transaction_ref"
            value={formData.transaction_ref}
            onChange={handleChange}
            placeholder="e.g., M-Pesa confirmation no."
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Additional notes"
            rows="3"
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Recording...' : 'Record Contribution'}
        </button>
      </form>
    </div>
  );
}