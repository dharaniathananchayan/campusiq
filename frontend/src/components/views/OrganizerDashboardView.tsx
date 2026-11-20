import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  Bell,
  Plus,
  LayoutDashboard,
  CalendarDays,
  Users,
  Sparkles,
  Bot,
  TrendingUp,
  Download,
  ChevronDown,
  Star,
  Mail,
  Send,
  Zap,
  LogOut,
  BarChart3,
  Clock,
  MapPin,
  Activity,
  CheckCircle2,
  Layers,
  ArrowRight,
  GraduationCap,
  User,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../../store/useAuthStore';
import { OrganizerMyEventsView } from './OrganizerMyEventsView';
import { OrganizerCreateEventView } from './OrganizerCreateEventView';
import { OrganizerAnalyticsView } from './OrganizerAnalyticsView';
import { OrganizerSmartInvitesView } from './OrganizerSmartInvitesView';
import { OrganizerProfileView } from './OrganizerProfileView';
import { OrganizerNotificationsView } from './OrganizerNotificationsView';
import { DiscussionsView } from './DiscussionsView';
import { AppSidebar } from '../layout/AppSidebar';
import { NotificationPopover } from '../notifications/NotificationPopover';
import { GlobalSearchBar } from '../search/GlobalSearchBar';

interface OrganizerDashboardViewProps {
  onSwitchToStudent?: () => void;
  onCreateEvent?: () => void;
  onOpenCopilot?: () => void;
}

export const OrganizerDashboardView: React.FC<OrganizerDashboardViewProps> = ({
  onSwitchToStudent,
  onCreateEvent,
  onOpenCopilot,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState('Overview');

  const handleSignOut = () => {
    logout();
    toast.success('Signed out successfully');
    navigate('/login', { replace: true });
  };

  // Hourly registration bar heights for the 9 AM - 6 PM chart
  const hourlyBars = [
    { hour: '9 AM', count: 4, isPeak: false },
    { hour: '10 AM', count: 7, isPeak: false },
    { hour: '11 AM', count: 6, isPeak: false },
    { hour: '12 PM', count: 12, isPeak: false },
    { hour: '1 PM', count: 10, isPeak: false },
    { hour: '2 PM', count: 18, isPeak: false },
    { hour: '3 PM', count: 24, isPeak: false },
    { hour: '4 PM', count: 19, isPeak: false },
    { hour: '5 PM', count: 28, isPeak: true },
    { hour: '6 PM', count: 32, isPeak: true },
  ];

  const handleExport = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,Metric,Value\nTotal Attendees,1284\nAvg Rating,4.7\nActive Events,6\nInvite Accepts,68%';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'campusiq_cross_event_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Exported cross-event analytics CSV');
  };

  return (
    <div className="portal font-sans antialiased">
      {/* 1. Unified 2nd Sidebar Design */}
      <AppSidebar forcedRole="organizer" />

      {/* 2. Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#f7f5ed] overflow-y-auto min-h-screen">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-[#113326] text-white px-5 lg:px-8 py-3 border-b border-[#1b4333] shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#d8fa57]">Organizer Workspace</span>
            <span className="text-[#3b5e4f]">•</span>
            <span className="text-xs text-[#a6c1b3] font-medium truncate max-w-xs">
              {(user as any)?.organization_name || user?.full_name || 'CodeCell Society'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Global Omni-Search Bar */}
            <GlobalSearchBar
              className="w-52 sm:w-72 lg:w-84"
              variant="dark"
              placeholder="Search events, organizers, students..."
              onSelectEvent={(eventId) => navigate(`/events/${eventId}`)}
            />

            {/* Notification Popover Panel */}
            <NotificationPopover role="organizer" variant="dark" />

            {/* + New Event Button */}
            <button
              onClick={() => (onCreateEvent ? onCreateEvent() : navigate('/organizer/events/new'))}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#e65c36] hover:bg-[#d8522d] text-white rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New event</span>
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-5 lg:p-8 space-y-6 overflow-y-auto">
          {location.pathname === '/organizer/events/new' ? (
            <OrganizerCreateEventView />
          ) : location.pathname === '/organizer/events' ? (
            <OrganizerMyEventsView />
          ) : location.pathname === '/organizer/analytics' ? (
            <OrganizerAnalyticsView />
          ) : location.pathname === '/organizer/invites' ? (
            <OrganizerSmartInvitesView />
          ) : location.pathname === '/organizer/discussions' ? (
            <DiscussionsView role="organizer" />
          ) : location.pathname === '/organizer/notifications' ? (
            <OrganizerNotificationsView />
          ) : location.pathname === '/organizer/profile' ? (
            <OrganizerProfileView />
          ) : (
            <>
              {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-[#dedbd4]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold tracking-widest text-[#e65c36] uppercase">
                  — OVERALL CROSS-EVENT ANALYTICS
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#113326] text-[#d8fa57] uppercase tracking-wider">
                  Campus-Wide Portfolio
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#11241c] mt-1">
                Executive Overview & Cross-Event Analytics
              </h1>
              <p className="text-xs sm:text-sm text-[#526359] mt-1 max-w-2xl">
                Aggregate campus performance across all 6 active events, 1,284 total attendees, and 4,200 profiled students. For single session diagnostics, switch to Individual Event Analytics.
              </p>
            </div>

            {/* Controls Right */}
            <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
              <button
                onClick={() => navigate('/organizer/analytics')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-[#113326] hover:bg-[#1a4433] text-white rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <BarChart3 className="w-3.5 h-3.5 text-[#d8fa57]" />
                <span>Individual Event Analytics →</span>
              </button>

              <button
                onClick={() => toast('Period: Current academic semester')}
                className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium bg-white text-[#2a3831] border border-[#d8d3c5] rounded-lg shadow-xs hover:bg-[#fbf9f4] transition-colors cursor-pointer"
              >
                <CalendarDays className="w-3.5 h-3.5 text-[#526359]" />
                <span>This semester</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#73877b]" />
              </button>

              <button
                onClick={handleExport}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-white text-[#2a3831] border border-[#d8d3c5] rounded-lg shadow-xs hover:bg-[#fbf9f4] transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#526359]" />
                <span>Export Report</span>
              </button>
            </div>
          </div>

          {/* 4 Performance Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Total Attendees */}
            <div className="bg-white rounded-xl p-4 border border-[#e8e4d8] shadow-xs space-y-2">
              <div className="w-7 h-7 rounded-lg bg-[#f5f3ec] text-[#526359] flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#63796d] block">
                  TOTAL ATTENDEES
                </span>
                <span className="text-2xl font-extrabold text-[#11241c] font-mono block mt-0.5">
                  1,284
                </span>
                <span className="text-[11px] font-semibold text-[#1c6b45] mt-0.5 block">
                  +18% vs last term
                </span>
              </div>
            </div>

            {/* 2. Avg. Rating */}
            <div className="bg-white rounded-xl p-4 border border-[#e8e4d8] shadow-xs space-y-2">
              <div className="w-7 h-7 rounded-lg bg-[#f5f3ec] text-[#526359] flex items-center justify-center">
                <Star className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#63796d] block">
                  AVG. RATING
                </span>
                <span className="text-2xl font-extrabold text-[#11241c] font-mono block mt-0.5">
                  4.7 / 5
                </span>
                <span className="text-[11px] font-semibold text-[#1c6b45] mt-0.5 block">
                  312 reviews analysed
                </span>
              </div>
            </div>

            {/* 3. Active Events */}
            <div className="bg-white rounded-xl p-4 border border-[#e8e4d8] shadow-xs space-y-2">
              <div className="w-7 h-7 rounded-lg bg-[#f5f3ec] text-[#526359] flex items-center justify-center">
                <CalendarDays className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#63796d] block">
                  ACTIVE EVENTS
                </span>
                <span className="text-2xl font-extrabold text-[#11241c] font-mono block mt-0.5">
                  6 live
                </span>
                <span className="text-[11px] font-semibold text-[#1c6b45] mt-0.5 block">
                  2 drafts need review
                </span>
              </div>
            </div>

            {/* 4. Invite Accepts */}
            <div className="bg-white rounded-xl p-4 border border-[#e8e4d8] shadow-xs space-y-2">
              <div className="w-7 h-7 rounded-lg bg-[#f5f3ec] text-[#526359] flex items-center justify-center">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#63796d] block">
                  INVITE ACCEPTS
                </span>
                <span className="text-2xl font-extrabold text-[#11241c] font-mono block mt-0.5">
                  68%
                </span>
                <span className="text-[11px] font-semibold text-[#1c6b45] mt-0.5 block">
                  Top 10% on campus
                </span>
              </div>
            </div>
          </div>

          {/* Main 12-Column Responsive Dashboard Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT 7 COLUMNS: Live Portfolio Capacity & Velocity Influx */}
            <div className="lg:col-span-7 space-y-6">
              {/* Card 1: Live Portfolio Capacity & Multi-Event Fill Rate */}
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#dedbd4] shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-base text-[#11241c] tracking-tight">
                        Live Portfolio Capacity & Seat Allocation
                      </h3>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#eaf6ed] text-[#1c6b45] uppercase flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1c6b45] animate-pulse" />
                        Live Roster
                      </span>
                    </div>
                    <p className="text-xs text-[#526359] mt-0.5">
                      Real-time attendee registrations tracked across all 4 published sessions
                    </p>
                  </div>

                  <button
                    onClick={() => navigate('/organizer/analytics')}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#e65c36] hover:underline cursor-pointer shrink-0"
                  >
                    <span>View all analytics</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Aggregate Summary Box */}
                <div className="p-4 bg-[#fbf9f4] rounded-xl border border-[#e8e4d8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#63796d] block">
                      TOTAL PORTFOLIO SEATS OCCUPIED
                    </span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-3xl font-extrabold text-[#11241c] font-mono">810</span>
                      <span className="text-xs text-[#526359]">/ 990 total campus capacity</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <div className="text-right">
                      <span className="text-xl font-black text-[#1c6b45] font-mono block">81.8%</span>
                      <span className="text-[10px] text-[#63796d]">Booked</span>
                    </div>
                    <div className="w-px h-8 bg-slate-300" />
                    <div>
                      <span className="text-xl font-black text-[#e65c36] font-mono block">180</span>
                      <span className="text-[10px] text-[#63796d]">Remaining</span>
                    </div>
                  </div>
                </div>

                {/* Multi-Event Breakdown Cards */}
                <div className="space-y-3 pt-1">
                  {[
                    {
                      id: 'ev-live-1',
                      name: 'HackNight: Build & Ship in 12 Hours',
                      category: 'Engineering & Tech',
                      venue: 'Founders Hub · Lab 104',
                      date: 'Nov 15 · 10:00 AM',
                      registered: 184,
                      cap: 220,
                      pct: 84,
                      color: 'bg-[#113326]',
                      statusBadge: '84% Booked',
                      statusColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                    },
                    {
                      id: 'ev-live-2',
                      name: 'University AI Symposium: Frontiers in Generative Architecture',
                      category: 'Science & Research',
                      venue: 'Turing Grand Auditorium',
                      date: 'Nov 20 · 09:00 AM',
                      registered: 312,
                      cap: 350,
                      pct: 89,
                      color: 'bg-emerald-600',
                      statusBadge: '89% Booked',
                      statusColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                    },
                    {
                      id: 'ev-live-3',
                      name: 'Venture Sprint: Campus Startup Pitch & Investor Showcase',
                      category: 'Leadership & Business',
                      venue: 'Executive Colloquium',
                      date: 'Nov 25 · 02:30 PM',
                      registered: 114,
                      cap: 120,
                      pct: 95,
                      color: 'bg-[#e65c36]',
                      statusBadge: '6 Spots Left',
                      statusColor: 'bg-amber-50 text-amber-800 border-amber-200',
                    },
                    {
                      id: 'ev-live-4',
                      name: 'HackCampus 2026: 36-Hour National Collegiate Hackathon',
                      category: 'Engineering & Tech',
                      venue: 'Maxwell Complex',
                      date: 'Dec 05 · 06:00 PM',
                      registered: 300,
                      cap: 300,
                      pct: 100,
                      color: 'bg-indigo-600',
                      statusBadge: 'Sold Out',
                      statusColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
                    },
                  ].map((ev) => (
                    <div
                      key={ev.id}
                      className="p-3.5 bg-white rounded-xl border border-[#eeebe2] hover:border-[#113326]/40 hover:bg-[#fbf9f4] transition-all space-y-2.5 group"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-[#f7f5ed] px-2 py-0.5 rounded">
                              {ev.category}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded border ${ev.statusColor}`}
                            >
                              {ev.statusBadge}
                            </span>
                          </div>
                          <h4
                            onClick={() => navigate(`/events/${ev.id}`)}
                            className="font-bold text-sm text-[#11241c] hover:text-[#e65c36] transition-colors cursor-pointer truncate mt-1"
                          >
                            {ev.name}
                          </h4>
                          <div className="flex items-center gap-3 text-[11px] text-[#526359] mt-0.5">
                            <span className="flex items-center gap-1">
                              <CalendarDays className="w-3 h-3 text-slate-400" />
                              {ev.date}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {ev.venue}
                            </span>
                          </div>
                        </div>

                        {/* Quick action buttons */}
                        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                          <button
                            onClick={() =>
                              navigate('/organizer/invites', { state: { selectedEventId: ev.id } })
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#d8fa57]/40 hover:bg-[#d8fa57]/70 text-[#113326] border border-[#b2d936] rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
                            title="Send Smart Invites for this event"
                          >
                            <Sparkles className="w-3 h-3 text-[#113326]" />
                            <span>Invites</span>
                          </button>

                          <button
                            onClick={() =>
                              navigate('/organizer/analytics', { state: { selectedEventId: ev.id } })
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-[#19231e] border border-[#d8d3c5] rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
                            title="Inspect individual diagnostics"
                          >
                            <BarChart3 className="w-3 h-3 text-slate-600" />
                            <span>Inspect →</span>
                          </button>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1">
                        <div className="w-full h-2.5 bg-[#e5e1d4] rounded-full overflow-hidden">
                          <div
                            className={`h-full ${ev.color} rounded-full transition-all`}
                            style={{ width: `${ev.pct}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-mono text-[#526359]">
                          <span>
                            {ev.registered} registered / {ev.cap} seats
                          </span>
                          <span className="font-semibold text-slate-700">
                            {ev.cap - ev.registered === 0
                              ? 'Waitlist open'
                              : `${ev.cap - ev.registered} seats left`}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer Stats Strip */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#f0ede4]">
                  <div className="p-3 bg-[#fbf9f4] rounded-xl border border-[#e8e4d8] text-center">
                    <span className="text-[10px] text-[#63796d] block font-bold uppercase tracking-wider">
                      TOTAL BOOKED
                    </span>
                    <span className="text-base font-extrabold text-[#11241c] block mt-0.5 font-mono">
                      810 Students
                    </span>
                  </div>
                  <div className="p-3 bg-[#fbf9f4] rounded-xl border border-[#e8e4d8] text-center">
                    <span className="text-[10px] text-[#63796d] block font-bold uppercase tracking-wider">
                      REMAINING SEATS
                    </span>
                    <span className="text-base font-extrabold text-[#1c6b45] block mt-0.5 font-mono">
                      180 Seats
                    </span>
                  </div>
                  <div className="p-3 bg-[#fbf9f4] rounded-xl border border-[#e8e4d8] text-center">
                    <span className="text-[10px] text-[#63796d] block font-bold uppercase tracking-wider">
                      WAITLIST DEMAND
                    </span>
                    <span className="text-base font-extrabold text-[#e65c36] block mt-0.5 font-mono">
                      84 Students
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Cross-Event Registration Velocity & Hourly Flow */}
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#dedbd4] shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-[#11241c]">
                      Cross-Event Registration Velocity (9 AM – 6 PM)
                    </h3>
                    <p className="text-xs text-[#526359]">
                      Hourly signup volume across all published events
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[#1c6b45] bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-mono">
                    +32% Peak Surge
                  </span>
                </div>

                {/* Hourly Bar Chart */}
                <div className="pt-2">
                  <div className="h-28 flex items-end justify-between gap-1.5 px-2">
                    {hourlyBars.map((bar, idx) => (
                      <div
                        key={idx}
                        className="flex-1 flex flex-col items-center gap-1 group relative cursor-pointer"
                      >
                        <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-[#113326] text-white text-[9px] px-1.5 py-0.5 rounded pointer-events-none whitespace-nowrap z-10 shadow-xs">
                          {bar.hour}: {bar.count} signups
                        </div>
                        <div
                          className={`w-full rounded-t transition-all ${
                            bar.isPeak ? 'bg-[#e65c36]' : 'bg-[#295945] hover:bg-[#1b4333]'
                          }`}
                          style={{ height: `${(bar.count / 32) * 95}px` }}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-[#73877b] pt-2 px-1 font-mono border-t border-slate-100 mt-1">
                    <span>9 AM (Opening)</span>
                    <span className="text-[11px] font-sans text-[#526359] font-medium">
                      Aggregate signups per hour
                    </span>
                    <span>6 PM (Peak Rush)</span>
                  </div>
                </div>

                {/* Influx Statistics */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#f0ede4]">
                  <div className="p-2.5 bg-[#fbf9f4] rounded-lg border border-[#e8e4d8] text-center">
                    <span className="text-[10px] text-[#63796d] block font-medium">Peak Hour</span>
                    <span className="text-xs font-bold text-[#11241c] block mt-0.5">6 PM · 32/hr</span>
                  </div>
                  <div className="p-2.5 bg-[#fbf9f4] rounded-lg border border-[#e8e4d8] text-center">
                    <span className="text-[10px] text-[#63796d] block font-medium">Capacity Occupancy</span>
                    <span className="text-xs font-bold text-[#11241c] block mt-0.5">81.8%</span>
                  </div>
                  <div className="p-2.5 bg-[#fbf9f4] rounded-lg border border-[#e8e4d8] text-center">
                    <span className="text-[10px] text-[#63796d] block font-medium">Drop-off Rate</span>
                    <span className="text-xs font-bold text-[#11241c] block mt-0.5">7.8%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT 5 COLUMNS: Demographics, Upcoming Timeline & Quick Workflow Shortcuts */}
            <div className="lg:col-span-5 space-y-6">
              {/* Card 1: Campus Demographics & Cohort Representation */}
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#dedbd4] shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm text-[#11241c] tracking-tight">
                      Campus Cohort & Demographic Reach
                    </h3>
                    <p className="text-xs text-[#526359]">
                      Distribution across 4,200 profiled students
                    </p>
                  </div>
                  <span className="text-[10px] font-bold bg-[#f7f5ed] text-slate-700 px-2 py-0.5 rounded border border-[#dedbd4]">
                    12 Departments
                  </span>
                </div>

                {/* Department Distribution Bars */}
                <div className="space-y-3 pt-1">
                  {[
                    { dept: 'Computer Science & Engineering', pct: 42, count: '539 students', color: 'bg-[#113326]' },
                    { dept: 'Electrical & Electronics', pct: 27, count: '347 students', color: 'bg-[#e65c36]' },
                    { dept: 'Design & Media Arts', pct: 18, count: '231 students', color: 'bg-[#eab308]' },
                    { dept: 'Management & Allied Sciences', pct: 13, count: '167 students', color: 'bg-emerald-600' },
                  ].map((d, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                        <span>{d.dept}</span>
                        <span className="font-mono text-[#526359]">{d.pct}% ({d.count})</span>
                      </div>
                      <div className="w-full h-2 bg-[#e5e1d4] rounded-full overflow-hidden">
                        <div className={`h-full ${d.color} rounded-full`} style={{ width: `${d.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Academic Year Representation Pills */}
                <div className="pt-3 border-t border-[#f0ede4] space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#63796d] block">
                    ACADEMIC YEAR DISTRIBUTION
                  </span>
                  <div className="grid grid-cols-4 gap-1.5 text-center">
                    <div className="p-2 bg-[#fbf9f4] rounded-lg border border-[#eeebe2]">
                      <span className="text-[10px] text-[#63796d] block">1st Year</span>
                      <span className="text-xs font-bold text-[#11241c] font-mono">18%</span>
                    </div>
                    <div className="p-2 bg-[#fbf9f4] rounded-lg border border-[#eeebe2]">
                      <span className="text-[10px] text-[#63796d] block">2nd Year</span>
                      <span className="text-xs font-bold text-[#11241c] font-mono">34%</span>
                    </div>
                    <div className="p-2 bg-[#fbf9f4] rounded-lg border border-[#eeebe2]">
                      <span className="text-[10px] text-[#63796d] block">3rd Year</span>
                      <span className="text-xs font-bold text-[#11241c] font-mono">32%</span>
                    </div>
                    <div className="p-2 bg-[#fbf9f4] rounded-lg border border-[#eeebe2]">
                      <span className="text-[10px] text-[#63796d] block">4th / PG</span>
                      <span className="text-xs font-bold text-[#11241c] font-mono">16%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Upcoming Operational Milestones */}
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#dedbd4] shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#e65c36]" />
                    <h3 className="font-extrabold text-sm text-[#11241c] tracking-tight">
                      Upcoming Operational Milestones
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-[#1c6b45] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Next 14 Days
                  </span>
                </div>

                {/* Timeline items */}
                <div className="space-y-3">
                  {[
                    {
                      date: 'Nov 15 · 10:00 AM',
                      title: 'HackNight Doors & Badges',
                      venue: 'Founders Innovation Hub · Lab 104',
                      badge: 'Hardware Sprint',
                      color: 'border-l-4 border-l-[#113326]',
                    },
                    {
                      date: 'Nov 18 · 04:00 PM',
                      title: 'AI Symposium Stage A/V Check',
                      venue: 'Turing Grand Auditorium',
                      badge: 'Keynote Setup',
                      color: 'border-l-4 border-l-emerald-600',
                    },
                    {
                      date: 'Nov 20 · 09:00 AM',
                      title: 'AI Symposium Registration Opens',
                      venue: 'Turing Grand Auditorium',
                      badge: '312 Attendees',
                      color: 'border-l-4 border-l-[#e65c36]',
                    },
                    {
                      date: 'Nov 25 · 02:30 PM',
                      title: 'Venture Sprint Investor Desk',
                      venue: 'Executive Colloquium Room',
                      badge: '12 Startups',
                      color: 'border-l-4 border-l-indigo-600',
                    },
                  ].map((m, idx) => (
                    <div
                      key={idx}
                      className={`p-3 bg-[#fbf9f4] rounded-xl border border-[#eeebe2] ${m.color} space-y-1 hover:border-slate-400 transition-colors`}
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-[#11241c] font-mono">{m.date}</span>
                        <span className="text-[10px] font-semibold text-[#526359] bg-white px-2 py-0.5 rounded border border-[#dedbd4]">
                          {m.badge}
                        </span>
                      </div>
                      <h5 className="font-bold text-xs text-slate-900">{m.title}</h5>
                      <span className="text-[11px] text-[#526359] block">{m.venue}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => navigate('/organizer/events')}
                  className="w-full py-2 px-3 text-xs font-bold text-[#113326] bg-[#f7f5ed] hover:bg-[#ede9dc] border border-[#d8d3c5] rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Manage complete schedule in My Events</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Card 3: Quick Action Launchpad */}
              <div className="bg-gradient-to-br from-[#113326] to-[#184634] text-white rounded-2xl p-5 border border-[#23533e] shadow-md space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#d8fa57]" />
                  <h3 className="font-extrabold text-sm text-white tracking-tight">
                    Organizer Operations Launchpad
                  </h3>
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    onClick={() => navigate('/organizer/invites')}
                    className="w-full p-2.5 bg-[#163e2e] hover:bg-[#1d4c38] border border-[#26533f] hover:border-[#d8fa57]/40 rounded-xl text-left transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <span className="text-xs font-bold text-white block group-hover:text-[#d8fa57] transition-colors">
                        AI Smart Invites Module
                      </span>
                      <span className="text-[10px] text-[#a6c1b3]">
                        Target distinct matches across 4,200 students
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#d8fa57] group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button
                    onClick={() => navigate('/organizer/analytics')}
                    className="w-full p-2.5 bg-[#163e2e] hover:bg-[#1d4c38] border border-[#26533f] hover:border-[#d8fa57]/40 rounded-xl text-left transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <span className="text-xs font-bold text-white block group-hover:text-[#d8fa57] transition-colors">
                        Individual Event Diagnostics
                      </span>
                      <span className="text-[10px] text-[#a6c1b3]">
                        Examine registration volume, velocity and ratings
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#d8fa57] group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button
                    onClick={() => navigate('/organizer/events/new')}
                    className="w-full p-2.5 bg-[#163e2e] hover:bg-[#1d4c38] border border-[#26533f] hover:border-[#d8fa57]/40 rounded-xl text-left transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <span className="text-xs font-bold text-white block group-hover:text-[#d8fa57] transition-colors">
                        Create New Event
                      </span>
                      <span className="text-[10px] text-[#a6c1b3]">
                        Configure agenda, toggles & Drafting Agent
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#d8fa57] group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};
