'use client';

// src/app/components/AdminAssetsManager.js
// Admin component for managing group assets and their documents.
// Supports creating, editing, deleting assets and uploading/deleting documents.

import { useState, useEffect } from 'react';
import AssetDocumentUploader from './AssetDocumentUploader';

const EMPTY_FORM = {
  name: '',
  description: '',
  purchase_date: '',
  purchase_price: '',
  current_value: '',
};

function formatCurrency(value) {
  if (!value && value !== 0) return '—';
  return `KSh ${Number(value).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function AdminAssetsManager() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState('');
  const [globalSuccess, setGlobalSuccess] = useState('');

  // Create form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [savingId, setSavingId] = useState(null);

  // Expanded asset (shows documents panel)
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => { fetchAssets(); }, []);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/assets');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load assets');
      setAssets(data.data || []);
    } catch (err) {
      setGlobalError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Create ──────────────────────────────────────────────────────────────────

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    try {
      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          purchase_price: formData.purchase_price || null,
          current_value: formData.current_value || null,
          purchase_date: formData.purchase_date || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create asset');

      setGlobalSuccess('Asset created successfully!');
      setFormData(EMPTY_FORM);
      setShowCreateForm(false);
      await fetchAssets();
      // Auto-expand newly created asset for immediate document upload
      setExpandedId(data.data.id);
      setTimeout(() => setGlobalSuccess(''), 4000);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // ─── Edit ─────────────────────────────────────────────────────────────────────

  const handleEditClick = (asset) => {
    setEditingId(asset.id);
    setEditData({
      name: asset.name,
      description: asset.description || '',
      purchase_date: asset.purchase_date ? new Date(asset.purchase_date).toISOString().split('T')[0] : '',
      purchase_price: asset.purchase_price || '',
      current_value: asset.current_value || '',
    });
  };

  const handleSaveEdit = async (assetId) => {
    setSavingId(assetId);
    setGlobalError('');
    try {
      const res = await fetch(`/api/assets/${assetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update asset');

      setEditingId(null);
      setGlobalSuccess('Asset updated successfully!');
      await fetchAssets();
      setTimeout(() => setGlobalSuccess(''), 3000);
    } catch (err) {
      setGlobalError(err.message);
    } finally {
      setSavingId(null);
    }
  };

  // ─── Delete ───────────────────────────────────────────────────────────────────

  const handleDelete = async (assetId, assetName) => {
    if (!confirm(`Delete "${assetName}" and ALL its documents? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/assets/${assetId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete asset');
      setGlobalSuccess('Asset deleted.');
      if (expandedId === assetId) setExpandedId(null);
      await fetchAssets();
      setTimeout(() => setGlobalSuccess(''), 3000);
    } catch (err) {
      setGlobalError(err.message);
    }
  };

  // ─── Document delete ──────────────────────────────────────────────────────────

  const handleDeleteDocument = async (assetId, documentId, filename) => {
    if (!confirm(`Delete document "${filename}"?`)) return;
    try {
      const res = await fetch(`/api/assets/${assetId}/documents/${documentId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete document');
      await fetchAssets();
    } catch (err) {
      setGlobalError(err.message);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Banners */}
      {globalError && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex justify-between">
          <span>❌ {globalError}</span>
          <button onClick={() => setGlobalError('')} className="font-bold ml-4">✕</button>
        </div>
      )}
      {globalSuccess && (
        <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex justify-between">
          <span>✅ {globalSuccess}</span>
          <button onClick={() => setGlobalSuccess('')} className="font-bold ml-4">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Group Assets</h2>
          <p className="text-sm text-gray-500 mt-1">Manage welfare assets and attach relevant documents for members</p>
        </div>
        <button
          onClick={() => { setShowCreateForm(p => !p); setFormError(''); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition flex items-center gap-2"
        >
          {showCreateForm ? '✕ Cancel' : '+ New Asset'}
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-white border border-gray-200 rounded-xl shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Asset</h3>
          {formError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded text-sm">{formError}</div>
          )}
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Asset Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  required
                  placeholder="e.g., 2-Acre Land Plot — Nakuru, Church Van, Office Space"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                  rows="2"
                  placeholder="Describe this asset — location, purpose, key details"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
                <input
                  type="date"
                  value={formData.purchase_date}
                  onChange={e => setFormData(p => ({ ...p, purchase_date: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price (KSh)</label>
                <input
                  type="number"
                  value={formData.purchase_price}
                  onChange={e => setFormData(p => ({ ...p, purchase_price: e.target.value }))}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Value (KSh)</label>
                <input
                  type="number"
                  value={formData.current_value}
                  onChange={e => setFormData(p => ({ ...p, current_value: e.target.value }))}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={formLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold transition">
                {formLoading ? 'Creating...' : 'Create Asset'}
              </button>
              <button type="button"
                onClick={() => { setShowCreateForm(false); setFormData(EMPTY_FORM); setFormError(''); }}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Assets List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading assets...</div>
      ) : assets.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center">
          <p className="text-4xl mb-3">🏛️</p>
          <p className="text-gray-500 font-medium">No assets recorded yet.</p>
          <p className="text-sm text-gray-400 mt-1">Click <strong>+ New Asset</strong> to add the welfare's first asset.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {assets.map(asset => {
            const isEditing = editingId === asset.id;
            const isSaving = savingId === asset.id;
            const isExpanded = expandedId === asset.id;

            return (
              <div key={asset.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">

                {/* Asset Row */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={editData.name}
                            onChange={e => setEditData(p => ({ ...p, name: e.target.value }))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                            disabled={isSaving}
                          />
                          <textarea
                            value={editData.description}
                            onChange={e => setEditData(p => ({ ...p, description: e.target.value }))}
                            rows="2"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                            disabled={isSaving}
                          />
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="text-xs text-gray-500 mb-1 block">Purchase Date</label>
                              <input type="date" value={editData.purchase_date}
                                onChange={e => setEditData(p => ({ ...p, purchase_date: e.target.value }))}
                                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm outline-none" disabled={isSaving} />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 mb-1 block">Purchase Price (KSh)</label>
                              <input type="number" value={editData.purchase_price}
                                onChange={e => setEditData(p => ({ ...p, purchase_price: e.target.value }))}
                                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm outline-none" disabled={isSaving} />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 mb-1 block">Current Value (KSh)</label>
                              <input type="number" value={editData.current_value}
                                onChange={e => setEditData(p => ({ ...p, current_value: e.target.value }))}
                                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm outline-none" disabled={isSaving} />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleSaveEdit(asset.id)} disabled={isSaving}
                              className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition">
                              {isSaving ? 'Saving...' : 'Save'}
                            </button>
                            <button onClick={() => setEditingId(null)} disabled={isSaving}
                              className="px-4 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition">
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <h3 className="text-lg font-bold text-gray-900">{asset.name}</h3>
                          {asset.description && (
                            <p className="text-sm text-gray-600 mt-1">{asset.description}</p>
                          )}
                          <div className="flex flex-wrap gap-4 mt-3">
                            {asset.purchase_date && (
                              <span className="text-xs text-gray-500">📅 Purchased: {formatDate(asset.purchase_date)}</span>
                            )}
                            {asset.purchase_price && (
                              <span className="text-xs text-gray-500">💰 Paid: {formatCurrency(asset.purchase_price)}</span>
                            )}
                            {asset.current_value && (
                              <span className="text-xs font-semibold text-green-700">📈 Current: {formatCurrency(asset.current_value)}</span>
                            )}
                            <span className="text-xs text-gray-400">
                              📎 {asset.documents?.length || 0} document(s)
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Actions */}
                    {!isEditing && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : asset.id)}
                          className={`px-3 py-1.5 text-sm rounded-lg border transition font-medium ${
                            isExpanded ? 'bg-gray-100 border-gray-300 text-gray-700' : 'border-green-300 text-green-700 hover:bg-green-50'
                          }`}
                        >
                          {isExpanded ? 'Hide Docs' : '📎 Documents'}
                        </button>
                        <button onClick={() => handleEditClick(asset)}
                          className="px-3 py-1.5 text-sm rounded-lg border border-blue-300 text-blue-700 hover:bg-blue-50 transition font-medium">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(asset.id, asset.name)}
                          className="px-3 py-1.5 text-sm rounded-lg border border-red-300 text-red-700 hover:bg-red-50 transition font-medium">
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Documents Panel */}
                {isExpanded && !isEditing && (
                  <div className="border-t border-gray-100 bg-gray-50 p-5 space-y-5">
                    <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Documents</h4>

                    {/* Existing documents */}
                    {asset.documents?.length > 0 ? (
                      <div className="space-y-2">
                        {asset.documents.map(doc => (
                          <div key={doc.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-lg">
                                {doc.filename.match(/\.pdf$/i) ? '📄' :
                                 doc.filename.match(/\.(jpg|jpeg|png|webp)$/i) ? '🖼️' : '📝'}
                              </span>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">{doc.filename}</p>
                                <p className="text-xs text-gray-400">
                                  Uploaded by {doc.uploadedBy?.full_name || 'Admin'} ·{' '}
                                  {new Date(doc.created_at).toLocaleDateString('en-KE')}
                                </p>
                              </div>
                              {doc.is_sensitive && (
                                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                                  🔒 Sensitive
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                              <a href={doc.url} target="_blank" rel="noopener noreferrer"
                                className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium transition">
                                View
                              </a>
                              <button onClick={() => handleDeleteDocument(asset.id, doc.id, doc.filename)}
                                className="text-xs px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 font-medium transition">
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic">No documents uploaded yet.</p>
                    )}

                    {/* Upload new documents */}
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-3">Upload New Document</p>
                      <AssetDocumentUploader
                        assetId={asset.id}
                        onUploadComplete={() => fetchAssets()}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}