'use client';

// src/app/components/AssetDocumentUploader.js
// Reusable drag-and-drop file uploader for asset documents.
// Uploads to /api/assets/upload, then saves metadata to /api/assets/[assetId]/documents.
// Accepts: PDF, JPG, PNG, WEBP, DOC, DOCX — max 10MB per file.

import { useState, useRef, useCallback } from 'react';

const ACCEPTED_EXTENSIONS = '.pdf,.jpg,.jpeg,.png,.webp,.doc,.docx';
const ACCEPTED_LABEL = 'PDF, JPG, PNG, WEBP, DOC, DOCX';

function FileIcon({ type }) {
  if (type?.includes('pdf')) return <span className="text-red-500 text-lg">📄</span>;
  if (type?.includes('image')) return <span className="text-blue-500 text-lg">🖼️</span>;
  if (type?.includes('word') || type?.includes('document')) return <span className="text-blue-700 text-lg">📝</span>;
  return <span className="text-gray-500 text-lg">📎</span>;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AssetDocumentUploader({ assetId, onUploadComplete }) {
  const [isDragging, setIsDragging] = useState(false);
  const [queue, setQueue] = useState([]); // { file, isSensitive, status, error, progress }
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const addFiles = useCallback((files) => {
    const newItems = Array.from(files).map(file => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      file,
      isSensitive: true, // default: sensitive until admin unchecks
      status: 'pending', // pending | uploading | done | error
      error: null,
      progress: 0,
    }));
    setQueue(prev => [...prev, ...newItems]);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  const handleInputChange = (e) => {
    if (e.target.files?.length) addFiles(e.target.files);
  };

  const toggleSensitive = (id) => {
    setQueue(prev => prev.map(item =>
      item.id === id ? { ...item, isSensitive: !item.isSensitive } : item
    ));
  };

  const removeFromQueue = (id) => {
    setQueue(prev => prev.filter(item => item.id !== id));
  };

  const uploadAll = async () => {
    const pending = queue.filter(item => item.status === 'pending');
    if (!pending.length) return;

    setUploading(true);

    for (const item of pending) {
      // Mark as uploading
      setQueue(prev => prev.map(q =>
        q.id === item.id ? { ...q, status: 'uploading', progress: 10 } : q
      ));

      try {
        // Step 1 — Upload file to Supabase Storage via API route
        const formData = new FormData();
        formData.append('file', item.file);
        formData.append('assetId', assetId);

        const uploadRes = await fetch('/api/assets/upload', {
          method: 'POST',
          body: formData,
        });

        const uploadData = await uploadRes.json();

        if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload failed');

        setQueue(prev => prev.map(q =>
          q.id === item.id ? { ...q, progress: 70 } : q
        ));

        // Step 2 — Save document metadata in DB
        const metaRes = await fetch(`/api/assets/${assetId}/documents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: uploadData.filename,
            url: uploadData.url,
            is_sensitive: item.isSensitive,
          }),
        });

        const metaData = await metaRes.json();
        if (!metaRes.ok) throw new Error(metaData.error || 'Failed to save document record');

        setQueue(prev => prev.map(q =>
          q.id === item.id ? { ...q, status: 'done', progress: 100 } : q
        ));

        if (onUploadComplete) onUploadComplete(metaData.data);

      } catch (err) {
        setQueue(prev => prev.map(q =>
          q.id === item.id ? { ...q, status: 'error', error: err.message, progress: 0 } : q
        ));
      }
    }

    setUploading(false);
  };

  const clearDone = () => {
    setQueue(prev => prev.filter(item => item.status !== 'done'));
  };

  const pendingCount = queue.filter(i => i.status === 'pending').length;
  const doneCount = queue.filter(i => i.status === 'done').length;

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-green-500 bg-green-50 scale-[1.01]'
            : 'border-gray-300 bg-gray-50 hover:border-green-400 hover:bg-green-50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_EXTENSIONS}
          onChange={handleInputChange}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-2">
          <div className={`text-4xl transition-transform ${isDragging ? 'scale-125' : ''}`}>
            {isDragging ? '📂' : '📁'}
          </div>
          <p className="text-sm font-semibold text-gray-700">
            {isDragging ? 'Drop files here' : 'Drag & drop files or click to browse'}
          </p>
          <p className="text-xs text-gray-400">
            Accepted: {ACCEPTED_LABEL} · Max 10MB per file
          </p>
        </div>
      </div>

      {/* Queue */}
      {queue.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <p className="text-sm font-semibold text-gray-700">
              {queue.length} file(s) queued
            </p>
            {doneCount > 0 && (
              <button onClick={clearDone} className="text-xs text-gray-400 hover:text-gray-600">
                Clear completed
              </button>
            )}
          </div>

          {queue.map(item => (
            <div
              key={item.id}
              className={`border rounded-lg p-3 transition-all ${
                item.status === 'done' ? 'bg-green-50 border-green-200' :
                item.status === 'error' ? 'bg-red-50 border-red-200' :
                item.status === 'uploading' ? 'bg-blue-50 border-blue-200' :
                'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <FileIcon type={item.file.type} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.file.name}</p>
                    <span className="text-xs text-gray-400 flex-shrink-0">{formatBytes(item.file.size)}</span>
                  </div>

                  {/* Progress bar */}
                  {item.status === 'uploading' && (
                    <div className="mt-1.5 h-1.5 bg-blue-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  )}

                  {item.status === 'error' && (
                    <p className="text-xs text-red-600 mt-1">❌ {item.error}</p>
                  )}

                  {item.status === 'done' && (
                    <p className="text-xs text-green-600 mt-1">✅ Uploaded successfully</p>
                  )}

                  {/* Sensitivity toggle — only for pending items */}
                  {item.status === 'pending' && (
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleSensitive(item.id); }}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                          item.isSensitive ? 'bg-orange-400' : 'bg-green-500'
                        }`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                          item.isSensitive ? 'translate-x-1' : 'translate-x-4'
                        }`} />
                      </button>
                      <span className="text-xs text-gray-600">
                        {item.isSensitive
                          ? '🔒 Sensitive — members see label only'
                          : '👁️ Public — members can view & download'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Remove button for pending/error */}
                {(item.status === 'pending' || item.status === 'error') && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeFromQueue(item.id); }}
                    className="text-gray-400 hover:text-red-500 transition flex-shrink-0 text-lg leading-none"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Upload button */}
          {pendingCount > 0 && (
            <button
              onClick={uploadAll}
              disabled={uploading}
              className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold text-sm transition"
            >
              {uploading ? 'Uploading...' : `Upload ${pendingCount} file(s)`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}