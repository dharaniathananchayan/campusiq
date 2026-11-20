import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  Bell,
  Sparkles,
  Send,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  Users,
  MapPin,
  Bookmark,
  Check,
  Mail,
  Bot,
  Calendar,
  LogOut,
  Compass,
  CalendarDays,
  Heart,
  User,
  Zap,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../../store/useAuthStore';
import { StudentProfileView } from './StudentProfileView';
import { StudentEditProfileView } from './StudentEditProfileView';
import { StudentNotificationsView } from './StudentNotificationsView';
import { DiscussionsView } from './DiscussionsView';
import { StudentRecommendedEventsView } from './StudentRecommendedEventsView';
import { AppSidebar } from '../layout/AppSidebar';
import { NotificationPopover } from '../notifications/NotificationPopover';
import { GlobalSearchBar } from '../search/GlobalSearchBar';

interface StudentDiscoverViewProps {
  onSwitchToOrganizer?: () => void;
  onOpenAssistant?: (query?: string) => void;
}

interface EventItem {
  id: string;
  title: string;
  category: string;
  isFeatured?: boolean;
  matchScore: number;
  matchReason: string;
  datetimeStr: string;
  price: string;
  organizer: string;
  venue: string;
  capacityLeft: number;
  totalCapacity: number;
  image: string;
  isBookmarked: boolean;
  isRegistered: boolean;
}

const INITIAL_EVENTS: EventItem[] = [
  {
    id: 'hacknight',
    title: 'HackNight: Build & Ship in 12 Hours',
    category: 'Technology',
    isFeatured: true,
    matchScore: 94,
    matchReason: '94% match — Machine Learning, Python workshops + 3 friends going',
    datetimeStr: 'Sat, Sep 20 · 10:00 AM',
    price: 'Free',
    organizer: 'CodeCell Society',
    venue: 'Innovation Block · Hall B',
    capacityLeft: 18,
    totalCapacity: 220,
    image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=900&q=80',
    isBookmarked: false,
    isRegistered: false,
  },
  {
    id: 'ctf-bootcamp',
    title: 'CTF Bootcamp: Zero to Hacker',
    category: 'Career',
    isFeatured: false,
    matchScore: 91,
    matchReason: '91% match — aligns with Python + Security searches you saved',
    datetimeStr: 'Sun, Sep 21 · 2:00 PM',
    price: '₹99',
    organizer: 'CyberSec Club',
    venue: 'CSE Annex · Lab 4',
    capacityLeft: 9,
    totalCapacity: 120,
    image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=900&q=80',
    isBookmarked: false,
    isRegistered: false,
  },
  {
    id: 'portfolio-critique',
    title: 'Monsoon Portfolio Critique',
    category: 'Arts & Culture',
    isFeatured: false,
    matchScore: 78,
    matchReason: '78% match — you bookmarked 2 Design events this month',
    datetimeStr: 'Sun, Sep 21 · 11:00 AM',
    price: 'Free',
    organizer: 'Fine Arts Society',
    venue: 'Old Library · Gallery',
    capacityLeft: 34,
    totalCapacity: 80,
    image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=900&q=80',
    isBookmarked: true,
    isRegistered: false,
  },
  {
    id: 'inter-hostel-football',
    title: 'Inter-Hostel Football: Semis',
    category: 'Sports',
    isFeatured: false,
    matchScore: 66,
    matchReason: '66% match — popular with Year 3 · Football interest',
    datetimeStr: 'Sat, Sep 20 · 5:30 PM',
    price: 'Free',
    organizer: 'Sports Committee',
    venue: 'Main Ground · Pitch 1',
    capacityLeft: 120,
    totalCapacity: 200,
    image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=900&q=80',
    isBookmarked: false,
    isRegistered: false,
  },
];

const CATEGORIES = ['For You', 'Technology', 'Arts & Culture', 'Career', 'Sports', 'Workshops'];

export const StudentDiscoverView: React.FC<StudentDiscoverViewProps> = ({
  onSwitchToOrganizer,
  onOpenAssistant,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [activeCategory, setActiveCategory] = useState('For You');
  const [events, setEvents] = useState<EventItem[]>(INITIAL_EVENTS);
  const [promptInput, setPromptInput] = useState('');
  const [directInviteStatus, setDirectInviteStatus] = useState<'pending' | 'accepted' | 'declined'>('pending');
  const [filterActive, setFilterActive] = useState(false);

  const handleSignOut = () => {
    logout();
    toast.success('Signed out successfully');
    navigate('/login', { replace: true });
  };

  const handleRegister = (id: string) => {
    setEvents((prev) =>
      prev.map((ev) => {
        if (ev.id === id) {
          if (ev.isRegistered) {
            toast('Registration cancelled', { icon: 'ℹ️' });
            return { ...ev, isRegistered: false, capacityLeft: ev.capacityLeft + 1 };
          } else {
            toast.success(`Registered for "${ev.title}"! Ticket saved to your profile.`);
            return { ...ev, isRegistered: true, capacityLeft: Math.max(0, ev.capacityLeft - 1) };
          }
        }
        return ev;
      })
    );
  };

  const handleToggleBookmark = (id: string) => {
    setEvents((prev) =>
      prev.map((ev) => {
        if (ev.id === id) {
          const next = !ev.isBookmarked;
          toast(next ? 'Saved to bookmarks' : 'Removed from bookmarks', { icon: next ? '🔖' : '🗑️' });
          return { ...ev, isBookmarked: next };
        }
        return ev;
      })
    );
  };

  const handleDirectInvite = (action: 'accepted' | 'declined') => {
    setDirectInviteStatus(action);
    if (action === 'accepted') {
      toast.success('Accepted invite for CTF Bootcamp! Reserved seat confirmed.');
    } else {
      toast('Declined invitation.', { icon: '✖' });
    }
  };

  const handleAsk = (queryText?: string) => {
    const q = queryText || promptInput || 'What tech hackathons or networking mixers are happening this weekend?';
    if (onOpenAssistant) {
      onOpenAssistant(q);
    } else {
      window.dispatchEvent(new CustomEvent('open-floating-chatbot', { detail: { mode: 'assistant', initialQuery: q } }));
      toast.success(`Querying Campus Assistant for: "${q.slice(0, 35)}..."`);
    }
  };

  // Filter events based on category
  const filteredEvents = events.filter((ev) => {
    if (activeCategory === 'For You') return true;
    return ev.category.toLowerCase() === activeCategory.toLowerCase();
  });

  return (
    <div className="portal font-sans antialiased">
      {/* 1. Unified 2nd Sidebar Design */}
      <AppSidebar forcedRole="student" />

      {/* 2. Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#f7f5ed] overflow-y-auto min-h-screen">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-[#113326] text-white px-5 lg:px-8 py-3 border-b border-[#1b4333] shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#d8fa57]">Student Space</span>
            <span className="text-[#3b5e4f]">•</span>
            <span className="text-xs text-[#a6c1b3] font-medium truncate max-w-xs">
              {(user as any)?.institute_name || 'Northwood University'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Global Omni-Search Bar */}
            <GlobalSearchBar
              className="w-56 sm:w-72 lg:w-96"
              variant="dark"
              placeholder="Search events, organizers, students..."
              onSelectEvent={(eventId) => navigate(`/events/${eventId}`)}
            />

            {/* Notification Popover Panel */}
            <NotificationPopover role="student" variant="dark" />
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-5 lg:p-8 space-y-7 overflow-y-auto">
          {location.pathname === '/student/profile' ? (
            <StudentProfileView onBack={() => navigate('/student/dashboard')} />
          ) : location.pathname === '/student/profile/edit' ? (
            <StudentEditProfileView onBack={() => navigate('/student/profile')} />
          ) : location.pathname === '/student/discussions' ? (
            <DiscussionsView role="student" />
          ) : location.pathname === '/student/ai-studio' || location.pathname === '/student/recommended' ? (
            <StudentRecommendedEventsView />
          ) : location.pathname === '/student/notifications' ? (
            <StudentNotificationsView />
          ) : (
            <>
              {/* 2. Ask Campus Assistant Banner */}
              <section className="bg-white rounded-xl p-4 sm:p-5 border border-[#e8e4d8] shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-[#113326] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Bot className="w-5 h-5 text-[#d8fa57]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-bold text-sm text-[#19231e]">Ask Campus Assistant</h2>
                <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider rounded bg-[#eaf6ed] text-[#1c6b45] uppercase">
                  RAG · LIVE DATA
                </span>
              </div>
              <p className="text-xs text-[#526359] truncate mt-0.5">
                "What tech hackathons or networking mixers are happening this weekend?"
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-start sm:justify-end">
            <button
              onClick={() => handleAsk('What tech events are happening this weekend?')}
              className="px-3 py-1.5 text-xs font-medium bg-[#f5f3ec] hover:bg-[#ece8dc] text-[#33423a] rounded-full border border-[#e2ded2] transition-colors cursor-pointer"
            >
              This weekend
            </button>
            <button
              onClick={() => handleAsk('Which upcoming events are free to attend?')}
              className="px-3 py-1.5 text-xs font-medium bg-[#f5f3ec] hover:bg-[#ece8dc] text-[#33423a] rounded-full border border-[#e2ded2] transition-colors cursor-pointer"
            >
              Free only
            </button>
            <button
              onClick={() => handleAsk('Show me beginner-friendly workshops')}
              className="px-3 py-1.5 text-xs font-medium bg-[#f5f3ec] hover:bg-[#ece8dc] text-[#33423a] rounded-full border border-[#e2ded2] transition-colors cursor-pointer"
            >
              Beginner friendly
            </button>

            <button
              onClick={() => handleAsk()}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#e65c36] hover:bg-[#d8522d] text-white rounded-lg text-xs font-semibold transition-colors shadow-xs ml-1 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Ask</span>
            </button>
          </div>
        </section>

        {/* 3. Personalized Section Header */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold tracking-widest text-[#e65c36] uppercase">
                — PERSONALIZED FOR AARAV - CS YEAR 3
              </p>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#11241c] mt-1">
                Tonight, something clicks.
              </h1>
              <p className="text-xs sm:text-sm text-[#526359] mt-1">
                12 events match your interests this week — ranked by your AI match score.
              </p>
            </div>

            {/* Controls right */}
            <div className="flex items-center gap-2.5 self-start sm:self-auto">
              <button
                onClick={() => toast('Filter period: Current academic week')}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-white text-[#2a3831] border border-[#d8d3c5] rounded-lg shadow-xs hover:bg-[#fbf9f4] transition-colors"
              >
                <Calendar className="w-3.5 h-3.5 text-[#526359]" />
                <span>This week</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#73877b]" />
              </button>

              <button
                onClick={() => {
                  setFilterActive(!filterActive);
                  toast(filterActive ? 'Reset filters' : 'Applied 2 active preference filters');
                }}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-white text-[#2a3831] border border-[#d8d3c5] rounded-lg shadow-xs hover:bg-[#fbf9f4] transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#526359]" />
                <span>Filters</span>
                <span className="w-4 h-4 rounded-full bg-[#113326] text-white text-[10px] font-bold flex items-center justify-center">
                  2
                </span>
              </button>
            </div>
          </div>

          {/* Category Filter Strip */}
          <div className="flex items-center justify-between gap-4 overflow-x-auto pb-1 border-b border-[#e8e4d8]">
            <div className="flex items-center gap-2 shrink-0">
              {CATEGORIES.map((cat) => {
                const active = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                      active
                        ? 'bg-[#113326] text-white shadow-xs font-semibold'
                        : 'bg-white text-[#415349] border border-[#ded9cb] hover:bg-[#f6f2e6]'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            <div className="hidden md:flex items-center gap-1.5 text-xs text-[#63796d] shrink-0 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-[#86a392]" />
              <span>Sorted by AI match score</span>
            </div>
          </div>
        </section>

        {/* 4. Main Two-Column Layout: Grid + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          {/* LEFT 8 COLS: 2x2 Event Cards Grid */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredEvents.map((event) => {
              const fillPct = Math.round(
                ((event.totalCapacity - event.capacityLeft) / event.totalCapacity) * 100
              );

              return (
                <div
                  key={event.id}
                  onClick={() => navigate(`/events/${event.id}`)}
                  className="bg-white rounded-xl overflow-hidden border border-[#e8e4d8] shadow-[0_1px_4px_rgba(0,0,0,0.04)] flex flex-col hover:shadow-lg hover:border-[#113326]/40 transition-all duration-200 group cursor-pointer"
                >
                  {/* Event Thumbnail with overlays */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#24352d]">
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-black/35" />

                    {/* Top Overlay Badges */}
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-0.5 bg-black/60 backdrop-blur-xs text-white text-[11px] font-medium rounded-full border border-white/10">
                          {event.category}
                        </span>
                        {event.isFeatured && (
                          <span className="px-2.5 py-0.5 bg-[#e65c36] text-white text-[11px] font-semibold rounded-full shadow-xs">
                            ★ Featured
                          </span>
                        )}
                      </div>

                      <span className="px-2.5 py-0.5 bg-[#eaf6ed]/95 backdrop-blur-xs text-[#165a39] text-[11px] font-bold rounded-full border border-[#165a39]/20 flex items-center gap-1 shadow-xs">
                        <Sparkles className="w-3 h-3" />
                        {event.matchScore}% Match
                      </span>
                    </div>

                    {/* Bottom Overlay Info */}
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[11px] font-medium text-white">
                      <span className="px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs border border-white/10">
                        {event.datetimeStr}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs border border-white/10 font-semibold text-[#d8fa57]">
                        {event.price}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-base text-[#11241c] leading-snug group-hover:text-[#e65c36] transition-colors">
                        {event.title}
                      </h3>

                      <div className="flex items-center gap-3 text-xs text-[#5f7468] mt-1.5 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-[#7e978a]" />
                          {event.organizer}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#7e978a]" />
                          {event.venue}
                        </span>
                      </div>
                    </div>

                    {/* Match Reason Banner */}
                    <div className="p-2.5 rounded-lg bg-[#eaf6ed] border border-[#cee9d7] text-xs text-[#1c6b45] flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 shrink-0 text-[#1c6b45]" />
                      <span className="truncate">{event.matchReason}</span>
                    </div>

                    {/* Capacity Indicator */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-[#5f7468]">
                        <span>Capacity</span>
                        <span className="font-semibold text-[#1c6b45]">{event.capacityLeft} seats left</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#e5e1d4] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#113326] rounded-full transition-all duration-500"
                          style={{ width: `${fillPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Action Row */}
                    <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRegister(event.id);
                        }}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer ${
                          event.isRegistered
                            ? 'bg-[#1c6b45] text-white hover:bg-[#165a39]'
                            : 'bg-[#113326] text-white hover:bg-[#1b4333]'
                        }`}
                      >
                        {event.isRegistered ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Registered</span>
                          </>
                        ) : (
                          <span>Register · 1 click</span>
                        )}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleBookmark(event.id);
                        }}
                        aria-label="Bookmark"
                        className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                          event.isBookmarked
                            ? 'border-[#e65c36] bg-[#fdf2ee] text-[#e65c36]'
                            : 'border-[#d8d3c5] bg-white text-[#63796d] hover:bg-[#f6f2e6]'
                        }`}
                      >
                        <Bookmark className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* RIGHT 4 COLS: Profile, Direct Invites, Weekend Timeline */}
          <aside className="lg:col-span-4 space-y-5">
            {/* 1. Your AI Profile Card (Dark Green) */}
            <div className="bg-[#113326] text-white rounded-xl p-5 border border-[#1d4c38] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#c7dfd2]">
                  <Sparkles className="w-4 h-4 text-[#d8fa57]" />
                  <span>Your AI Profile</span>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-[#1f563f] text-[#d8fa57] uppercase tracking-wider">
                  Live
                </span>
              </div>

              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold tracking-tight text-white font-mono">87</span>
                  <span className="text-xs text-[#9bb5a7]">avg. match this week</span>
                </div>
                <p className="text-[11px] text-[#8aa998] mt-1">
                  Built from 24 registrations, 31 bookmarks & 46 searches.
                </p>
              </div>

              {/* Keyword tags */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['Machine Learning', 'Python', 'Hackathons', 'Design', 'Football'].map((tag) => (
                  <span
                    key={tag}
                    onClick={() => toast(`Filtering events matching "${tag}"`)}
                    className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-[#1b4333] border border-[#265943] text-[#cbe1d5] hover:border-[#d8fa57]/40 hover:text-white transition-colors cursor-pointer"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <button
                onClick={() => navigate('/student/profile')}
                className="w-full mt-3 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#1f563f] hover:bg-[#286a4e] text-white text-xs font-bold transition-all cursor-pointer border border-[#2b7556]"
              >
                <User className="w-3.5 h-3.5 text-[#d8fa57]" />
                <span>View Full Profile & Interests →</span>
              </button>
            </div>

            {/* 2. Direct Invites Card */}
            <div className="bg-white rounded-xl p-4.5 border border-[#e8e4d8] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#11241c] uppercase tracking-wider">Direct invites</h3>
                <button
                  onClick={() => toast('Opened Direct Invites Drawer')}
                  className="text-xs text-[#e65c36] font-semibold hover:underline cursor-pointer"
                >
                  View all
                </button>
              </div>

              {directInviteStatus === 'pending' ? (
                <div className="p-3 bg-[#fbf9f4] rounded-lg border border-[#e8e4d8] space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded bg-[#fdf0ec] text-[#e65c36] flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4
                        onClick={() => navigate('/events/ctf-bootcamp')}
                        className="text-xs font-bold text-[#11241c] truncate hover:text-[#e65c36] cursor-pointer"
                        title="View Event Page"
                      >
                        CTF Bootcamp: Zero to Hacker
                      </h4>
                      <p className="text-[11px] text-[#63796d]">CyberSec Club · 98% match for you</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleDirectInvite('accepted')}
                      className="flex-1 py-1.5 px-2 bg-[#113326] hover:bg-[#1b4333] text-white text-xs font-semibold rounded transition-colors cursor-pointer"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleDirectInvite('declined')}
                      className="flex-1 py-1.5 px-2 bg-white hover:bg-[#f1ede3] text-[#415349] border border-[#d8d3c5] text-xs font-medium rounded transition-colors cursor-pointer"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-[#eaf6ed] rounded-lg border border-[#cee9d7] text-xs text-[#1c6b45] font-medium">
                  {directInviteStatus === 'accepted' ? '✓ Accepted CTF Bootcamp invite!' : '✖ Invitation declined'}
                </div>
              )}

              {/* Avatar stack */}
              <div className="flex items-center gap-2 pt-1 text-[11px] text-[#63796d]">
                <div className="flex -space-x-1.5">
                  <div className="w-6 h-6 rounded-full bg-[#1b4333] text-white text-[9px] font-bold flex items-center justify-center border border-white">
                    SK
                  </div>
                  <div className="w-6 h-6 rounded-full bg-[#e65c36] text-white text-[9px] font-bold flex items-center justify-center border border-white">
                    JM
                  </div>
                  <div className="w-6 h-6 rounded-full bg-[#526359] text-white text-[9px] font-bold flex items-center justify-center border border-white">
                    +2
                  </div>
                </div>
                <span>2 more invites waiting in inbox</span>
              </div>
            </div>

            {/* 3. This Weekend Timeline Card */}
            <div className="bg-white rounded-xl p-4.5 border border-[#e8e4d8] shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-[#11241c] uppercase tracking-wider">This weekend</h3>

              <div className="space-y-2">
                {[
                  { date: 'SAT 20', title: 'HackNight Finals', id: 'hacknight', color: 'bg-[#1c6b45]' },
                  { date: 'SUN 21', title: 'Portfolio Critique', id: 'portfolio-critique', color: 'bg-[#e65c36]' },
                  { date: 'SUN 21', title: 'Inter-Hostel Football', id: 'inter-hostel-football', color: 'bg-[#e65c36]' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => navigate(`/events/${item.id}`)}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-[#fbf9f4] transition-colors cursor-pointer group"
                    title="View Event Page"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-1 h-5 rounded-full ${item.color}`} />
                      <div>
                        <span className="text-[10px] font-bold text-[#73877b] block font-mono">{item.date}</span>
                        <span className="text-xs font-semibold text-[#11241c] group-hover:text-[#e65c36] transition-colors">
                          {item.title}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#9bb5a7] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
            </>
          )}
        </main>

        {/* 5. Footer inside main content scroll view */}
        <footer className="mt-12 bg-[#113326] text-[#a4beb0] border-t border-[#1b4333] py-5 px-5 lg:px-8 text-xs">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <span className="text-white font-medium">CampusIQ</span> · Northwood University · 248 events live
            </div>
            <div className="flex items-center gap-6">
              <button onClick={() => toast('Help desk: support@campusiq.edu')} className="hover:text-white transition-colors cursor-pointer">
                Help
              </button>
              <button onClick={onSwitchToOrganizer} className="hover:text-white transition-colors cursor-pointer">
                Organize an event
              </button>
              <button onClick={() => toast('Campus Map: Northwood Campus Interactive Map')} className="hover:text-white transition-colors cursor-pointer">
                Campus map
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
