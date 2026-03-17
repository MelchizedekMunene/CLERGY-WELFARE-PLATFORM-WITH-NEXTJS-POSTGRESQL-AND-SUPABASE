'use client';

// src/app/components/UpcomingEventsWidget.js
// Compact widget shown on the member dashboard Overview tab.
// Shows the next N upcoming published events.

import { useState, useEffect } from 'react';

const TYPE_DOT = {
  MEETING: 'bg-blue-500',
  PROJECT: 'bg-purple-500',
  SOCIAL:  'bg-green-500',
};

export default function UpcomingEventsWidget({ limit = 3, onViewAll }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/events/upcoming?limit=${limit}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setEvents(data.data || []);
        else setError(data.error || 'Failed to load events');
      })
      .catch(() => setError('Could not load events'))
      .finally(() => setLoading(false));
  }, [limit]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-3">📅 Upcoming Events</h3>
        <div className="text-sm text-gray-400 animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-900">📅 Upcoming Events</h3>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs text-green-600 hover:text-green-800 font-medium"
          >
            View all →
          </button>
        )}
      </div>

      {error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : events.length === 0 ? (
        <p className="text-sm text-gray-500">No upcoming events scheduled.</p>
      ) : (
        <ul className="space-y-3">
          {events.map(event => {
            const eventDate = new Date(event.event_date);
            const dot = TYPE_DOT[event.event_type] || 'bg-gray-400';

            return (
              <li key={event.id} className="flex items-start gap-3">
                {/* Colored dot */}
                <span className={`mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${dot}`} />

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{event.title}</p>
                  <p className="text-xs text-gray-500">
                    {eventDate.toLocaleDateString('en-KE', { weekday: 'short', month: 'short', day: 'numeric' })}
                    {' · '}
                    {eventDate.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                    {event.location && ` · ${event.location}`}
                  </p>
                </div>

                {/* Days until */}
                <DaysUntil date={eventDate} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function DaysUntil({ date }) {
  const now = new Date();
  const diff = Math.ceil((date - now) / (1000 * 60 * 60 * 24));

  if (diff === 0) return <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Today</span>;
  if (diff === 1) return <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Tomorrow</span>;
  if (diff <= 7) return <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">In {diff}d</span>;
  return <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{diff}d</span>;
}