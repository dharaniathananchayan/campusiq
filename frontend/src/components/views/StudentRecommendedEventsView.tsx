import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Bookmark,
  Heart,
  Search,
  Filter,
  ArrowRight,
  ExternalLink,
  Users,
  Flame,
  Check,
  RotateCw,
  Tag,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../../store/useAuthStore';
import { mockEvents } from '../../data/mockData';

export interface RecommendedEvent {
  id: string;
  title: string;
  organizer: string;
  category: string;
  imageUrl: string;
  date: string;
  time: string;
  location: string;
  room: string;
  availableSeats: number;
  totalSeats: number;
  matchScore: number;
  matchReason: string;
  interestSynergies: string[];
  isRegistered: boolean;
  isSaved: boolean;
  price: string;
  badge?: string;
}

const INITIAL_RECOMMENDED_EVENTS: RecommendedEvent[] = [
  {
    id: 'ev-1',
    title: 'University AI Symposium: Frontiers in Generative Architecture',
    organizer: 'Association of Computing & Engineering',
    category: 'Engineering & Tech',
    imageUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1200&q=80',
    date: 'Fri, Sep 18, 2026',
    time: '09:00 AM – 05:00 PM',
    location: 'Turing Grand Auditorium',
    room: 'Main Hall',
    availableSeats: 38,
    totalSeats: 350,
    matchScore: 98,
    matchReason: '98% match — High synergy with your Python, Neural Networks & Machine Learning interest profile',
    interestSynergies: ['Foundation Models', 'PyTorch Lab', 'Distributed Compute'],
    isRegistered: false,
    isSaved: true,
    price: 'Free',
    badge: 'Top Affinity',
  },
  {
    id: 'ev-3',
    title: 'HackNight: Build & Ship in 12 Hours',
    organizer: 'CodeCell Society',
    category: 'Competitions & Hackathons',
    imageUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
    date: 'Sat, Sep 26, 2026',
    time: '08:00 PM – 08:00 AM',
    location: 'Founders Innovation Hub',
    room: 'Lab B',
    availableSeats: 16,
    totalSeats: 150,
    matchScore: 95,
    matchReason: '95% match — 4 friends from your branch are registered + aligns with your Hackathon streak',
    interestSynergies: ['Rapid Prototyping', 'Full-Stack', 'Team Building'],
    isRegistered: false,
    isSaved: false,
    price: 'Free',
    badge: 'Trending on Campus',
  },
  {
    id: 'ev-5',
    title: 'CyberDefense CTF: Red vs Blue Live Arena',
    organizer: 'CyberSec Guild',
    category: 'Engineering & Tech',
    imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
    date: 'Sat, Oct 3, 2026',
    time: '10:00 AM – 04:00 PM',
    location: 'Ada Lovelace Tech Center',
    room: 'Cyber Range 2',
    availableSeats: 22,
    totalSeats: 100,
    matchScore: 92,
    matchReason: '92% match — Aligns with your recent Network Security searches and hands-on lab preference',
    interestSynergies: ['Penetration Testing', 'Binary Exploitation', 'CTF Flags'],
    isRegistered: false,
    isSaved: false,
    price: 'Free',
    badge: 'High Hands-on Value',
  },
  {
    id: 'ev-2',
    title: 'Venture Sprint: Campus Startup Pitch & Investor Showcase',
    organizer: 'Campus Entrepreneurship Lab',
    category: 'Leadership & Business',
    imageUrl: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=1200&q=80',
    date: 'Wed, Oct 8, 2026',
    time: '02:00 PM – 06:00 PM',
    location: 'Founders Innovation Hub',
    room: 'Auditorium 1',
    availableSeats: 6,
    totalSeats: 120,
    matchScore: 89,
    matchReason: '89% match — Matches your Venture Capital bookmark history & alumni networking interests',
    interestSynergies: ['Seed Capital', 'Pitch Practice', 'Angel Investors'],
    isRegistered: false,
    isSaved: true,
    price: 'Free',
  },
  {
    id: 'ev-4',
    title: 'Quantum Computing & Qiskit Workshop',
    organizer: 'Department of Physics & Quantum Computing',
    category: 'Engineering & Tech',
    imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80',
    date: 'Tue, Oct 14, 2026',
    time: '04:00 PM – 06:00 PM',
    location: 'Maxwell Science Complex',
    room: 'Turing Hall B',
    availableSeats: 28,
    totalSeats: 150,
    matchScore: 86,
    matchReason: '86% match — Strong academic overlap with your advanced algorithms and linear algebra coursework',
    interestSynergies: ['Quantum Circuits', 'IBM Qiskit', 'Quantum Algorithms'],
    isRegistered: false,
    isSaved: false,
    price: 'Free',
  },
  {
    id: 'ev-6',
    title: 'Product Design Sprint: Zero to 1 in Figma',
    organizer: 'Campus Design Collective',
    category: 'Arts & Design',
    imageUrl: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1200&q=80',
    date: 'Sat, Oct 24, 2026',
    time: '11:00 AM – 03:00 PM',
    location: 'Design Studio 402',
    room: 'Workshop Room A',
    availableSeats: 12,
    totalSeats: 60,
    matchScore: 83,
    matchReason: '83% match — Recommended based on your cross-disciplinary UI/UX interest tags',
    interestSynergies: ['Design Systems', 'Figma Prototyping', 'User Research'],
    isRegistered: false,
    isSaved: false,
    price: 'Free',
  },
];

export const StudentRecommendedEventsView: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [events, setEvents] = useState<RecommendedEvent[]>(() => {
    try {
      const saved = localStorage.getItem('campusiq_recommended_events');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_RECOMMENDED_EVENTS;
  });

  const saveEventsState = (updated: RecommendedEvent[]) => {
    setEvents(updated);
    try {
      localStorage.setItem('campusiq_recommended_events', JSON.stringify(updated));
    } catch {}
  };

  const handleRegister = (eventId: string, title: string) => {
    const updated = events.map((ev) => {
      if (ev.id === eventId) {
        const nextState = !ev.isRegistered;
        if (nextState) {
          toast.success(`Registered for ${title}! Added to your Schedule.`);
        } else {
          toast(`Registration cancelled for ${title}.`);
        }
        return {
          ...ev,
          isRegistered: nextState,
          availableSeats: nextState ? Math.max(0, ev.availableSeats - 1) : ev.availableSeats + 1,
        };
      }
      return ev;
    });
    saveEventsState(updated);
  };

  const handleToggleSave = (eventId: string, title: string) => {
    const updated = events.map((ev) => {
      if (ev.id === eventId) {
        const nextState = !ev.isSaved;
        if (nextState) {
          toast.success(`Saved "${title}" to your bookmarks!`);
        } else {
          toast(`Removed "${title}" from saved events.`);
        }
        return { ...ev, isSaved: nextState };
      }
      return ev;
    });
    saveEventsState(updated);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('AI recommendations refreshed based on your latest activity!');
    }, 600);
  };

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const matchesSearch =
        ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.organizer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.interestSynergies.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchesFilter = true;
      if (selectedFilter === 'high') {
        matchesFilter = ev.matchScore >= 90;
      } else if (selectedFilter === 'tech') {
        matchesFilter = ev.category.includes('Tech') || ev.category.includes('Engineering');
      } else if (selectedFilter === 'hackathons') {
        matchesFilter = ev.category.includes('Hackathon') || ev.title.includes('Hack');
      } else if (selectedFilter === 'leadership') {
        matchesFilter = ev.category.includes('Leadership') || ev.category.includes('Business');
      } else if (selectedFilter === 'registered') {
        matchesFilter = ev.isRegistered;
      }

      return matchesSearch && matchesFilter;
    });
  }, [events, searchQuery, selectedFilter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* 1. Header Banner */}
      <div className="bg-[#112b20] text-white rounded-2xl p-6 sm:p-7 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-full bg-radial from-[#1e4a37] to-transparent opacity-70 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#1b4333] border border-[#2b614b] text-[#d8fa57] text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Interest Matching Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Events You Might Like
            </h1>
            <p className="text-xs sm:text-sm text-[#a3b8ad] max-w-2xl leading-relaxed">
              Curated campus recommendations calculated from your registered workshops, search trends, club affinities, and peer attendance patterns.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-[#1b4333] hover:bg-[#235843] border border-[#2b614b] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 text-[#d8fa57] ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Recalculate Matches</span>
            </button>
          </div>
        </div>

        {/* Affinity Strip */}
        <div className="mt-5 pt-4 border-t border-[#1e4a37] flex flex-wrap items-center gap-2 text-xs text-[#a3b8ad]">
          <span className="font-bold text-white uppercase text-[10px] tracking-wider">Your Top Affinities:</span>
          {[
            { tag: 'Machine Learning', score: '98%' },
            { tag: 'Python', score: '95%' },
            { tag: 'Hackathons', score: '92%' },
            { tag: 'Startups', score: '89%' },
            { tag: 'CyberSecurity', score: '88%' },
          ].map((item) => (
            <span
              key={item.tag}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#16382a] border border-[#24523e] text-[#cce2d6] text-[11px]"
            >
              <span className="font-semibold text-white">{item.tag}</span>
              <span className="font-mono text-[#d8fa57] font-bold text-[10px]">{item.score}</span>
            </span>
          ))}
        </div>
      </div>

      {/* 2. Controls & Filter Bar */}
      <div className="bg-white rounded-2xl border border-[#dedbd4] p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search recommended events, topics, or clubs..."
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#112b20]/20 focus:border-[#112b20]"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {[
            { id: 'all', label: 'All Recommendations' },
            { id: 'high', label: 'High Match (90%+)' },
            { id: 'tech', label: 'Tech & AI' },
            { id: 'hackathons', label: 'Hackathons' },
            { id: 'leadership', label: 'Startups & Business' },
            { id: 'registered', label: 'My Registered' },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setSelectedFilter(pill.id)}
              className={`px-3 py-1.5 rounded-xl font-bold shrink-0 transition-all cursor-pointer ${
                selectedFilter === pill.id
                  ? 'bg-[#112b20] text-[#d8fa57] shadow-xs'
                  : 'bg-[#f4f2ea] text-[#55695f] hover:bg-[#eae6da]'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Recommended Events Grid */}
      {filteredEvents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#dedbd4] p-12 text-center space-y-3">
          <Sparkles className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No events matched your current filters</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try adjusting your search keywords or reset filter pills to view all recommended events.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedFilter('all');
            }}
            className="px-4 py-2 bg-[#112b20] text-white rounded-xl text-xs font-bold hover:bg-[#1a4030] transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => {
            const seatsPercent = Math.round(
              ((event.totalSeats - event.availableSeats) / event.totalSeats) * 100
            );

            return (
              <div
                key={event.id}
                className="bg-white rounded-2xl border border-[#dedbd4] overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
              >
                {/* Event Image Banner with Match Badge */}
                <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
                  <img
                    src={event.imageUrl}
                    alt={event.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                  />

                  {/* Match Score Badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-lg bg-[#112b20]/90 backdrop-blur-xs text-[#d8fa57] text-xs font-extrabold font-mono border border-black/10 shadow-xs flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      {event.matchScore}% Match
                    </span>

                    {event.badge && (
                      <span className="px-2 py-0.5 rounded-md bg-[#e65c36] text-white text-[10px] font-bold uppercase tracking-wider shadow-xs">
                        {event.badge}
                      </span>
                    )}
                  </div>

                  {/* Bookmark Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleSave(event.id, event.title);
                    }}
                    title={event.isSaved ? 'Remove from saved' : 'Save event'}
                    className={`absolute top-3 right-3 p-2 rounded-xl backdrop-blur-xs transition-all cursor-pointer shadow-xs ${
                      event.isSaved
                        ? 'bg-[#e65c36] text-white'
                        : 'bg-black/50 text-white hover:bg-black/70'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${event.isSaved ? 'fill-current' : ''}`} />
                  </button>

                  {/* Bottom Category Strip on Image */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] pointer-events-none">
                    <span className="px-2.5 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-white font-medium border border-white/10">
                      {event.category}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-[#d8fa57] font-bold font-mono border border-white/10">
                      {event.price}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2.5">
                    {/* Organizer & Status */}
                    <div className="flex items-center justify-between text-xs text-[#738278]">
                      <span className="font-medium truncate max-w-[200px]">{event.organizer}</span>
                      {event.isRegistered && (
                        <span className="px-2 py-0.5 rounded bg-[#eaf6ed] text-[#1c6b45] text-[10px] font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Registered
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3
                      onClick={() => navigate(`/events/${event.id}`)}
                      className="font-extrabold text-sm text-[#11241c] leading-snug group-hover:text-[#e65c36] transition-colors cursor-pointer line-clamp-2"
                    >
                      {event.title}
                    </h3>

                    {/* Date & Location */}
                    <div className="space-y-1 text-xs text-[#526359]">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#e65c36] shrink-0" />
                        <span>{event.date} · {event.time}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#8c9c91] shrink-0" />
                        <span className="truncate">{event.location} ({event.room})</span>
                      </div>
                    </div>

                    {/* AI Synergy Match Box */}
                    <div className="p-2.5 bg-[#fbf9f4] border border-[#e8e4d8] rounded-xl space-y-1.5 text-left">
                      <div className="flex items-start gap-1.5 text-[11px] text-[#112b20] leading-snug">
                        <Sparkles className="w-3.5 h-3.5 text-[#1c6b45] shrink-0 mt-0.5" />
                        <span className="font-medium text-[11px]">{event.matchReason}</span>
                      </div>

                      {/* Synergies */}
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {event.interestSynergies.map((syn, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white border border-[#dedbd4] text-[#55695f]"
                          >
                            #{syn}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Capacity Indicator */}
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-medium">Available Seats</span>
                        <span className="font-mono font-bold text-slate-800">
                          {event.availableSeats} of {event.totalSeats} left
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            event.availableSeats <= 10 ? 'bg-[#e65c36]' : 'bg-[#112b20]'
                          }`}
                          style={{ width: `${seatsPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleRegister(event.id, event.title)}
                      className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs ${
                        event.isRegistered
                          ? 'bg-[#eaf6ed] hover:bg-[#d5edd9] text-[#1c6b45] border border-[#b2ddbe]'
                          : 'bg-[#112b20] hover:bg-[#1a4030] text-white'
                      }`}
                    >
                      {event.isRegistered ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Registered</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#d8fa57]" />
                          <span>Register Now</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate(`/events/${event.id}`)}
                      className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
                      title="View full event details"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
