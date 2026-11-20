import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  Plus,
  BarChart3,
  Search,
  Users,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
  FileEdit,
  Archive,
  ArrowUpRight,
  Trash2,
  Copy,
  Tag,
  Radio,
  ExternalLink,
  Eye,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export interface OrganizerEventItem {
  id: string;
  title: string;
  category: string;
  status: 'published' | 'draft' | 'completed' | 'archived';
  startDatetime: string;
  endDatetime: string;
  venue: string;
  maxCapacity: number;
  currentRegistrations: number;
  registrationFee: number;
  shortDescription: string;
  tags: string[];
}

export const INITIAL_ORGANIZER_EVENTS: OrganizerEventItem[] = [
  // 1. Live View Events
  {
    id: 'ev-live-1',
    title: 'HackNight: Build & Ship in 12 Hours',
    category: 'Engineering & Tech',
    status: 'published',
    startDatetime: '2026-11-15T10:00:00Z',
    endDatetime: '2026-11-15T22:00:00Z',
    venue: 'Founders Innovation Hub · Lab 104',
    maxCapacity: 220,
    currentRegistrations: 184,
    registrationFee: 0,
    shortDescription: 'Overnight collegiate sprint with hardware kits, cloud credits, and sponsor mentors.',
    tags: ['Hackathon', 'AI', 'Coding', 'Open Source'],
  },
  {
    id: 'ev-live-2',
    title: 'University AI Symposium: Frontiers in Generative Architecture',
    category: 'Science & Research',
    status: 'published',
    startDatetime: '2026-11-20T09:00:00Z',
    endDatetime: '2026-11-20T17:00:00Z',
    venue: 'Turing Grand Auditorium',
    maxCapacity: 350,
    currentRegistrations: 312,
    registrationFee: 0,
    shortDescription: 'Annual flagship symposium on foundation models, AI safety, and agentic workflows.',
    tags: ['AI', 'Research', 'Keynote', 'Agentic Systems'],
  },
  {
    id: 'ev-live-3',
    title: 'Venture Sprint: Campus Startup Pitch & Investor Showcase',
    category: 'Leadership & Business',
    status: 'published',
    startDatetime: '2026-11-25T14:30:00Z',
    endDatetime: '2026-11-25T18:00:00Z',
    venue: 'Executive Colloquium Room',
    maxCapacity: 120,
    currentRegistrations: 114,
    registrationFee: 0,
    shortDescription: 'Student venture pitches before top alumni angels and venture capital partners.',
    tags: ['Venture Capital', 'Startups', 'Pitch'],
  },
  {
    id: 'ev-live-4',
    title: 'HackCampus 2026: 36-Hour National Collegiate Hackathon',
    category: 'Engineering & Tech',
    status: 'published',
    startDatetime: '2026-12-05T18:00:00Z',
    endDatetime: '2026-12-07T12:00:00Z',
    venue: 'Maxwell Science Complex',
    maxCapacity: 300,
    currentRegistrations: 300,
    registrationFee: 0,
    shortDescription: '36-hour hackathon with $25k in prizes, hardware lab access, and sponsor mentors.',
    tags: ['National Hackathon', 'Prizes', 'Team Building'],
  },

  // 2. Events that are in Draft
  {
    id: 'ev-draft-1',
    title: 'Zero to Hacker: CTF Weekend Lab & Security Workshop',
    category: 'Engineering & Tech',
    status: 'draft',
    startDatetime: '2026-12-12T14:00:00Z',
    endDatetime: '2026-12-12T19:00:00Z',
    venue: 'CSE Annex · Security Lab 4',
    maxCapacity: 120,
    currentRegistrations: 0,
    registrationFee: 99,
    shortDescription: 'Hands-on reverse engineering, web exploit walkthroughs, and jeopardy-style challenges.',
    tags: ['Cybersecurity', 'CTF', 'Ethical Hacking'],
  },
  {
    id: 'ev-draft-2',
    title: 'NextGen Cloud & Kubernetes Intensive Training',
    category: 'Engineering & Tech',
    status: 'draft',
    startDatetime: '2026-12-18T11:00:00Z',
    endDatetime: '2026-12-18T16:00:00Z',
    venue: 'Founders Innovation Hub',
    maxCapacity: 80,
    currentRegistrations: 0,
    registrationFee: 0,
    shortDescription: 'Deep dive into microservices orchestration, service meshes, and deployment pipelines.',
    tags: ['DevOps', 'Kubernetes', 'Cloud'],
  },
  {
    id: 'ev-draft-3',
    title: 'Women in STEM Leadership Roundtable & Mentorship Circle',
    category: 'Career & Networking',
    status: 'draft',
    startDatetime: '2026-12-22T15:00:00Z',
    endDatetime: '2026-12-22T18:00:00Z',
    venue: 'Executive Colloquium Room',
    maxCapacity: 90,
    currentRegistrations: 0,
    registrationFee: 0,
    shortDescription: 'Panel discussion with faculty, alumni executives, and peer mentors across engineering.',
    tags: ['Diversity', 'Mentorship', 'Leadership'],
  },

  // 3. Past Completed Events
  {
    id: 'ev-past-1',
    title: 'Spring 2026 Open Source HackFest',
    category: 'Engineering & Tech',
    status: 'completed',
    startDatetime: '2026-03-10T09:00:00Z',
    endDatetime: '2026-03-10T21:00:00Z',
    venue: 'Turing Grand Auditorium',
    maxCapacity: 250,
    currentRegistrations: 240,
    registrationFee: 0,
    shortDescription: 'Celebration of open source contributions with maintainers from Linux Foundation.',
    tags: ['Open Source', 'GitHub', 'Community'],
  },
  {
    id: 'ev-past-2',
    title: 'Algorithmic Trading & High-Frequency Systems Seminar',
    category: 'Leadership & Business',
    status: 'completed',
    startDatetime: '2026-04-14T16:00:00Z',
    endDatetime: '2026-04-14T19:00:00Z',
    venue: 'School of Management · Hall B',
    maxCapacity: 120,
    currentRegistrations: 110,
    registrationFee: 0,
    shortDescription: 'Technical breakdown of market microstructure, order books, and latency optimization.',
    tags: ['Quant', 'Finance', 'Algorithms'],
  },
  {
    id: 'ev-past-3',
    title: 'Monsoon Game Jam & Interactive Media Showcase',
    category: 'Arts & Culture',
    status: 'completed',
    startDatetime: '2026-05-02T10:00:00Z',
    endDatetime: '2026-05-03T18:00:00Z',
    venue: 'Fine Arts Pavilion · Main Stage',
    maxCapacity: 90,
    currentRegistrations: 85,
    registrationFee: 0,
    shortDescription: '48-hour game design festival featuring 18 student indie game demos and VR prototypes.',
    tags: ['GameDev', 'VR', 'Unity', 'Indie'],
  },

  // 4. Archived Events
  {
    id: 'ev-arch-1',
    title: 'Fall 2025 AI Hackathon Archive',
    category: 'Engineering & Tech',
    status: 'archived',
    startDatetime: '2025-10-12T10:00:00Z',
    endDatetime: '2025-10-12T22:00:00Z',
    venue: 'Maxwell Complex Room 215',
    maxCapacity: 200,
    currentRegistrations: 195,
    registrationFee: 0,
    shortDescription: 'Archived records, team project repositories, and judge scoring records for 2025.',
    tags: ['Archived', 'Hackathon 2025'],
  },
  {
    id: 'ev-arch-2',
    title: 'Web3 & Decentralized Ledger Summit 2025',
    category: 'Science & Research',
    status: 'archived',
    startDatetime: '2025-11-05T13:00:00Z',
    endDatetime: '2025-11-05T17:00:00Z',
    venue: 'Founders Innovation Hub',
    maxCapacity: 100,
    currentRegistrations: 98,
    registrationFee: 0,
    shortDescription: 'Historical symposium documentation and presentation slides on consensus mechanisms.',
    tags: ['Archived', 'Blockchain', 'Research'],
  },
];

export const OrganizerMyEventsView: React.FC = () => {
  const navigate = useNavigate();
  const [eventsList, setEventsList] = useState<OrganizerEventItem[]>(INITIAL_ORGANIZER_EVENTS);
  const [activeTab, setActiveTab] = useState<'all' | 'published' | 'draft' | 'completed' | 'archived'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Filter logic
  const filteredEvents = useMemo(() => {
    return eventsList.filter((item) => {
      // Tab filter
      if (activeTab !== 'all' && item.status !== activeTab) return false;

      // Category filter
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesDesc = item.shortDescription.toLowerCase().includes(q);
        const matchesVenue = item.venue.toLowerCase().includes(q);
        const matchesTags = item.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesVenue && !matchesTags) return false;
      }

      return true;
    });
  }, [eventsList, activeTab, categoryFilter, searchQuery]);

  // Counts
  const counts = useMemo(() => {
    return {
      all: eventsList.length,
      published: eventsList.filter((e) => e.status === 'published').length,
      draft: eventsList.filter((e) => e.status === 'draft').length,
      completed: eventsList.filter((e) => e.status === 'completed').length,
      archived: eventsList.filter((e) => e.status === 'archived').length,
    };
  }, [eventsList]);

  const handlePublishDraft = (id: string, title: string) => {
    setEventsList((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: 'published' } : e))
    );
    toast.success(`Published "${title}"! It is now live in the student discovery catalog.`);
  };

  const handleArchiveEvent = (id: string, title: string) => {
    setEventsList((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: 'archived' } : e))
    );
    toast(`Archived "${title}"`, { icon: '🗄️' });
  };

  const handleRestoreEvent = (id: string, title: string) => {
    setEventsList((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: 'draft' } : e))
    );
    toast.success(`Restored "${title}" to draft.`);
  };

  const handleDeleteEvent = (id: string, title: string) => {
    setEventsList((prev) => prev.filter((e) => e.id !== id));
    toast.success(`Deleted "${title}".`);
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 text-left w-full font-sans">
      {/* 1. Header Banner with Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#e3dfd3]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold tracking-widest text-[#e65c36] uppercase">
              — ORGANIZER STUDIO
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#113326] text-[#d8fa57] uppercase tracking-wider">
              {counts.all} Events Total
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#11241c] tracking-tight mt-1">
            My Events
          </h1>
          <p className="text-xs sm:text-sm text-[#526359] mt-1 max-w-2xl">
            Complete lifecycle management: track live registrations, finalize drafts with the Drafting Agent, review past completed events, and inspect archived records.
          </p>
        </div>

        {/* Buttons: View Analytics & Create Event */}
        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          <button
            onClick={() => navigate('/organizer/analytics')}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white hover:bg-[#fbf9f3] text-[#19231e] border border-[#d8d3c5] rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer group"
          >
            <BarChart3 className="w-4 h-4 text-[#e65c36] group-hover:scale-110 transition-transform" />
            <span>View Analytics</span>
          </button>

          <button
            onClick={() => navigate('/organizer/events/new')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#e65c36] hover:bg-[#d8522d] text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Event</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards for Fast Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div
          onClick={() => setActiveTab('published')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'published'
              ? 'bg-[#113326] text-white border-[#113326] shadow-sm'
              : 'bg-white text-slate-800 border-[#e3dfd3] hover:border-emerald-600/40 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-tight">Live View Events</span>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold mt-2 font-mono">{counts.published}</div>
          <p className={`text-[11px] mt-1 ${activeTab === 'published' ? 'text-[#c4d6cb]' : 'text-slate-500'}`}>
            Active in student catalog
          </p>
        </div>

        <div
          onClick={() => setActiveTab('draft')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'draft'
              ? 'bg-[#113326] text-white border-[#113326] shadow-sm'
              : 'bg-white text-slate-800 border-[#e3dfd3] hover:border-amber-600/40 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-tight">Events in Draft</span>
            <FileEdit className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold mt-2 font-mono">{counts.draft}</div>
          <p className={`text-[11px] mt-1 ${activeTab === 'draft' ? 'text-[#c4d6cb]' : 'text-slate-500'}`}>
            Awaiting agent review or launch
          </p>
        </div>

        <div
          onClick={() => setActiveTab('completed')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'completed'
              ? 'bg-[#113326] text-white border-[#113326] shadow-sm'
              : 'bg-white text-slate-800 border-[#e3dfd3] hover:border-blue-600/40 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-tight">Past Completed</span>
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold mt-2 font-mono">{counts.completed}</div>
          <p className={`text-[11px] mt-1 ${activeTab === 'completed' ? 'text-[#c4d6cb]' : 'text-slate-500'}`}>
            Concluded sessions with reports
          </p>
        </div>

        <div
          onClick={() => setActiveTab('archived')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'archived'
              ? 'bg-[#113326] text-white border-[#113326] shadow-sm'
              : 'bg-white text-slate-800 border-[#e3dfd3] hover:border-slate-400 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-tight">Archived Events</span>
            <Archive className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold mt-2 font-mono">{counts.archived}</div>
          <p className={`text-[11px] mt-1 ${activeTab === 'archived' ? 'text-[#c4d6cb]' : 'text-slate-500'}`}>
            Inactive historical records
          </p>
        </div>
      </div>

      {/* 3. Category & Search Filtering Row */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#dedbd4] shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Status Nav Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'All Events', count: counts.all },
            { id: 'published', label: 'Live View Events', count: counts.published },
            { id: 'draft', label: 'Events in Draft', count: counts.draft },
            { id: 'completed', label: 'Past Completed', count: counts.completed },
            { id: 'archived', label: 'Archived Events', count: counts.archived },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-[#113326] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-[#f7f5ed]'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === tab.id ? 'bg-[#224f3c] text-[#d8fa57]' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Right Search & Filter controls */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search title, venue, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#f8f7f2] text-xs text-slate-800 pl-9 pr-3 py-1.5 rounded-lg border border-[#dedbd4] focus:outline-none focus:ring-2 focus:ring-[#e65c36]/30 focus:border-transparent"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#f8f7f2] text-xs font-semibold text-slate-700 px-3 py-1.5 rounded-lg border border-[#dedbd4] focus:outline-none cursor-pointer"
          >
            <option value="all">All Categories</option>
            <option value="Engineering & Tech">Engineering & Tech</option>
            <option value="Leadership & Business">Leadership & Business</option>
            <option value="Career & Networking">Career & Networking</option>
            <option value="Science & Research">Science & Research</option>
            <option value="Arts & Culture">Arts & Culture</option>
          </select>
        </div>
      </div>

      {/* 4. Events Cards List */}
      <div className="space-y-3.5">
        {filteredEvents.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#dedbd4] p-12 text-center space-y-3">
            <CalendarDays className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No events found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              There are no events matching your current filters. Try selecting a different tab or create a new session.
            </p>
            <button
              onClick={() => navigate('/organizer/events/new')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#e65c36] text-white rounded-xl text-xs font-bold hover:bg-[#d8522d] transition-colors cursor-pointer mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Event</span>
            </button>
          </div>
        ) : (
          filteredEvents.map((event) => {
            const fillPercentage = Math.min(
              100,
              Math.round((event.currentRegistrations / event.maxCapacity) * 100)
            );

            return (
              <div
                key={event.id}
                className="bg-white rounded-2xl border border-[#dedbd4] hover:border-[#113326]/40 p-5 transition-all shadow-xs hover:shadow space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Status Tag */}
                      {event.status === 'published' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Live View
                        </span>
                      )}
                      {event.status === 'draft' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                          <FileEdit className="w-3 h-3" />
                          In Draft
                        </span>
                      )}
                      {event.status === 'completed' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Past Completed
                        </span>
                      )}
                      {event.status === 'archived' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200">
                          <Archive className="w-3 h-3" />
                          Archived
                        </span>
                      )}

                      {/* Category Chip */}
                      <span className="text-[11px] font-semibold text-slate-500 bg-[#f7f5ed] px-2.5 py-0.5 rounded-md">
                        {event.category}
                      </span>

                      {/* Price Badge */}
                      <span className="text-[11px] font-bold text-slate-700">
                        {event.registrationFee === 0 ? 'Free Entry' : `₹${event.registrationFee}`}
                      </span>
                    </div>

                    <h2
                      onClick={() => navigate(`/events/${event.id}`)}
                      className="text-base sm:text-lg font-bold text-slate-900 tracking-tight hover:text-[#e65c36] transition-colors cursor-pointer"
                      title="View Event Page"
                    >
                      {event.title}
                    </h2>
                    <p className="text-xs text-slate-600 leading-relaxed max-w-3xl line-clamp-2">
                      {event.shortDescription}
                    </p>
                  </div>

                  {/* Actions Column Right */}
                  <div className="flex items-center gap-2 shrink-0 self-start lg:self-center flex-wrap">
                    {/* View Event Page Button for All Events */}
                    {event.status === 'published' && (
                      <>
                        <button
                          onClick={() => navigate(`/events/${event.id}`)}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-600" />
                          <span>View Event Page</span>
                        </button>
                        <button
                          onClick={() => navigate('/organizer/analytics', { state: { selectedEventId: event.id } })}
                          className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Insights</span>
                        </button>
                        <button
                          onClick={() => navigate('/organizer/invites', { state: { selectedEventId: event.id } })}
                          className="px-3 py-1.5 text-xs font-semibold text-[#113326] bg-[#d8fa57]/40 hover:bg-[#d8fa57]/60 border border-[#b2d936] rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                          title="Launch AI Smart Invites Campaign"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-[#113326]" />
                          <span>Smart Invites</span>
                        </button>
                        <button
                          onClick={() => handleArchiveEvent(event.id, event.title)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Archive event"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {event.status === 'draft' && (
                      <>
                        <button
                          onClick={() => navigate(`/events/${event.id}`)}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Preview Event Page"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-600" />
                          <span>View Event Page</span>
                        </button>
                        <button
                          onClick={() => navigate('/organizer/invites', { state: { selectedEventId: event.id } })}
                          className="px-3 py-1.5 text-xs font-semibold text-[#113326] bg-[#d8fa57]/40 hover:bg-[#d8fa57]/60 border border-[#b2d936] rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                          title="Match Candidates with AI"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-[#113326]" />
                          <span>Smart Invites</span>
                        </button>
                        <button
                          onClick={() =>
                            navigate('/organizer/events/new', { state: { editDraft: event } })
                          }
                          className="px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <FileEdit className="w-3.5 h-3.5" />
                          <span>Edit in Agent</span>
                        </button>
                        <button
                          onClick={() => handlePublishDraft(event.id, event.title)}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Publish</span>
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(event.id, event.title)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete draft"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {event.status === 'completed' && (
                      <>
                        <button
                          onClick={() => navigate(`/events/${event.id}`)}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-600" />
                          <span>View Event Page</span>
                        </button>
                        <button
                          onClick={() => navigate('/organizer/analytics')}
                          className="px-3 py-1.5 text-xs font-semibold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
                          <span>Final Report</span>
                        </button>
                      </>
                    )}

                    {event.status === 'archived' && (
                      <>
                        <button
                          onClick={() => navigate(`/events/${event.id}`)}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-600" />
                          <span>View Event Page</span>
                        </button>
                        <button
                          onClick={() => handleRestoreEvent(event.id, event.title)}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Restore Draft</span>
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(event.id, event.title)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Permanently Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Event Details Footer Bar */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="flex items-center gap-1 text-slate-700">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {formatDate(event.startDatetime)}
                    </span>
                    <span className="flex items-center gap-1 text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {event.venue}
                    </span>
                  </div>

                  {/* Attendance Progress Indicator */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                      <Users className="w-3.5 h-3.5 text-[#e65c36]" />
                      <span>
                        {event.currentRegistrations} / {event.maxCapacity} seats
                      </span>
                    </div>
                    <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          fillPercentage >= 90
                            ? 'bg-rose-500'
                            : fillPercentage >= 70
                            ? 'bg-[#e65c36]'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${fillPercentage}%` }}
                      />
                    </div>
                    <span className="font-mono text-[11px] font-bold text-slate-500 w-9 text-right">
                      {fillPercentage}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
