import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  Download,
  Users,
  Star,
  Zap,
  Calendar,
  Sparkles,
  PieChart,
  ChevronDown,
  MapPin,
  Clock,
  Eye,
  Tag,
  Search,
  Building2,
  Filter,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { INITIAL_ORGANIZER_EVENTS, OrganizerEventItem } from './OrganizerMyEventsView';

// Individual Event Analytics Database
interface IndividualEventAnalytics {
  rating: string;
  reviewCount: number;
  sentimentPct: number;
  peakHour: string;
  hourlyRegistrations: { hour: string; count: number; isPeak?: boolean }[];
  departmentBreakdown: { dept: string; pct: number; color: string }[];
  yearBreakdown: { year: string; pct: number }[];
  feedbackHighlights: { student: string; quote: string; rating: number; tag: string }[];
}

const EVENT_ANALYTICS_DATA: Record<string, IndividualEventAnalytics> = {
  // 1. HackNight: Build & Ship
  'ev-live-1': {
    rating: '4.9 / 5.0',
    reviewCount: 142,
    sentimentPct: 98,
    peakHour: '5:00 PM – 6:00 PM (Launch Surge)',
    hourlyRegistrations: [
      { hour: '9 AM', count: 18 },
      { hour: '10 AM', count: 42 },
      { hour: '11 AM', count: 34 },
      { hour: '12 PM', count: 24 },
      { hour: '1 PM', count: 18 },
      { hour: '2 PM', count: 16 },
      { hour: '3 PM', count: 25 },
      { hour: '4 PM', count: 34 },
      { hour: '5 PM', count: 52, isPeak: true },
      { hour: '6 PM', count: 48 },
    ],
    departmentBreakdown: [
      { dept: 'Computer Science', pct: 54, color: 'bg-[#113326]' },
      { dept: 'Data Science & AI', pct: 24, color: 'bg-[#e65c36]' },
      { dept: 'Electrical Engineering', pct: 14, color: 'bg-emerald-600' },
      { dept: 'Mechanical & Other', pct: 8, color: 'bg-amber-500' },
    ],
    yearBreakdown: [
      { year: '1st Year', pct: 15 },
      { year: '2nd Year', pct: 38 },
      { year: '3rd Year', pct: 35 },
      { year: '4th Year / Postgrad', pct: 12 },
    ],
    feedbackHighlights: [
      { student: 'Arjun Mehta', quote: 'Mentor office hours at midnight were incredible. Cloud GPUs worked smoothly with no setup friction.', rating: 5, tag: 'Mentorship' },
      { student: 'Priya Nair', quote: 'Great pizza, generous compute vouchers, and the team formation session helped me find 2 teammates!', rating: 5, tag: 'Networking' },
      { student: 'Devin Cole', quote: 'Wi-Fi was rock solid in Lab 104. Loved the hardware kits provided by sponsors.', rating: 4.8, tag: 'Infrastructure' },
    ],
  },

  // 2. University AI Symposium
  'ev-live-2': {
    rating: '4.8 / 5.0',
    reviewCount: 215,
    sentimentPct: 96,
    peakHour: '11:00 AM – 12:00 PM (Opening Announcements)',
    hourlyRegistrations: [
      { hour: '8 AM', count: 25 },
      { hour: '9 AM', count: 58 },
      { hour: '10 AM', count: 65 },
      { hour: '11 AM', count: 82, isPeak: true },
      { hour: '12 PM', count: 42 },
      { hour: '1 PM', count: 16 },
      { hour: '2 PM', count: 15 },
      { hour: '3 PM', count: 14 },
      { hour: '4 PM', count: 13 },
      { hour: '5 PM', count: 12 },
    ],
    departmentBreakdown: [
      { dept: 'Artificial Intelligence', pct: 45, color: 'bg-[#113326]' },
      { dept: 'Computer Science', pct: 32, color: 'bg-[#e65c36]' },
      { dept: 'Biomedical & Life Sci', pct: 15, color: 'bg-emerald-600' },
      { dept: 'Business & Finance', pct: 8, color: 'bg-amber-500' },
    ],
    yearBreakdown: [
      { year: '1st Year', pct: 10 },
      { year: '2nd Year', pct: 25 },
      { year: '3rd Year', pct: 40 },
      { year: '4th Year / Postgrad', pct: 25 },
    ],
    feedbackHighlights: [
      { student: 'Kavita Patel', quote: 'The keynote on distributed agentic architectures was eye-opening. Best academic symposium this year.', rating: 5, tag: 'Keynote' },
      { student: 'Marcus Vance', quote: 'Excellent panel discussions and high-value research poster presentations in the Turing Atrium.', rating: 4.9, tag: 'Research' },
    ],
  },

  // 3. Venture Sprint: Campus Startup Pitch
  'ev-live-3': {
    rating: '4.7 / 5.0',
    reviewCount: 88,
    sentimentPct: 94,
    peakHour: '3:00 PM – 4:00 PM (Cohort Release)',
    hourlyRegistrations: [
      { hour: '1 PM', count: 12 },
      { hour: '2 PM', count: 32 },
      { hour: '3 PM', count: 44, isPeak: true },
      { hour: '4 PM', count: 26 },
      { hour: '5 PM', count: 13 },
      { hour: '6 PM', count: 7 },
    ],
    departmentBreakdown: [
      { dept: 'School of Management', pct: 48, color: 'bg-[#113326]' },
      { dept: 'Computer Science', pct: 28, color: 'bg-[#e65c36]' },
      { dept: 'Economics & Finance', pct: 16, color: 'bg-emerald-600' },
      { dept: 'Other Programs', pct: 8, color: 'bg-amber-500' },
    ],
    yearBreakdown: [
      { year: '1st Year', pct: 8 },
      { year: '2nd Year', pct: 22 },
      { year: '3rd Year', pct: 42 },
      { year: '4th Year / Alumni', pct: 28 },
    ],
    feedbackHighlights: [
      { student: 'Tanya Bose', quote: 'Connecting directly with alumni angel investors led to 2 follow-up coffee chats for our seed pitch!', rating: 5, tag: 'Investor Access' },
    ],
  },
};

// Default fallback generator for any other event
const getFallbackEventAnalytics = (event: OrganizerEventItem): IndividualEventAnalytics => {
  const reg = event.currentRegistrations || 20;

  return {
    rating: '4.8 / 5.0',
    reviewCount: Math.round(reg * 0.75),
    sentimentPct: 95,
    peakHour: '2:00 PM – 3:00 PM (Campaign Launch)',
    hourlyRegistrations: [
      { hour: '9 AM', count: Math.round(reg * 0.12) },
      { hour: '10 AM', count: Math.round(reg * 0.18) },
      { hour: '11 AM', count: Math.round(reg * 0.22) },
      { hour: '12 PM', count: Math.round(reg * 0.15) },
      { hour: '1 PM', count: Math.round(reg * 0.10) },
      { hour: '2 PM', count: Math.round(reg * 0.35), isPeak: true },
      { hour: '3 PM', count: Math.round(reg * 0.25) },
      { hour: '4 PM', count: Math.round(reg * 0.15) },
    ],
    departmentBreakdown: [
      { dept: 'Primary Department', pct: 52, color: 'bg-[#113326]' },
      { dept: 'Secondary Department', pct: 28, color: 'bg-[#e65c36]' },
      { dept: 'Allied Majors', pct: 20, color: 'bg-emerald-600' },
    ],
    yearBreakdown: [
      { year: '1st Year', pct: 20 },
      { year: '2nd Year', pct: 35 },
      { year: '3rd Year', pct: 30 },
      { year: '4th Year', pct: 15 },
    ],
    feedbackHighlights: [
      { student: 'Campus Attendee', quote: `The session for ${event.title} ran on schedule and covered essential practical skills. Highly recommended!`, rating: 5, tag: 'Content' },
    ],
  };
};

export const OrganizerAnalyticsView: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Selected event ID: read from location.state if navigated from "Insights" or default to 'ev-live-1'
  const incomingEventId = (location.state as any)?.selectedEventId;
  const [selectedEventId, setSelectedEventId] = useState<string>(
    incomingEventId && INITIAL_ORGANIZER_EVENTS.some((e) => e.id === incomingEventId)
      ? incomingEventId
      : INITIAL_ORGANIZER_EVENTS[0]?.id || 'ev-live-1'
  );

  const [eventSearchQuery, setEventSearchQuery] = useState('');

  // Filter events for dropdown based on typed query
  const availableEvents = useMemo(() => {
    if (!eventSearchQuery.trim()) return INITIAL_ORGANIZER_EVENTS;
    const q = eventSearchQuery.toLowerCase();
    return INITIAL_ORGANIZER_EVENTS.filter(
      (ev) =>
        ev.title.toLowerCase().includes(q) ||
        ev.category.toLowerCase().includes(q) ||
        ev.venue.toLowerCase().includes(q) ||
        ev.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [eventSearchQuery]);

  // Selected Event Object
  const selectedEvent = useMemo(() => {
    return (
      INITIAL_ORGANIZER_EVENTS.find((e) => e.id === selectedEventId) ||
      INITIAL_ORGANIZER_EVENTS[0]
    );
  }, [selectedEventId]);

  // Analytics Data for the Selected Event
  const analytics = useMemo(() => {
    if (EVENT_ANALYTICS_DATA[selectedEvent.id]) {
      return EVENT_ANALYTICS_DATA[selectedEvent.id];
    }
    return getFallbackEventAnalytics(selectedEvent);
  }, [selectedEvent]);

  const fillPct = Math.min(
    100,
    Math.round((selectedEvent.currentRegistrations / Math.max(1, selectedEvent.maxCapacity)) * 100)
  );
  const remainingSeats = Math.max(0, selectedEvent.maxCapacity - selectedEvent.currentRegistrations);

  const handleExportIndividualCSV = () => {
    const csvContent =
      `data:text/csv;charset=utf-8,Individual Event Analytics Report\n` +
      `Event Title,"${selectedEvent.title}"\n` +
      `Category,"${selectedEvent.category}"\n` +
      `Venue,"${selectedEvent.venue}"\n` +
      `Total Registrations,${selectedEvent.currentRegistrations}\n` +
      `Max Capacity,${selectedEvent.maxCapacity}\n` +
      `Occupancy Rate,${fillPct}%\n` +
      `Average Rating,${analytics.rating}\n` +
      `Reviews Count,${analytics.reviewCount}\n` +
      `Positive Sentiment,${analytics.sentimentPct}%\n` +
      `Peak Registration Window,"${analytics.peakHour}"\n\n` +
      `Department Breakdown:\n` +
      analytics.departmentBreakdown.map((d) => `"${d.dept}",${d.pct}%`).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${selectedEvent.id}_performance_analytics.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported analytics report for "${selectedEvent.title}"!`);
  };

  return (
    <div className="space-y-6 text-left w-full font-sans max-w-7xl mx-auto">
      {/* 1. Header with Back Button and Quick Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#e3dfd3]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => navigate('/organizer/dashboard')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#e65c36] hover:underline cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Overall Overview</span>
            </button>
            <span className="text-slate-300">·</span>
            <button
              onClick={() => navigate('/organizer/events')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <span>My Events</span>
            </button>
            <span className="text-slate-300">·</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#113326] text-[#d8fa57] uppercase tracking-wider">
              INDIVIDUAL EVENT ANALYTICS
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#11241c] tracking-tight">
            Individual Event Performance & Diagnostics
          </h1>
          <p className="text-xs sm:text-sm text-[#526359]">
            Select and inspect individual event registrations, capacity status, registration velocity, and student ratings.
          </p>
        </div>

        {/* Action Controls Right */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={() => navigate(`/events/${selectedEvent.id}`)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-[#fbf9f3] text-[#19231e] border border-[#d8d3c5] rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Eye className="w-4 h-4 text-slate-600" />
            <span>View Event Page</span>
          </button>

          <button
            onClick={handleExportIndividualCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-[#113326] hover:bg-[#1a4433] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#d8fa57]" />
            <span>Export Event CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Event Selector: Type Bar and Dropdown Only */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#dedbd4] shadow-xs">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Type Bar (Event Search Input) */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={eventSearchQuery}
              onChange={(e) => {
                const query = e.target.value;
                setEventSearchQuery(query);
                if (query.trim()) {
                  const q = query.toLowerCase();
                  const matched = INITIAL_ORGANIZER_EVENTS.find(
                    (ev) =>
                      ev.title.toLowerCase().includes(q) ||
                      ev.category.toLowerCase().includes(q) ||
                      ev.tags.some((t) => t.toLowerCase().includes(q))
                  );
                  if (matched) {
                    setSelectedEventId(matched.id);
                  }
                }
              }}
              placeholder="Type to search event title, topic or category..."
              className="w-full pl-9 pr-4 py-2.5 bg-[#f7f5ed] border border-[#d8d3c5] rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#113326]/30 transition-all"
            />
          </div>

          {/* Dropdown of Events */}
          <div className="relative w-full sm:w-80 md:w-96 shrink-0">
            <select
              value={selectedEventId}
              onChange={(e) => {
                setSelectedEventId(e.target.value);
                const ev = INITIAL_ORGANIZER_EVENTS.find((x) => x.id === e.target.value);
                if (ev) {
                  toast(`Switched analytics to "${ev.title}"`);
                }
              }}
              className="appearance-none w-full px-3.5 py-2.5 bg-[#f7f5ed] border border-[#d8d3c5] rounded-xl text-xs font-bold text-slate-900 pr-9 focus:outline-none focus:ring-2 focus:ring-[#113326]/30 cursor-pointer shadow-xs truncate"
            >
              {availableEvents.length > 0 ? (
                availableEvents.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title} ({ev.status.toUpperCase()})
                  </option>
                ))
              ) : (
                INITIAL_ORGANIZER_EVENTS.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title} ({ev.status.toUpperCase()})
                  </option>
                ))
              )}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 3. Selected Individual Event Banner Card */}
      <div className="bg-gradient-to-br from-[#113326] to-[#184634] text-white rounded-2xl p-5 sm:p-6 border border-[#23533e] shadow-md space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#d8fa57] text-[#113326] uppercase tracking-wider">
                {selectedEvent.category}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#26533f] text-[#a6c1b3] uppercase tracking-wider">
                ● {selectedEvent.status.toUpperCase()} SESSION
              </span>
              <span className="text-xs text-[#8fa99c] font-medium">
                ID: {selectedEvent.id}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {selectedEvent.title}
            </h2>

            <div className="flex items-center gap-4 text-xs text-[#c4d6cb] flex-wrap">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#d8fa57]" />
                {selectedEvent.venue}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#d8fa57]" />
                {new Date(selectedEvent.startDatetime).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#d8fa57]" />
                {selectedEvent.currentRegistrations} / {selectedEvent.maxCapacity} Seats Booked ({fillPct}%)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-center">
            <button
              onClick={() => navigate('/organizer/invites', { state: { selectedEventId: selectedEvent.id } })}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#d8fa57] hover:bg-[#cbf046] text-[#113326] rounded-xl text-xs font-extrabold transition-all shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart Invites</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Event Performance KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Capacity Status */}
        <div className="bg-white p-4.5 rounded-2xl border border-[#dedbd4] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>Capacity Status</span>
            <Users className="w-4 h-4 text-[#113326]" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
              {selectedEvent.currentRegistrations}
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Out of {selectedEvent.maxCapacity} total hall capacity
            </p>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-1">
            <div
              className="bg-[#113326] h-full rounded-full"
              style={{
                width: `${fillPct}%`,
              }}
            />
          </div>
        </div>

        {/* Metric 2: Registration Occupancy */}
        <div className="bg-white p-4.5 rounded-2xl border border-[#dedbd4] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>Registration Occupancy</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
              {fillPct}%
            </div>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
              {remainingSeats === 0 ? 'Waitlist active · Sold Out' : `${remainingSeats} seats available`}
            </p>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>{selectedEvent.currentRegistrations} Confirmed</span>
            <span>Live Catalog</span>
          </div>
        </div>

        {/* Metric 3: Attendee Satisfaction */}
        <div className="bg-white p-4.5 rounded-2xl border border-[#dedbd4] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>Student Rating</span>
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
              {analytics.rating}
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              From {analytics.reviewCount} post-session surveys
            </p>
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold">
            {analytics.sentimentPct}% Positive sentiment
          </div>
        </div>

        {/* Metric 4: Peak Registration Window */}
        <div className="bg-white p-4.5 rounded-2xl border border-[#dedbd4] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>Peak Signup Window</span>
            <Sparkles className="w-4 h-4 text-[#e65c36]" />
          </div>
          <div>
            <div className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight truncate">
              {analytics.peakHour}
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Highest registration surge
            </p>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            Velocity recorded live
          </div>
        </div>
      </div>

      {/* 5. Visual Charts for THIS Event */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Hourly Registration Velocity Chart */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-[#dedbd4] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Hourly Registration Velocity for "{selectedEvent.title}"
              </h3>
              <p className="text-xs text-slate-500">
                Distribution of student signups and registration demand over time
              </p>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
              Peak: {analytics.peakHour}
            </span>
          </div>

          <div className="h-48 flex items-end justify-between gap-2 pt-6 px-2 border-b border-slate-100">
            {analytics.hourlyRegistrations.map((b) => {
              const maxCount = Math.max(...analytics.hourlyRegistrations.map((s) => s.count), 1);
              const hPct = (b.count / maxCount) * 100;
              return (
                <div key={b.hour} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <span className="text-[10px] font-mono text-slate-400 group-hover:text-slate-800 transition-colors">
                    {b.count}
                  </span>
                  <div
                    className={`w-full max-w-[32px] rounded-t-lg transition-all ${
                      b.isPeak
                        ? 'bg-[#e65c36] shadow-xs'
                        : 'bg-[#113326] opacity-80 group-hover:opacity-100'
                    }`}
                    style={{ height: `${hPct}%` }}
                  />
                  <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap mt-1">
                    {b.hour}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Department Breakdown for THIS Event */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-[#dedbd4] shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Department Representation</h3>
            <p className="text-xs text-slate-500">Academic major breakdown for this session</p>
          </div>

          <div className="space-y-3">
            {analytics.departmentBreakdown.map((cat) => (
              <div key={cat.dept} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">{cat.dept}</span>
                  <span className="font-mono font-bold text-slate-900">{cat.pct}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className={`h-full ${cat.color} rounded-full`} style={{ width: `${cat.pct}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-700 block mb-1">Year of Study Distribution:</span>
            <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-600 font-medium">
              {analytics.yearBreakdown.map((y) => (
                <div key={y.year} className="flex justify-between bg-slate-50 px-2 py-1 rounded">
                  <span>{y.year}</span>
                  <span className="font-bold text-slate-900">{y.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 6. Post-Session Student Feedback & Reviews */}
      <div className="bg-white rounded-2xl border border-[#dedbd4] p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">
              Student Feedback Highlights for "{selectedEvent.title}"
            </h3>
            <p className="text-xs text-slate-500">
              Verified attendee comments and satisfaction ratings collected post-event
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#fff7f4] text-[#e65c36] border border-[#e65c36]/20">
            ★ {analytics.rating} Average Rating
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {analytics.feedbackHighlights.map((fb, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-[#fbf9f4] border border-[#e8e4d8] space-y-2 flex flex-col justify-between">
              <p className="text-xs text-slate-700 leading-relaxed italic">
                "{fb.quote}"
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[11px]">
                <span className="font-bold text-slate-900">{fb.student}</span>
                <span className="px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200 text-[10px] font-semibold">
                  {fb.tag}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
