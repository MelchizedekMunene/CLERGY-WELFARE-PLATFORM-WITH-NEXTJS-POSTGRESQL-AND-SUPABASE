'use client';

import { useEffect, useState } from 'react';

export default function MemberFinancialSummary({ memberId }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchSummary() {
      try {
        const res = await fetch(`/api/financial/summary/${memberId}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to load summary');
        }

        setSummary(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchSummary();
  }, [memberId]);

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

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6 flex items-center justify-between">
        Financial Summary
        <span className={`text-sm px-3 py-1 rounded bg-${statusColor}-100 text-${statusColor}-700`}>
          {statusText}
        </span>
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="border-l-4 border-blue-500 pl-4">
          <p className="text-gray-600 text-sm">Registration Fee</p>
          <p className="text-2xl font-bold text-gray-900">KSh {summary.registrationFee.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Status: {summary.registrationStatus}</p>
        </div>

        <div className="border-l-4 border-purple-500 pl-4">
          <p className="text-gray-600 text-sm">Monthly Contribution</p>
          <p className="text-2xl font-bold text-gray-900">KSh {summary.monthlyContribution.toLocaleString()}</p>
        </div>

        <div className="border-l-4 border-green-500 pl-4">
          <p className="text-gray-600 text-sm">Social Welfare</p>
          <p className="text-2xl font-bold text-gray-900">KSh {summary.socialWelfare.toLocaleString()}</p>
        </div>

        {summary.specialContribution > 0 && (
          <div className="border-l-4 border-orange-500 pl-4">
            <p className="text-gray-600 text-sm">Special Contribution</p>
            <p className="text-2xl font-bold text-gray-900">KSh {summary.specialContribution.toLocaleString()}</p>
          </div>
        )}

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
