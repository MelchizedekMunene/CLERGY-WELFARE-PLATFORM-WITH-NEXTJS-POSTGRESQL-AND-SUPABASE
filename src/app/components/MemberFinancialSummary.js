'use client';

import { useEffect, useState } from 'react';

export default function MemberFinancialSummary({ memberId, refreshKey = 0 }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const [summaryRes, balanceRes] = await Promise.all([
        fetch(`/api/financial/summary/${memberId}?t=${Date.now()}`),
        fetch(`/api/financial/balance?memberId=${memberId}&t=${Date.now()}`),
      ]);

      const summaryData = await summaryRes.json();
      const balanceData = await balanceRes.json();

      if (!summaryRes.ok) throw new Error(summaryData.error || 'Failed to load summary');

      setSummary({
        ...summaryData.data,
        // Merge in per-type outstanding balances from the balance endpoint
        balances: balanceRes.ok ? balanceData.data : null,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [memberId, refreshKey]);

  if (loading) {
    return <div className="text-center text-gray-500">Loading...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  if (!summary) {
    return <div className="text-center text-gray-500">No data available</div>;
  }

  const statusColor = summary.difference === 0 ? 'green' : summary.difference < 0 ? 'blue' : 'yellow';
  const statusText = summary.difference === 0 ? 'PAID' : summary.difference < 0 ? 'OVERPAID' : 'PENDING';

  // Check if any expected amounts have been set
  const hasExpectedAmounts = summary.monthlyExpected > 0 || summary.socialExpected > 0 || summary.specialExpected > 0;

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6 flex items-center justify-between">
        Financial Summary
        <span className={`text-sm px-3 py-1 rounded bg-${statusColor}-100 text-${statusColor}-700`}>
          {statusText}
        </span>
      </h2>

      {!hasExpectedAmounts && (
        <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
          <p className="text-blue-900 font-medium">ℹ️ Awaiting Admin Setup</p>
          <p className="text-blue-700 text-sm mt-1">
            Your administrator hasn't set expected contribution amounts yet. Once they do, your expected obligations will appear below.
          </p>
        </div>
      )}

      {/* Per-type breakdown using real outstanding balances */}
      <div className="space-y-3 mb-6">
        {[
          { key: 'MONTHLY_CONTRIBUTION', label: 'Monthly Contribution', color: 'purple' },
          { key: 'SOCIAL_WELFARE', label: 'Social Welfare', color: 'green' },
          { key: 'SPECIAL', label: 'Special Contribution', color: 'orange' },
        ].map(({ key, label, color }) => {
          const bal = summary.balances?.[key];
          if (!bal || !bal.hasExpectation) return null;
          const outstanding = bal.outstandingAmount || 0;
          const paid = bal.paid || 0;
          const expected = bal.expected || 0;
          const pct = expected > 0 ? Math.min(100, Math.round((paid / expected) * 100)) : 0;
          return (
            <div key={key} className={`border-l-4 border-${color}-500 pl-4 py-2`}>
              <div className="flex justify-between items-start mb-1">
                <p className="text-gray-600 text-sm font-medium">{label}</p>
                {outstanding > 0
                  ? <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold">KSh {outstanding.toLocaleString()} due</span>
                  : <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">✓ Fully paid</span>
                }
              </div>
              <p className="text-xl font-bold text-gray-900">
                KSh {paid.toLocaleString()}
                <span className="text-sm font-normal text-gray-500 ml-1">of KSh {expected.toLocaleString()}</span>
              </p>
              {/* Progress bar */}
              <div className="mt-1.5 w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full bg-${color}-500`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{pct}% paid</p>
            </div>
          );
        })}
      </div>

      {/* Totals row */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
        <div className="border-l-4 border-indigo-500 pl-4">
          <p className="text-gray-600 text-sm">Total Expected</p>
          <p className="text-2xl font-bold text-gray-900">KSh {summary.totalExpected.toLocaleString()}</p>
        </div>
        <div className="border-l-4 border-teal-500 pl-4">
          <p className="text-gray-600 text-sm">Total Contributed</p>
          <p className="text-2xl font-bold text-gray-900">KSh {summary.totalContributed.toLocaleString()}</p>
        </div>
      </div>

      <div className={`mt-6 p-4 rounded ${statusColor === 'green' ? 'bg-green-50 border border-green-200' : statusColor === 'blue' ? 'bg-blue-50 border border-blue-200' : 'bg-yellow-50 border border-yellow-200'}`}>
        <p className="text-gray-700 font-semibold">
          {statusText === 'PAID' && '✓ All contributions are up to date!'}
          {statusText === 'OVERPAID' && `✓ You have overpaid by KSh ${Math.abs(summary.difference).toLocaleString()}`}
          {statusText === 'PENDING' && `You still owe KSh ${summary.difference.toLocaleString()}`}
        </p>
      </div>
    </div>
  );
}