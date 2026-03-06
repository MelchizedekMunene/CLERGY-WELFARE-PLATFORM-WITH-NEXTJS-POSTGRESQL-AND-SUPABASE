'use client';

import { useState, useEffect } from 'react';

export default function ContributionForm({ memberId, onSuccess, refreshKey = 0 }) {
  const [loading, setLoading] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(false);
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

  // ---------------------------------------------------------------------------
  // FIX 1 — Wrong fetch URL causing 403 and silent failure:
  // The form was appending memberId as a query param to /api/financial/balance.
  // That endpoint's guard blocks non-admin users from passing any memberId param
  // (even their own id), returning 403. The fetch failed silently, leaving
  // expectedAmounts empty and every balance field showing "Not set yet".
  //
  // The balance route already uses session.user.id when no memberId is given —
  // which is exactly what a logged-in member needs. We omit the param entirely.
  //
  // FIX 2 — Wrong useEffect guard blocking the fetch entirely:
  // The effect had `if (memberId) fetchExpectedAmounts()` meaning it never ran
  // if the parent forgot to pass memberId or if it arrived late. Since the API
  // resolves identity from the session cookie (not the prop), the guard is wrong.
  // Removed — the effect now always fires on mount and on refreshKey changes.
  // ---------------------------------------------------------------------------
  const fetchExpectedAmounts = async () => {
    setBalanceLoading(true);
    try {
      // No memberId param — server resolves identity from session cookie
      const res = await fetch(`/api/financial/balance?t=${Date.now()}`);
      const data = await res.json();

      if (!res.ok) {
        console.error('Balance API error:', data.error, 'status:', res.status);
        setError(`Could not load expected amounts: ${data.error || res.status}`);
        setExpectedAmounts({});
        return;
      }

      if (data.data) {
        setExpectedAmounts({
          MONTHLY_CONTRIBUTION: data.data.MONTHLY_CONTRIBUTION || { expected: 0, paid: 0, outstandingAmount: 0, hasExpectation: false },
          SOCIAL_WELFARE:       data.data.SOCIAL_WELFARE       || { expected: 0, paid: 0, outstandingAmount: 0, hasExpectation: false },
          SPECIAL:              data.data.SPECIAL              || { expected: 0, paid: 0, outstandingAmount: 0, hasExpectation: false },
        });
      }
    } catch (err) {
      console.error('Failed to fetch balances:', err);
      setError('Network error loading expected amounts. Please refresh.');
      setExpectedAmounts({});
    } finally {
      setBalanceLoading(false);
    }
  };

  useEffect(() => {
    // FIX 2: No guard, no memberId dependency — session handles identity.
    fetchExpectedAmounts();
  }, [refreshKey]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (error) setError('');
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Derived display values for the selected contribution type
  const balanceData = expectedAmounts[formData.contribution_type] || {
    expected: 0, paid: 0, outstandingAmount: 0, hasExpectation: false,
  };
  const expectedAmount    = balanceData.expected         || 0;
  const outstandingAmount = balanceData.outstandingAmount || 0;
  const alreadyPaid       = balanceData.paid              || 0;
  const actualAmount      = parseFloat(formData.amount)  || 0;
  const balance           = outstandingAmount - actualAmount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/financial/contributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // FIX 3: Do not send expectedAmount from the client — the fixed
        // createContribution() derives it from ExpectedContribution server-side
        // and ignores any client-supplied value. Sending it was causing confusion
        // between the old "outstanding balance" value and the correct fixed amount.
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
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

      if (onSuccess) onSuccess(data.data);

      // Refresh balances to reflect the new payment
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
            <label className="block text-sm font-medium mb-1">Outstanding Balance (KSh)</label>
            <div className={`w-full border rounded px-3 py-2 font-semibold ${
              balanceLoading
                ? 'bg-gray-50 text-gray-400 border-gray-200'
                : !balanceData.hasExpectation
                  ? 'bg-yellow-50 text-yellow-700 border-yellow-300'
                  : balanceData.isFullyPaid
                    ? 'bg-green-50 text-green-700 border-green-300'
                    : 'bg-red-50 text-red-700 border-red-300'
            }`}>
              {balanceLoading
                ? 'Loading...'
                : !balanceData.hasExpectation
                  ? 'Not set yet'
                  : balanceData.isFullyPaid
                    ? '✓ Fully paid'
                    : `${outstandingAmount.toLocaleString()} Due`}
            </div>
            <p className="text-xs mt-1 text-gray-500">
              {balanceLoading
                ? 'Fetching your balance...'
                : !balanceData.hasExpectation
                  ? '⚠️ Ask your admin to set your expected contribution first.'
                  : balanceData.isFullyPaid
                    ? `✓ Paid ${alreadyPaid.toLocaleString()} of ${expectedAmount.toLocaleString()}`
                    : `Paid ${alreadyPaid.toLocaleString()} of ${expectedAmount.toLocaleString()} total`}
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
            <label className="block text-sm font-medium mb-1">Remaining After This Payment</label>
            <div className={`w-full border rounded px-3 py-2 font-bold ${
              !balanceData.hasExpectation ? 'bg-gray-50 text-gray-700' :
              balance <= 0 ? 'bg-green-50 text-green-700' :
              'bg-yellow-50 text-yellow-700'
            }`}>
              {!balanceData.hasExpectation
                ? 'N/A'
                : balance <= 0
                  ? `${Math.abs(balance).toLocaleString()} ${balance < 0 ? '(Overpaid)' : '(Fully Paid)'}`
                  : `${balance.toLocaleString()} still due`}
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
          disabled={loading || balanceLoading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Recording...' : 'Record Contribution'}
        </button>
      </form>
    </div>
  );
}