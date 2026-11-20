import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  Bookmark,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Check,
  Trash2,
  ExternalLink,
  ArrowRight,
  ArrowUpRight,
  Search,
  SlidersHorizontal,
  Compass,
  AlertTriangle,
  Sparkles,
  Ticket,
  Users,
  X,
  Share2,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../../store/useAuthStore';
import { registrationsApi } from '../../api/registrations';

export interface SavedEventItem {
  id: string;
  title: string;
  organizer: string;
  category: string;
  imageUrl: string;
  startDate: string;
  timeRange: string;
  location: string;
  room: string;
  capacity: number;
  registeredCount: number;
  availableSeats: number;
  registrationDeadline: string;
  deadlineWarning?: string;
  price: string;
  matchScore: number;
  matchReason: string;
  isRegistered: boolean;
  tags: string[];
}

export const StudentSavedEventsView: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'deadline' | 'match' | 'date' | 'seats'>('deadline');
  const [lastRemovedEvent, setLastRemovedEvent] = useState<SavedEventItem | null>(null);

  // Initial bookmarked events list
  const [savedEvents, setSavedEvents] = useState<SavedEventItem[]>([
    {
      id: 'ev-2',
      title: 'Venture Sprint: Campus Startup Pitch & Investor Showcase',
      organizer: 'Campus Entrepreneurship Lab',
      category: 'Leadership',
      imageUrl: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=600&q=80',
      startDate: 'Wed, Oct 8, 2026',
      timeRange: '02:00 PM – 06:00 PM',
      location: 'Founders Hall',
      room: 'Auditorium 1',
      capacity: 120,
      registeredCount: 114,
      availableSeats: 6,
      registrationDeadline: 'Oct 6, 2026',
      deadlineWarning: 'Closes in 2 days',
      price: 'Free',
      matchScore: 94,
      matchReason: 'Matches your Entrepreneurship & Venture pitch interests',
      isRegistered: false,
      tags: ['Startups', 'Pitch', 'Venture Capital', 'Networking'],
    },
    {
      id: 'ev-4',
      title: 'Quantum Information & Condensed Matter Colloquium',
      organizer: 'Department of Physics & Quantum Computing',
      category: 'Research',
      imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=600&q=80',
      startDate: 'Tue, Oct 14, 2026',
      timeRange: '04:00 PM – 06:00 PM',
      location: 'Maxwell Science Complex',
      room: 'Turing Hall B',
      capacity: 150,
      registeredCount: 122,
      availableSeats: 28,
      registrationDeadline: 'Oct 12, 2026',
      price: 'Free',
      matchScore: 89,
      matchReason: 'High research alignment with Deep Tech systems',
      isRegistered: false,
      tags: ['Physics', 'Quantum', 'Hardware', 'Nobel Lecture'],
    },
    {
      id: 'ev-6',
      title: 'HackCampus 2026: 36-Hour National Collegiate Hackathon',
      organizer: 'Northwood Student Hackathon League',
      category: 'Technology',
      imageUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=600&q=80',
      startDate: 'Sat–Sun, Oct 17–18, 2026',
      timeRange: '36 Hours Non-Stop',
      location: 'Campus Sports Complex',
      room: 'Main Arena',
      capacity: 300,
      registeredCount: 282,
      availableSeats: 18,
      registrationDeadline: 'Oct 10, 2026',
      deadlineWarning: 'Registration closes in 4 days',
      price: 'Free · Meals provided',
      matchScore: 98,
      matchReason: 'Top ML / Python match + $25,000 cash prizes',
      isRegistered: false,
      tags: ['Hackathon', 'Coding', 'AI for Good', 'Prizes'],
    },
    {
      id: 'ev-7',
      title: 'Design Systems Masterclass: Figma to Code in React',
      organizer: 'Design Guild & UI Collective',
      category: 'Arts',
      imageUrl: 'https://images.unsplash.com/photo-1581291518655-9523c932deb4?auto=format&fit=crop&w=600&q=80',
      startDate: 'Tue, Oct 21, 2026',
      timeRange: '03:00 PM – 06:00 PM',
      location: 'Fine Arts & Media Building',
      room: 'Media Studio 3',
      capacity: 45,
      registeredCount: 38,
      availableSeats: 7,
      registrationDeadline: 'Oct 19, 2026',
      deadlineWarning: 'Only 7 spots left',
      price: 'Free',
      matchScore: 86,
      matchReason: 'Pairs with your UI/UX frontend interests',
      isRegistered: false,
      tags: ['Design Systems', 'Figma', 'React', 'Frontend'],
    },
    {
      id: 'ev-8',
      title: 'Autonomous Robotics & Drone Navigation Clinic',
      organizer: 'Robotics & Hardware Club',
      category: 'Technology',
      imageUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=600&q=80',
      startDate: 'Fri, Oct 23, 2026',
      timeRange: '01:00 PM – 05:00 PM',
      location: 'Engineering Flight Deck',
      room: 'Hangar Lab 2',
      capacity: 60,
      registeredCount: 42,
      availableSeats: 18,
      registrationDeadline: 'Oct 21, 2026',
      price: 'Free · Hardware kits provided',
      matchScore: 92,
      matchReason: 'Matches your Robotics & Edge systems interest',
      isRegistered: false,
      tags: ['Robotics', 'Drones', 'Sensors', 'Computer Vision'],
    },
  ]);

  const categories = ['All', 'Technology', 'Leadership', 'Research', 'Arts'];

  // Handle 1-click registration
  const handleRegister = (event: SavedEventItem) => {
    setSavedEvents((prev) =>
      prev.map((item) =>
        item.id === event.id
          ? {
              ...item,
              isRegistered: true,
              availableSeats: Math.max(0, item.availableSeats - 1),
              registeredCount: item.registeredCount + 1,
            }
          : item
      )
    );

    // Call API in background
    registrationsApi.registerForEvent(event.id).catch(() => {});

    toast.success(`🎉 Registered for "${event.title}"! Guaranteed spot confirmed.`);
  };

  // Handle removing from saved events with undo capability
  const handleRemoveFromSaved = (eventId: string, eventTitle: string) => {
    const target = savedEvents.find((e) => e.id === eventId);
    if (target) {
      setLastRemovedEvent(target);
      setSavedEvents((prev) => prev.filter((e) => e.id !== eventId));

      // Call API in background
      registrationsApi.removeBookmark(eventId).catch(() => {});

      toast(
        (t) => (
          <div className="flex items-center justify-between gap-3 text-xs">
            <span>Removed "{eventTitle.slice(0, 28)}..." from saved</span>
            <button
              onClick={() => {
                setSavedEvents((prev) => [target, ...prev]);
                toast.dismiss(t.id);
                toast.success('Restored to saved events!');
              }}
              className="px-2 py-1 bg-[#112b20] text-[#d8fa57] font-bold rounded hover:underline cursor-pointer"
            >
              Undo
            </button>
          </div>
        ),
        { duration: 4000 }
      );
    }
  };

  // Filtered and sorted events
  const filteredEvents = useMemo(() => {
    return savedEvents
      .filter((ev) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matches =
            ev.title.toLowerCase().includes(q) ||
            ev.organizer.toLowerCase().includes(q) ||
            ev.category.toLowerCase().includes(q) ||
            ev.tags.some((t) => t.toLowerCase().includes(q));
          if (!matches) return false;
        }

        // Category filter
        if (selectedCategory !== 'All' && ev.category.toLowerCase() !== selectedCategory.toLowerCase()) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'match') return b.matchScore - a.matchScore;
        if (sortBy === 'seats') return a.availableSeats - b.availableSeats;
        if (sortBy === 'date') return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        // Default: deadline urgency
        return a.availableSeats - b.availableSeats;
      });
  }, [savedEvents, searchQuery, selectedCategory, sortBy]);

  const urgentCount = savedEvents.filter((e) => e.deadlineWarning || e.availableSeats < 10).length;

  return (
    <div className="w-full font-sans text-left space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. Header with Title & Stats */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#e5e2d6]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold tracking-widest text-[#e65c36] uppercase">
              STUDENT SPACE
            </span>
            <span className="text-[#8e998a]">•</span>
            <span className="text-xs font-semibold text-[#11241c]">Northwood University</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#11241c] mt-1 flex items-center gap-2.5">
            <Heart className="w-7 h-7 text-[#e65c36] fill-[#e65c36]" />
            <span>Saved Events</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#526359] mt-0.5 max-w-2xl">
            Events you’ve bookmarked for later. Lock in your admission before seats fill or registration deadlines expire.
          </p>
        </div>

        {/* Quick Counters */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="px-3.5 py-1.5 rounded-xl bg-white border border-[#dedbd4] shadow-2xs text-xs font-semibold text-[#19231e] flex items-center gap-1.5">
            <Bookmark className="w-3.5 h-3.5 text-[#112b20]" />
            <span>
              <strong>{savedEvents.length}</strong> Saved
            </span>
          </div>

          {urgentCount > 0 && (
            <div className="px-3.5 py-1.5 rounded-xl bg-[#fef3f0] border border-[#fbd4c8] text-xs font-bold text-[#c2410c] flex items-center gap-1.5 shadow-2xs">
              <AlertTriangle className="w-3.5 h-3.5 text-[#e65c36]" />
              <span>{urgentCount} Closing Soon</span>
            </div>
          )}

          <button
            onClick={() => navigate('/events')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#112b20] hover:bg-[#1a4030] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5 text-[#d8fa57]" />
            <span>Browse More</span>
          </button>
        </div>
      </div>

      {/* 2. Filter, Search & Sort Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-[#e5e2d6] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8ea79a]" />
            <input
              type="text"
              placeholder="Search saved events, clubs, topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#fbf9f4] border border-[#dcd9ce] rounded-xl pl-9 pr-3.5 py-2 text-xs text-[#19231e] placeholder-[#8ea79a] focus:outline-none focus:ring-2 focus:ring-[#112b20]"
            />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-xs text-[#738278] font-medium shrink-0 flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3" /> Sort by:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#fbf9f4] border border-[#dcd9ce] text-xs font-bold text-[#19231e] rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
            >
              <option value="deadline">Registration Deadline (Urgent First)</option>
              <option value="match">Highest AI Match Score</option>
              <option value="seats">Fewest Seats Remaining</option>
              <option value="date">Event Date (Earliest First)</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-[#f0eee6]">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#112b20] text-white shadow-xs'
                  : 'bg-[#f4f2ea] text-[#4a574f] hover:bg-[#ece8dc]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Event Cards Grid */}
      {filteredEvents.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-[#e5e2d6] text-center shadow-xs space-y-4 max-w-lg mx-auto my-8">
          <div className="w-16 h-16 rounded-3xl bg-[#fef3f0] text-[#e65c36] flex items-center justify-center mx-auto shadow-inner">
            <Heart className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-[#19231e]">No saved events found</h3>
            <p className="text-xs text-[#6b7870] mt-1 max-w-sm mx-auto leading-relaxed">
              {searchQuery || selectedCategory !== 'All'
                ? 'No bookmarks match your current filter. Try adjusting your search query or category.'
                : 'You haven’t saved any events yet. Explore upcoming campus hackathons, workshops, and career fairs to bookmark them for later.'}
            </p>
          </div>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              if (savedEvents.length === 0) navigate('/events');
            }}
            className="px-5 py-2.5 bg-[#112b20] hover:bg-[#1a4030] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            {savedEvents.length === 0 ? 'Explore Campus Events' : 'Reset Filters'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((ev) => {
            const pctFilled = Math.min(100, Math.round((ev.registeredCount / ev.capacity) * 100));

            return (
              <div
                key={ev.id}
                className="bg-white rounded-2xl border border-[#e5e2d6] hover:border-[#dedbd0] shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all overflow-hidden flex flex-col justify-between group"
              >
                {/* Image Header with Badges */}
                <div className="relative h-44 w-full bg-[#1b3d2f] overflow-hidden">
                  <img
                    src={ev.imageUrl}
                    alt={ev.title}
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as any).src =
                        'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=600&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent"></div>

                  {/* Top Badges Row */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#112b20]/90 text-[#d8fa57] border border-[#d8fa57]/30 shadow-xs">
                      {ev.category}
                    </span>

                    {/* Remove from Saved Quick Heart Button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveFromSaved(ev.id, ev.title)}
                      className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-rose-600 flex items-center justify-center transition-transform hover:scale-110 shadow-xs cursor-pointer"
                      title="Remove from saved events"
                    >
                      <Heart className="w-4 h-4 fill-[#e65c36] text-[#e65c36]" />
                    </button>
                  </div>

                  {/* Bottom Image Overlay: Match Score & Deadline Warning */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[11px] font-bold text-white">
                      <Sparkles className="w-3 h-3 text-[#d8fa57]" />
                      <span>{ev.matchScore}% Match</span>
                    </div>

                    {ev.deadlineWarning && (
                      <span className="px-2 py-0.5 rounded-md bg-[#e65c36] text-white text-[10px] font-bold shadow-xs flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>{ev.deadlineWarning}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Event Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    {/* Event Title */}
                    <h3 className="font-extrabold text-base text-[#19231e] tracking-tight line-clamp-2 leading-snug group-hover:text-[#e65c36] transition-colors">
                      {ev.title}
                    </h3>

                    {/* Organizer */}
                    <p className="text-xs text-[#526359] font-medium flex items-center gap-1 truncate">
                      <span>Hosted by</span>
                      <strong className="text-[#19231e] truncate">{ev.organizer}</strong>
                    </p>

                    {/* Date & Time */}
                    <div className="pt-2 border-t border-[#f0eee6] space-y-1.5 text-xs text-[#4a574f]">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-[#8ea79a] shrink-0" />
                        <span className="font-semibold text-[#19231e]">{ev.startDate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-[#8ea79a] shrink-0" />
                        <span>{ev.timeRange}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-[#8ea79a] shrink-0" />
                        <span className="truncate">
                          {ev.location} ({ev.room})
                        </span>
                      </div>
                    </div>

                    {/* Capacity Progress Bar */}
                    <div className="pt-2">
                      <div className="flex justify-between text-[11px] text-[#738278] mb-1 font-medium">
                        <span>
                          <strong className="text-[#19231e]">{ev.availableSeats}</strong> spots remaining
                        </span>
                        <span>{pctFilled}% filled</span>
                      </div>
                      <div className="w-full bg-[#eeebe2] rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            ev.availableSeats < 10 ? 'bg-[#e65c36]' : 'bg-[#112b20]'
                          }`}
                          style={{ width: `${pctFilled}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons: Register Button & Remove from Saved Button */}
                  <div className="pt-3 border-t border-[#eeebe2] space-y-2">
                    <div className="flex items-center gap-2">
                      {/* Register Button */}
                      {ev.isRegistered ? (
                        <div className="flex-1 py-2.5 bg-[#f4faee] text-[#1f6b45] border border-[#cbe9d4] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Registered & Confirmed</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRegister(ev)}
                          className="flex-1 py-2.5 bg-[#112b20] hover:bg-[#1a4030] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Ticket className="w-3.5 h-3.5 text-[#d8fa57]" />
                          <span>Register Now</span>
                        </button>
                      )}

                      {/* Remove from Saved Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveFromSaved(ev.id, ev.title)}
                        className="px-3 py-2.5 bg-[#fbf9f4] hover:bg-rose-50 text-[#738278] hover:text-rose-600 border border-[#dcd9ce] hover:border-rose-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                        title="Remove from saved events"
                      >
                        <Heart className="w-3.5 h-3.5 fill-[#e65c36] text-[#e65c36]" />
                        <span>Remove from Saved</span>
                      </button>

                      {/* Spotlight Details Link */}
                      <button
                        type="button"
                        onClick={() => navigate(`/events/${ev.id}`)}
                        className="w-9 h-9 rounded-xl bg-[#fbf9f4] hover:bg-[#ece8dc] text-[#344138] flex items-center justify-center border border-[#dcd9ce] transition-colors cursor-pointer shrink-0"
                        title="View event details"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#738278]">
                      <span>Deadline: {ev.registrationDeadline}</span>
                      <span className="font-semibold text-[#19231e]">{ev.price}</span>
                    </div>
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
