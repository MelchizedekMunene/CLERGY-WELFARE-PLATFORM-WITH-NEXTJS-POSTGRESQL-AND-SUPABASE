'use client';

// src/app/components/AdminEventsManager.js
// Admin-only component for creating, editing, and deleting events.
// Renders a creation form at the top and a filterable event list below.

import { useState, useEffect } from 'react';

const EVENT_TYPE_LABELS = {
  MEETING: { label: 'Meeting', color: 'bg-blue-100 text-blue-800' },
  PROJECT: { label: 'Project', color: 'bg-purple-100 text-purple-800' },
  SOCIAL:  { label: 'Social',  color: 'bg-green-100 text-green-800' },
};

const EMPTY_FORM = {
  title: '',
  description: '',
  event_date: '',
  location: '',
  event_type: 'MEETING',
  is_published: true,
};

export default function AdminEventsManager() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [globalError, setGlobalError] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [filter]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const url = new URL('/api/events', window.location.origin);
      if (filter) url.searchParams.append('type', filter);
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load events');
      setEvents(data.data || []);
    } catch (err) {
      setGlobalError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Create Form ────────────────────────────────────────────────────────────

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess('');

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          event_type: formData.event_type || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create event');

      setFormSuccess('Event created successfully!');
      setFormData(EMPTY_FORM);
      setShowForm(false);
      await fetchEvents();
      setTimeout(() => setFormSuccess(''), 4000);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // ─── Inline Edit ─────────────────────────────────────────────────────────────

  const handleEditClick = (event) => {
    setEditingId(event.id);
    setEditData({
      title: event.title,
      description: event.description || '',
      event_date: new Date(event.event_date).toISOString().slice(0, 16), // datetime-local format
      location: event.location || '',
      event_type: event.event_type || 'MEETING',
      is_published: event.is_published,
    });
  };

  const handleEditChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveEdit = async (eventId) => {
    setSavingId(eventId);
    setGlobalError('');

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editData,
          event_date: editData.event_date,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update event');

      setEditingId(null);
      await fetchEvents();
    } catch (err) {
      setGlobalError(err.message);
    } finally {
      setSavingId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  // ─── Delete ───────────────────────────────────────────────────────────────────

  const handleDelete = async (eventId) => {
    if (!confirm('Delete this event? This cannot be undone.')) return;

    try {
      const res = await fetch(`/api/events/${eventId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete event');
      await fetchEvents();
    } catch (err) {
      setGlobalError(err.message);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Global error banner */}
      {globalError && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded flex justify-between items-center">
          <span>❌ {globalError}</span>
          <button onClick={() => setGlobalError('')} className="font-bold ml-4">✕</button>
        </div>
      )}

      {/* Form success banner (shown after form closes) */}
      {formSuccess && (
        <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded flex justify-between items-center">
          <span>✅ {formSuccess}</span>
          <button onClick={() => setFormSuccess('')} className="font-bold ml-4">✕</button>
        </div>
      )}

      {/* Header + toggle create form */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Events Management</h2>
          <p className="text-sm text-gray-500 mt-1">Create and manage community events visible to members</p>
        </div>
        <button
          onClick={() => { setShowForm(prev => !prev); setFormError(''); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold flex items-center gap-2"
        >
          {showForm ? '✕ Cancel' : '+ New Event'}
        </button>
      </div>

      {/* Create Event Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Create New Event</h3>

          {formError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              {formError}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g., Monthly General Meeting"
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Date & Time *</label>
                <input
                  type="datetime-local"
                  name="event_date"
                  value={formData.event_date}
                  onChange={handleFormChange}
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                <select
                  name="event_type"
                  value={formData.event_type}
                  onChange={handleFormChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="MEETING">Meeting</option>
                  <option value="PROJECT">Project</option>
                  <option value="SOCIAL">Social</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleFormChange}
                  placeholder="e.g., Church Hall, Zoom link, etc."
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  rows="3"
                  placeholder="What is this event about? Any agenda or details members should know."
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="is_published"
                  id="is_published"
                  checked={formData.is_published}
                  onChange={handleFormChange}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="is_published" className="text-sm font-medium text-gray-700">
                  Publish immediately (visible to members)
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={formLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold transition"
              >
                {formLoading ? 'Creating...' : 'Create Event'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setFormError(''); setFormData(EMPTY_FORM); }}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter + Events Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow">
        <div className="p-4 border-b border-gray-200 flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filter by type:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm"
          >
            <option value="">All Types</option>
            <option value="MEETING">Meeting</option>
            <option value="PROJECT">Project</option>
            <option value="SOCIAL">Social</option>
          </select>
          <span className="text-sm text-gray-400 ml-auto">{events.length} event(s)</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No events found. Click <strong>+ New Event</strong> to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {events.map(event => {
                  const isEditing = editingId === event.id;
                  const isSaving = savingId === event.id;
                  const typeStyle = EVENT_TYPE_LABELS[event.event_type] || { label: event.event_type || '—', color: 'bg-gray-100 text-gray-700' };

                  return (
                    <tr key={event.id} className={`hover:bg-gray-50 ${isEditing ? 'bg-yellow-50' : ''}`}>

                      {/* Title */}
                      <td className="px-4 py-3 text-sm">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editData.title}
                            onChange={(e) => handleEditChange('title', e.target.value)}
                            className="border rounded px-2 py-1 w-48 text-sm"
                            disabled={isSaving}
                          />
                        ) : (
                          <span className="font-medium text-gray-900">{event.title}</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {isEditing ? (
                          <input
                            type="datetime-local"
                            value={editData.event_date}
                            onChange={(e) => handleEditChange('event_date', e.target.value)}
                            className="border rounded px-2 py-1 text-sm"
                            disabled={isSaving}
                          />
                        ) : (
                          <>
                            <div>{new Date(event.event_date).toLocaleDateString('en-KE', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</div>
                            <div className="text-xs text-gray-400">{new Date(event.event_date).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}</div>
                          </>
                        )}
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <select
                            value={editData.event_type}
                            onChange={(e) => handleEditChange('event_type', e.target.value)}
                            className="border rounded px-2 py-1 text-sm"
                            disabled={isSaving}
                          >
                            <option value="MEETING">Meeting</option>
                            <option value="PROJECT">Project</option>
                            <option value="SOCIAL">Social</option>
                          </select>
                        ) : (
                          <span className={`text-xs px-2 py-1 rounded font-medium ${typeStyle.color}`}>
                            {typeStyle.label}
                          </span>
                        )}
                      </td>

                      {/* Location */}
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editData.location}
                            onChange={(e) => handleEditChange('location', e.target.value)}
                            className="border rounded px-2 py-1 w-36 text-sm"
                            disabled={isSaving}
                          />
                        ) : (
                          event.location || <span className="text-gray-400">—</span>
                        )}
                      </td>

                      {/* Published status */}
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <select
                            value={editData.is_published ? 'true' : 'false'}
                            onChange={(e) => handleEditChange('is_published', e.target.value === 'true')}
                            className="border rounded px-2 py-1 text-sm"
                            disabled={isSaving}
                          >
                            <option value="true">Published</option>
                            <option value="false">Draft</option>
                          </select>
                        ) : (
                          <span className={`text-xs px-2 py-1 rounded font-medium ${event.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                            {event.is_published ? 'Published' : 'Draft'}
                          </span>
                        )}
                      </td>

                      {/* Created by */}
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {event.createdBy?.full_name || '—'}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => handleSaveEdit(event.id)}
                              disabled={isSaving}
                              className="text-green-600 hover:text-green-800 font-semibold text-sm mr-3 disabled:opacity-50"
                            >
                              {isSaving ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              disabled={isSaving}
                              className="text-gray-500 hover:text-gray-700 text-sm"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEditClick(event)}
                              className="text-blue-600 hover:text-blue-800 font-medium text-sm mr-3"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(event.id)}
                              className="text-red-600 hover:text-red-800 font-medium text-sm"
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
        )}
      </div>
    </div>
  );
}