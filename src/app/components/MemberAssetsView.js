'use client';

// src/app/components/MemberAssetsView.js
// Read-only view of group assets for members.
// Option B: sensitive documents show a label but no download link.

import { useState, useEffect } from 'react';

function formatCurrency(value) {
  if (!value && value !== 0) return null;
  return `KSh ${Number(value).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' });
}

function DocumentRow({ doc }) {
  const isRestricted = doc.is_sensitive && !doc.url;
  const ext = doc.filename.split('.').pop()?.toLowerCase();
  const icon = ext === 'pdf' ? '📄' : ['jpg','jpeg','png','webp'].includes(ext) ? '🖼️' : '📝';

  return (
    <div className={`flex items-center justify-between rounded-lg px-4 py-3 border ${
      isRestricted ? 'bg-orange-50 border-orange-100' : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-base">{isRestricted ? '🔒' : icon}</span>
        <div className="min-w-0">
          <p className={`text-sm font-medium truncate ${isRestricted ? 'text-orange-800' : 'text-gray-800'}`}>
            {doc.filename}
          </p>
          {isRestricted && (
            <p className="text-xs text-orange-600 mt-0.5">
              Restricted — contact your admin for access
            </p>
          )}
        </div>
      </div>

      {!isRestricted && (
        <a
          href={doc.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 ml-4 text-xs px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 font-medium transition"
        >
          View →
        </a>
      )}
    </div>
  );
}

function AssetCard({ asset }) {
  const [showDocs, setShowDocs] = useState(false);
  const publicDocs = asset.documents?.filter(d => !d.is_sensitive || d.url) || [];
  const restrictedDocs = asset.documents?.filter(d => d.is_sensitive && !d.url) || [];
  const totalDocs = asset.documents?.length || 0;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="p-5">
        {/* Asset header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900">{asset.name}</h3>
            {asset.description && (
              <p className="text-sm text-gray-600 mt-1">{asset.description}</p>
            )}
          </div>
          {totalDocs > 0 && (
            <button
              onClick={() => setShowDocs(p => !p)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                showDocs
                  ? 'bg-gray-100 border-gray-300 text-gray-700'
                  : 'border-green-300 text-green-700 hover:bg-green-50'
              }`}
            >
              📎 {totalDocs} doc{totalDocs !== 1 ? 's' : ''}
            </button>
          )}
        </div>

        {/* Asset metadata */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 pt-4 border-t border-gray-100">
          {formatDate(asset.purchase_date) && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Date Acquired</p>
              <p className="text-sm font-medium text-gray-700 mt-0.5">{formatDate(asset.purchase_date)}</p>
            </div>
          )}
          {formatCurrency(asset.purchase_price) && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Purchase Price</p>
              <p className="text-sm font-medium text-gray-700 mt-0.5">{formatCurrency(asset.purchase_price)}</p>
            </div>
          )}
          {formatCurrency(asset.current_value) && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Current Value</p>
              <p className="text-sm font-semibold text-green-700 mt-0.5">{formatCurrency(asset.current_value)}</p>
            </div>
          )}
          {totalDocs === 0 && (
            <p className="text-xs text-gray-400 italic">No documents attached yet.</p>
          )}
        </div>
      </div>

      {/* Documents panel */}
      {showDocs && totalDocs > 0 && (
        <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 space-y-2">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
            Documents ({totalDocs})
          </p>
          {asset.documents.map(doc => (
            <DocumentRow key={doc.id} doc={doc} />
          ))}
          {restrictedDocs.length > 0 && (
            <p className="text-xs text-orange-600 pt-2 border-t border-orange-100">
              🔒 {restrictedDocs.length} document(s) are restricted to admin access only.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function MemberAssetsView() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/assets')
      .then(res => res.json())
      .then(data => {
        if (data.success) setAssets(data.data || []);
        else setError(data.error || 'Failed to load assets');
      })
      .catch(() => setError('Could not load assets'))
      .finally(() => setLoading(false));
  }, []);

  // Compute totals for the summary bar
  const totalPurchaseValue = assets.reduce((sum, a) => sum + (Number(a.purchase_price) || 0), 0);
  const totalCurrentValue = assets.reduce((sum, a) => sum + (Number(a.current_value) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Group Assets & Investments</h2>
        <p className="text-sm text-gray-500 mt-1">
          A transparent view of everything the welfare owns on your behalf
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded text-sm">{error}</div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading assets...</div>
      ) : assets.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center">
          <p className="text-4xl mb-3">🏛️</p>
          <p className="text-gray-500 font-medium">No assets recorded yet.</p>
          <p className="text-sm text-gray-400 mt-1">Check back later — your admin will add assets as the welfare grows.</p>
        </div>
      ) : (
        <>
          {/* Summary bar */}
          {(totalPurchaseValue > 0 || totalCurrentValue > 0) && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <p className="text-xs text-gray-400 uppercase tracking-wide">Total Assets</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{assets.length}</p>
              </div>
              {totalPurchaseValue > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Total Invested</p>
                  <p className="text-xl font-bold text-gray-700 mt-1">
                    KSh {totalPurchaseValue.toLocaleString('en-KE')}
                  </p>
                </div>
              )}
              {totalCurrentValue > 0 && (
                <div className="bg-white border border-green-200 rounded-xl p-4 shadow-sm bg-green-50">
                  <p className="text-xs text-green-600 uppercase tracking-wide">Current Portfolio Value</p>
                  <p className="text-xl font-bold text-green-800 mt-1">
                    KSh {totalCurrentValue.toLocaleString('en-KE')}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Asset cards */}
          <div className="space-y-4">
            {assets.map(asset => (
              <AssetCard key={asset.id} asset={asset} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}