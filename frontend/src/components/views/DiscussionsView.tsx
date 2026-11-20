import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Search,
  Send,
  Calendar,
  MapPin,
  ExternalLink,
  Users,
  Sparkles,
  CheckCircle2,
  ThumbsUp,
  HelpCircle,
  Tag,
  Filter,
  Flame,
  ArrowRight,
  Pin,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../../store/useAuthStore';
import { mockEvents } from '../../data/mockData';
import { Event } from '../../types';
import { eventsApi } from '../../api/events';
import {
  ForumThreadMessage,
  getStoredForumStore,
  saveForumMessage,
  toggleLikeForumMessage,
  syncBackendMessages,
  getSelectedDiscussionEvent,
  saveSelectedDiscussionEvent,
  DEFAULT_DISCUSSIONS,
} from '../../utils/forumStorage';

interface DiscussionsViewProps {
  role?: 'student' | 'organizer';
}

export const DiscussionsView: React.FC<DiscussionsViewProps> = ({ role = 'student' }) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Combine mockEvents with any saved/created events
  const [eventsList, setEventsList] = useState<Event[]>(() => {
    try {
      const local = localStorage.getItem('campusiq_created_events');
      if (local) {
        const parsed = JSON.parse(local);
        return [...parsed, ...mockEvents];
      }
    } catch {}
    return mockEvents;
  });

  const [selectedEventId, setSelectedEventId] = useState<string>(() => {
    return getSelectedDiscussionEvent();
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [forumStore, setForumStore] = useState<Record<string, ForumThreadMessage[]>>(() => {
    return getStoredForumStore();
  });

  const [inputMessage, setInputMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Keep selected event persistent across browser refreshes
  useEffect(() => {
    saveSelectedDiscussionEvent(selectedEventId);
  }, [selectedEventId]);

  // Listen for real-time forum updates (e.g. from EventSpotlight or moderation)
  useEffect(() => {
    const handleUpdate = () => {
      setForumStore(getStoredForumStore());
    };
    window.addEventListener('campusiq-forum-updated', handleUpdate);
    return () => window.removeEventListener('campusiq-forum-updated', handleUpdate);
  }, []);

  // Selected event object
  const selectedEvent = useMemo(() => {
    return (
      eventsList.find((e) => e.id === selectedEventId) ||
      eventsList[0] ||
      mockEvents[0]
    );
  }, [eventsList, selectedEventId]);

  // Attempt background sync with backend API if available
  useEffect(() => {
    if (!selectedEvent?.id) return;
    eventsApi
      .getForumMessages(selectedEvent.id)
      .then((res) => {
        if (Array.isArray(res) && res.length > 0) {
          const synced = syncBackendMessages(selectedEvent.id, res);
          setForumStore((prev) => ({ ...prev, [selectedEvent.id]: synced }));
        }
      })
      .catch(() => {});
  }, [selectedEvent?.id]);

  // Current messages for selected event
  const currentMessages = useMemo(() => {
    return (
      forumStore[selectedEvent.id] ||
      DEFAULT_DISCUSSIONS[selectedEvent.id] || [
        {
          id: `welcome-${selectedEvent.id}`,
          event_id: selectedEvent.id,
          user_id: 'system',
          user_name: selectedEvent.organizer?.organization_name || 'Event Host',
          user_role: 'organizer',
          message: `👋 Welcome to the discussion forum for "${selectedEvent.title}"! Ask any questions or connect with fellow participants below.`,
          created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          likes: 3,
          isPinned: true,
        },
      ]
    );
  }, [forumStore, selectedEvent]);

  // Filtered list of events
  const filteredEvents = useMemo(() => {
    return eventsList.filter((event) => {
      const matchesSearch =
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
        event.venue?.name?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat =
        categoryFilter === 'all'
          ? true
          : categoryFilter === 'registered'
          ? event.is_registered
          : event.category?.name?.toLowerCase().includes(categoryFilter.toLowerCase());

      return matchesSearch && matchesCat;
    });
  }, [eventsList, searchQuery, categoryFilter]);

  // Auto scroll to bottom of chat when new message is added or event changed
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedEventId, currentMessages.length]);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim()) return;

    setIsSubmitting(true);
    const text = inputMessage.trim();
    const newMsg: ForumThreadMessage = {
      id: `msg-${Date.now()}`,
      event_id: selectedEvent.id,
      user_id: user?.id || 'current-user',
      user_name: user?.full_name || (role === 'organizer' ? 'Event Organizer' : 'Campus Student'),
      user_role: role === 'organizer' ? 'organizer' : 'student',
      message: text,
      created_at: new Date().toISOString(),
      likes: 0,
      isLiked: false,
    };

    // 1. Immediately persist to localStorage
    const updatedList = saveForumMessage(selectedEvent.id, newMsg);
    setForumStore((prev) => ({
      ...prev,
      [selectedEvent.id]: updatedList,
    }));

    setInputMessage('');
    setIsSubmitting(false);
    toast.success('Question posted to forum!');

    // 2. Background sync to backend API
    try {
      eventsApi.postForumMessage(selectedEvent.id, text).catch(() => {});
    } catch {}
  };

  const handleToggleLike = (msgId: string) => {
    const updated = toggleLikeForumMessage(selectedEvent.id, msgId);
    setForumStore((prev) => ({ ...prev, [selectedEvent.id]: updated }));
  };

  const quickStarters = [
    'Will session slides & recordings be shared?',
    'What are the software or tool prerequisites?',
    'Where is the exact venue check-in desk?',
    'Is there a team formation Discord or Slack channel?',
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header Strip */}
      <div className="bg-[#112b20] text-white rounded-2xl p-6 sm:p-7 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-80 h-full bg-radial from-[#1e4a37] to-transparent opacity-60 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#1b4333] border border-[#2b614b] text-[#d8fa57] text-xs font-bold uppercase tracking-wider">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Campus Discussions Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Event Discussion Forums
            </h1>
            <p className="text-xs sm:text-sm text-[#a3b8ad] max-w-2xl leading-relaxed">
              Connect directly with event organizers, keynote speakers, and fellow students. Select any event from the list to join or view its live attendee discussion board.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-[#1b4333]/90 border border-[#2b614b] px-3.5 py-2 rounded-xl text-center">
              <span className="text-[10px] uppercase font-bold text-[#a3b8ad] block">Active Forums</span>
              <span className="text-lg font-mono font-extrabold text-[#d8fa57] block">{eventsList.length}</span>
            </div>
            <div className="bg-[#1b4333]/90 border border-[#2b614b] px-3.5 py-2 rounded-xl text-center">
              <span className="text-[10px] uppercase font-bold text-[#a3b8ad] block">Role Mode</span>
              <span className="text-xs font-bold text-white uppercase tracking-wider block mt-1">
                {role === 'organizer' ? 'Organizer' : 'Student'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Master-Detail 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================= LEFT COLUMN: EVENT PICKER (4.5 COLS) ================= */}
        <div className="lg:col-span-4 xl:col-span-4 bg-white rounded-2xl border border-[#e5e1d5] shadow-xs flex flex-col overflow-hidden max-h-[820px]">
          {/* List Search & Filter Header */}
          <div className="p-4 border-b border-[#ece8dc] space-y-3 bg-[#fdfcf9]">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#11241c] flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#e65c36]" />
                <span>Select Event Forum</span>
              </h2>
              <span className="text-[11px] font-bold text-[#708075] bg-[#eeebd9] px-2 py-0.5 rounded-md">
                {filteredEvents.length} events
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search event discussions..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-[#dedbd4] rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#112b20]/20 focus:border-[#112b20]"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
              {[
                { id: 'all', label: 'All' },
                { id: 'registered', label: 'Registered' },
                { id: 'tech', label: 'Tech' },
                { id: 'business', label: 'Business' },
                { id: 'design', label: 'Design' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setCategoryFilter(pill.id)}
                  className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-all cursor-pointer ${
                    categoryFilter === pill.id
                      ? 'bg-[#112b20] text-[#d8fa57]'
                      : 'bg-[#f4f2ea] text-[#55695f] hover:bg-[#eae6da]'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* Event Cards Scrollable List */}
          <div className="divide-y divide-[#ece8dc] overflow-y-auto flex-1">
            {filteredEvents.length === 0 ? (
              <div className="p-8 text-center text-[#708075] space-y-2">
                <HelpCircle className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-semibold">No event discussions matched your search</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setCategoryFilter('all');
                  }}
                  className="text-xs text-[#e65c36] font-bold hover:underline"
                >
                  Reset filters
                </button>
              </div>
            ) : (
              filteredEvents.map((evt) => {
                const isSelected = evt.id === selectedEvent.id;
                const msgsCount = (forumStore[evt.id] || []).length;
                const eventDate = evt.start_datetime
                  ? new Date(evt.start_datetime).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'Upcoming';

                return (
                  <button
                    key={evt.id}
                    type="button"
                    onClick={() => setSelectedEventId(evt.id)}
                    className={`w-full text-left p-3.5 transition-all flex items-start gap-3 cursor-pointer group ${
                      isSelected
                        ? 'bg-[#f0f7f3] border-l-4 border-l-[#112b20]'
                        : 'hover:bg-[#fcfbf7]'
                    }`}
                  >
                    {/* Event Mini Icon or Badge */}
                    <div
                      className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center font-bold text-xs shadow-2xs transition-colors ${
                        isSelected
                          ? 'bg-[#112b20] text-[#d8fa57]'
                          : 'bg-[#ece8dc] text-[#55695f] group-hover:bg-[#dfdbcc]'
                      }`}
                    >
                      <MessageSquare className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#738278] truncate">
                          {evt.category?.name || 'Campus Event'}
                        </span>
                        <span className="text-[10px] font-mono text-[#8c9c91] shrink-0 font-medium">
                          {eventDate}
                        </span>
                      </div>

                      <h3
                        className={`text-xs font-bold leading-snug line-clamp-2 mt-0.5 ${
                          isSelected ? 'text-[#11241c] font-extrabold' : 'text-slate-800'
                        }`}
                      >
                        {evt.title}
                      </h3>

                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-[#e8e4d8]/60 text-[10px]">
                        <span className="text-[#55695f] flex items-center gap-1 truncate max-w-[150px]">
                          <Building className="w-3 h-3 text-[#8c9c91] shrink-0" />
                          <span className="truncate">{evt.venue?.name || 'Campus Hall'}</span>
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded-full font-bold font-mono text-[10px] ${
                            isSelected
                              ? 'bg-[#112b20] text-white'
                              : 'bg-[#eeebd9] text-[#55695f]'
                          }`}
                        >
                          {msgsCount} {msgsCount === 1 ? 'post' : 'posts'}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ================= RIGHT COLUMN: FORUM CONVERSATION THREAD (8 COLS) ================= */}
        <div className="lg:col-span-8 xl:col-span-8 bg-white rounded-2xl border border-[#e5e1d5] shadow-xs flex flex-col h-[820px] overflow-hidden">
          {/* Forum Thread Header */}
          <div className="p-4 sm:p-5 border-b border-[#ece8dc] bg-[#fdfcf9] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded bg-[#112b20] text-[#d8fa57] text-[10px] font-bold uppercase tracking-wider font-mono">
                  {selectedEvent.category?.name || 'Campus Discussion'}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  Live Discussion Active
                </span>
              </div>

              <h2 className="text-base sm:text-lg font-extrabold text-[#11241c] leading-snug truncate">
                {selectedEvent.title}
              </h2>

              <div className="flex items-center gap-3 text-xs text-[#738278] flex-wrap pt-0.5">
                <span className="flex items-center gap-1 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-[#e65c36]" />
                  {selectedEvent.start_datetime
                    ? new Date(selectedEvent.start_datetime).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })
                    : 'Upcoming date'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-[#8c9c91]" />
                  {selectedEvent.venue?.name || 'Main Campus'}
                </span>
              </div>
            </div>

            {/* Direct Action Link to Event Detail Page */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => navigate(`/events/${selectedEvent.id}`)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#dedbd4] text-[#11241c] hover:bg-[#f4f2ea] text-xs font-bold transition-all shadow-2xs cursor-pointer"
                title="View full event page"
              >
                <span>Event Page</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#e65c36]" />
              </button>
            </div>
          </div>

          {/* Forum Messages Thread Stream */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-[#fbf9f4]/60">
            {currentMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#eeebd9] flex items-center justify-center text-[#55695f]">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-[#11241c]">No discussion posts yet</h3>
                <p className="text-xs text-[#708075] max-w-sm">
                  Be the first to ask a question, request team members, or start the conversation with the organizers.
                </p>
              </div>
            ) : (
              currentMessages.map((msg) => {
                const isOrg = msg.user_role === 'organizer';
                const isMe = user?.id ? msg.user_id === user.id : false;

                return (
                  <div
                    key={msg.id}
                    className={`rounded-2xl p-4 transition-all border ${
                      msg.isPinned
                        ? 'bg-[#fef9f0] border-amber-300/80 shadow-xs ring-1 ring-amber-200'
                        : isOrg
                        ? 'bg-[#ffffff] border-[#dedbd4] shadow-xs'
                        : 'bg-white border-[#e5e1d5] shadow-2xs'
                    }`}
                  >
                    {/* Message Header */}
                    <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-black/5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            isOrg
                              ? 'bg-[#e65c36] text-white'
                              : 'bg-[#112b20] text-[#d8fa57]'
                          }`}
                        >
                          {(msg.user_name || 'U').charAt(0).toUpperCase()}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#11241c]">
                              {msg.user_name || 'Attendee'}
                            </span>

                            {isOrg && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider bg-[#fdf0ec] text-[#e65c36] border border-[#f5c6b9] flex items-center gap-0.5">
                                <ShieldCheck className="w-2.5 h-2.5" />
                                <span>Organizer</span>
                              </span>
                            )}

                            {msg.isPinned && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-0.5">
                                <Pin className="w-2.5 h-2.5" />
                                <span>Pinned</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <time className="text-[10px] font-mono text-[#8c9c91]">
                        {msg.created_at
                          ? new Date(msg.created_at).toLocaleTimeString([], {
                              hour: 'numeric',
                              minute: '2-digit',
                            })
                          : 'Just now'}
                      </time>
                    </div>

                    {/* Message Text */}
                    <p className="text-xs sm:text-[13px] text-slate-800 leading-relaxed whitespace-pre-wrap">
                      {msg.message}
                    </p>

                    {/* Message Footer: Likes & Reactions */}
                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-black/5 text-[11px]">
                      <button
                        type="button"
                        onClick={() => handleToggleLike(msg.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                          msg.isLiked
                            ? 'bg-[#eaf6ed] text-[#1c6b45] font-bold'
                            : 'hover:bg-[#f4f2ea] text-[#63796d]'
                        }`}
                      >
                        <ThumbsUp className="w-3 h-3" />
                        <span>{msg.likes || 0} Helpful</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setInputMessage(`@${msg.user_name} `)}
                        className="text-[#e65c36] hover:underline font-bold text-[11px] cursor-pointer"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Carousel */}
          <div className="px-4 py-2 bg-[#fdfcf9] border-t border-[#ece8dc] flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8c9c91] shrink-0 mr-1">
              Ask Quick:
            </span>
            {quickStarters.map((starter, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setInputMessage(starter)}
                className="px-2.5 py-1 rounded-full bg-white border border-[#dedbd4] text-[#55695f] hover:border-[#112b20] hover:text-[#112b20] text-[10px] font-medium shrink-0 transition-colors cursor-pointer"
              >
                {starter}
              </button>
            ))}
          </div>

          {/* Forum Reply Input Bar */}
          <form
            onSubmit={handleSendMessage}
            className="p-3.5 sm:p-4 bg-white border-t border-[#ece8dc] flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={`Ask a question or contribute to "${selectedEvent.title}"...`}
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#dedbd4] text-xs sm:text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#112b20]/20 focus:border-[#112b20]"
            />

            <button
              type="submit"
              disabled={isSubmitting || !inputMessage.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#112b20] hover:bg-[#1a4030] disabled:opacity-50 text-white font-bold text-xs transition-all shadow-xs shrink-0 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-[#d8fa57]" />
              <span className="hidden sm:inline">Post</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
