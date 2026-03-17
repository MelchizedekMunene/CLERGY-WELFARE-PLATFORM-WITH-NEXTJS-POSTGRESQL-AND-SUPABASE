'use client';

// src/app/components/MemberEventsView.js
// Read-only events view for members. Shows a month grid calendar
// and a list of all upcoming events. No external calendar library needed —
// the grid is built natively to avoid any install requirement.

import { useState, useEffect } from 'react';

const EVENT_TYPE_STYLES = {
  MEETING: { label: 'Meeting', dot: 'bg-blue-500',  badge: 'bg-blue-100 text-blue-800' },
  PROJECT: { label: 'Project', dot: 'bg-purple-500', badge: 'bg-purple-100 text-purple-800' },
  SOCIAL:  { label: 'Social',  dot: 'bg-green-500',  badge: 'bg-green-100 text-green-800' },
};

function CalendarGrid({ events, year, month }) {
  // Build the calendar days array
  const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  // Map events to their date keys (YYYY-MM-DD)
  const eventsByDate = {};
  events.forEach(ev => {
    const d = new Date(ev.event_date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    if (!eventsByDate[key]) eventsByDate[key] = [];
    eventsByDate[key].push(ev);
  });

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div>
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map(d => (
          <div key={d} className="text-center text-xs font-semibold text-gray-500 py-2">{d}</div>
        ))}
      </div>
      {/* Day cells */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded overflow-hidden">
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} className="bg-gray-50 min-h-[60px]" />;

          const key = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const dayEvents = eventsByDate[key] || [];
          const isToday =
            today.getFullYear() === year &&
            today.getMonth() === month &&
            today.getDate() === day;

          return (
            <div key={key} className="bg-white min-h-[60px] p-1 relative">
              <div className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
                isToday ? 'bg-green-600 text-white' : 'text-gray-700'
              }`}>
                {day}
              </div>
              <div className="space-y-0.5">
                {dayEvents.slice(0, 2).map(ev => {
                  const style = EVENT_TYPE_STYLES[ev.event_type] || { dot: 'bg-gray-400', label: ev.event_type };
                  return (
                    <div key={ev.id} className="flex items-center gap-1 truncate" title={ev.title}>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${style.dot}`} />
                      <span className="text-xs text-gray-700 truncate leading-tight">{ev.title}</span>
                    </div>
                  );
                })}
                {dayEvents.length > 2 && (
                  <div className="text-xs text-gray-400">+{dayEvents.length - 2} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function MemberEventsView() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('list'); // 'list' | 'calendar'
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [filter, setFilter] = useState('');

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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  };

  // Split events into upcoming and past
  const now = new Date();
  const upcoming = events.filter(e => new Date(e.event_date) >= now);
  const past = events.filter(e => new Date(e.event_date) < now);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Community Events</h2>
          <p className="text-sm text-gray-500 mt-1">Stay informed about upcoming meetings and activities</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1.5 text-sm font-medium transition ${view === 'list' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              ☰ List
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`px-3 py-1.5 text-sm font-medium transition ${view === 'calendar' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              📅 Calendar
            </button>
          </div>

          {/* Type filter */}
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
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded text-sm">{error}</div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading events...</div>
      ) : view === 'calendar' ? (
        /* ── Calendar View ── */
        <div className="bg-white border border-gray-200 rounded-lg shadow p-4">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-2 rounded hover:bg-gray-100 transition text-gray-600">‹</button>
            <h3 className="text-lg font-semibold text-gray-900">{MONTH_NAMES[calMonth]} {calYear}</h3>
            <button onClick={nextMonth} className="p-2 rounded hover:bg-gray-100 transition text-gray-600">›</button>
          </div>

          <CalendarGrid events={events} year={calYear} month={calMonth} />

          {/* Legend */}
          <div className="flex gap-4 mt-4 pt-3 border-t border-gray-100">
            {Object.entries(EVENT_TYPE_STYLES).map(([type, style]) => (
              <div key={type} className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                {style.label}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ── List View ── */
        <div className="space-y-6">
          {/* Upcoming */}
          <div>
            <h3 className="text-base font-semibold text-gray-700 mb-3">
              📌 Upcoming ({upcoming.length})
            </h3>
            {upcoming.length === 0 ? (
              <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg p-6 text-center text-sm text-gray-500">
                No upcoming events at the moment. Check back soon!
              </div>
            ) : (
              <div className="space-y-3">
                {upcoming.map(event => <EventCard key={event.id} event={event} />)}
              </div>
            )}
          </div>

          {/* Past */}
          {past.length > 0 && (
            <div>
              <h3 className="text-base font-semibold text-gray-400 mb-3">Past Events ({past.length})</h3>
              <div className="space-y-3 opacity-60">
                {past.map(event => <EventCard key={event.id} event={event} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EventCard({ event }) {
  const style = EVENT_TYPE_STYLES[event.event_type] || { label: event.event_type || 'Event', badge: 'bg-gray-100 text-gray-700' };
  const eventDate = new Date(event.event_date);
  const isPast = eventDate < new Date();

  return (
    <div className={`bg-white border rounded-lg p-4 shadow-sm flex gap-4 ${isPast ? 'border-gray-200' : 'border-green-200'}`}>
      {/* Date block */}
      <div className={`flex-shrink-0 w-14 text-center rounded-lg p-2 ${isPast ? 'bg-gray-100' : 'bg-green-50'}`}>
        <div className={`text-xs font-bold uppercase ${isPast ? 'text-gray-500' : 'text-green-700'}`}>
          {eventDate.toLocaleDateString('en-KE', { month: 'short' })}
        </div>
        <div className={`text-2xl font-bold leading-none ${isPast ? 'text-gray-600' : 'text-green-800'}`}>
          {eventDate.getDate()}
        </div>
        <div className={`text-xs ${isPast ? 'text-gray-400' : 'text-green-600'}`}>
          {eventDate.getFullYear()}
        </div>
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-gray-900 truncate">{event.title}</h4>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${style.badge}`}>
            {style.label}
          </span>
        </div>
        <div className="mt-1 space-y-0.5">
          <p className="text-sm text-gray-500">
            🕐 {eventDate.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
            {event.location && <span className="ml-3">📍 {event.location}</span>}
          </p>
          {event.description && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{event.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}