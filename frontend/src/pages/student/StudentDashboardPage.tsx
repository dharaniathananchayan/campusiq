import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { mockEvents, mockFeedbackList, mockCurrentStudent, mockAnnouncements } from '../../data/mockData';
import { eventsApi } from '../../api/events';
import { useAuthStore } from '../../store/useAuthStore';
import { PageLayout } from '../../components/layout/PageLayout';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EventCard } from '../../components/events/EventCard';
import { FeedbackModal } from '../../components/events/FeedbackModal';
import {
  GraduationCap,
  CalendarCheck,
  Bookmark,
  MessageSquare,
  Sparkles,
  Compass,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  Star,
  Megaphone,
  Pin,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'react-hot-toast';
import type { EventAnnouncement } from '../../types';

export const StudentDashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const student = (user as any) || mockCurrentStudent;

  const [activeTab, setActiveTab] = useState<'registrations' | 'bookmarks' | 'feedback'>('registrations');
  const [feedbackModalEvent, setFeedbackModalEvent] = useState<{ id: string; title: string } | null>(null);
  const [announcements, setAnnouncements] = useState<EventAnnouncement[]>(mockAnnouncements);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);

  useEffect(() => {
    setLoadingAnnouncements(true);
    eventsApi.getStudentAnnouncements().then((res) => {
      if (Array.isArray(res) && res.length > 0) {
        setAnnouncements(res);
      } else {
        setAnnouncements(mockAnnouncements);
      }
    }).catch(() => {
      setAnnouncements(mockAnnouncements);
    }).finally(() => setLoadingAnnouncements(false));
  }, []);

  const registeredEvents = mockEvents.filter((e) => e.is_registered);
  const bookmarkedEvents = mockEvents.filter((e) => e.is_bookmarked);

  const formatDate = (dateStr: string) => {
    try {
      const d = parseISO(dateStr);
      if (!isNaN(d.getTime())) return format(d, 'EEE, MMM d • h:mm a');
    } catch {}
    return dateStr;
  };

  return (
    <PageLayout withSidebar>
      <div className="space-y-8 text-left max-w-6xl mx-auto">
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-slate-200/80">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <span>Student Workspace</span>
              <span>•</span>
              <span className="text-slate-700">{student.department || 'Computer Science'}</span>
              <span>•</span>
              <span className="text-slate-700">Year {student.year_of_study || 3}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <GraduationCap className="w-6 h-6 text-blue-600" />
              Welcome back, {student.full_name || 'Alex Chen'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Manage your event registrations, check status timelines, and review past campus sessions.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link to="/student/ai/assistant">
              <Button variant="secondary" size="sm" leftIcon={<Sparkles className="w-3.5 h-3.5 text-purple-600" />}>
                Ask Campus AI
              </Button>
            </Link>
            <Link to="/events">
              <Button variant="primary" size="sm" leftIcon={<Compass className="w-3.5 h-3.5" />}>
                Browse Catalog
              </Button>
            </Link>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Registrations</span>
              <CalendarCheck className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 tabular-nums">{registeredEvents.length}</p>
            <p className="text-[11px] text-slate-400">Confirmed seats</p>
          </Card>

          <Card className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Bookmarked</span>
              <Bookmark className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 tabular-nums">{bookmarkedEvents.length}</p>
            <p className="text-[11px] text-slate-400">Saved for review</p>
          </Card>

          <Card className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Attended</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 tabular-nums">4</p>
            <p className="text-[11px] text-slate-400">Verified attendance</p>
          </Card>

          <Card className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Feedback Given</span>
              <MessageSquare className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 tabular-nums">{mockFeedbackList.length}</p>
            <p className="text-[11px] text-slate-400">Reviews submitted</p>
          </Card>
        </div>

        {/* Announcement Board for Registered Events */}
        <Card className="p-5 space-y-3 bg-white border-slate-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="space-y-0.5">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-purple-600" />
                Announcement Board • Your Registered Events
              </h3>
              <p className="text-xs text-slate-500">
                Official notices, room updates, and schedules broadcast by event organizers for sessions you are attending.
              </p>
            </div>
            <Badge variant="brand" size="sm">
              {announcements.length} Updates
            </Badge>
          </div>

          <div className="space-y-2.5">
            {loadingAnnouncements ? (
              <p className="text-xs text-slate-400 py-4 text-center">Loading announcements...</p>
            ) : announcements.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                No announcements posted yet for your registered events.
              </div>
            ) : (
              announcements.map((ann) => (
                <div
                  key={ann.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    ann.priority === 'urgent'
                      ? 'border-red-200 bg-red-50/40'
                      : ann.priority === 'important'
                      ? 'border-amber-200 bg-amber-50/30'
                      : 'border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                        {ann.event_title || 'Campus Event'}
                      </span>
                      <Badge
                        variant={
                          ann.priority === 'urgent'
                            ? 'warning'
                            : ann.priority === 'important'
                            ? 'brand'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {ann.priority.toUpperCase()}
                      </Badge>
                      {ann.is_pinned && (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-lime-700">
                          <Pin className="w-3 h-3" /> Pinned
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {format(parseISO(ann.created_at), 'MMM d, h:mm a')}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 mt-1">{ann.title}</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{ann.content}</p>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60 text-[11px] text-slate-400">
                    <span>Organizer: {ann.organizer_name || 'Event Lead'}</span>
                    <Link
                      to={`/events/${ann.event_id}`}
                      className="text-purple-600 font-semibold hover:underline"
                    >
                      View Event Spotlight →
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('registrations')}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'registrations'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>My Registrations & Status</span>
            <span className="px-1.5 py-0.2 bg-slate-100 rounded text-[10px] text-slate-600">
              {registeredEvents.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'bookmarks'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Saved Events</span>
            <span className="px-1.5 py-0.2 bg-slate-100 rounded text-[10px] text-slate-600">
              {bookmarkedEvents.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('feedback')}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'feedback'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Feedback History</span>
            <span className="px-1.5 py-0.2 bg-slate-100 rounded text-[10px] text-slate-600">
              {mockFeedbackList.length}
            </span>
          </button>
        </div>

        {/* Tab 1: Registrations with Registration Status Tracker */}
        {activeTab === 'registrations' && (
          <div className="space-y-4">
            {registeredEvents.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-slate-200 rounded-xl bg-white p-8 space-y-3">
                <CalendarCheck className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">No active registrations</p>
                <p className="text-xs text-slate-400">Explore the campus calendar and reserve your seat.</p>
                <Link to="/events">
                  <Button variant="secondary" size="sm">Browse Events</Button>
                </Link>
              </div>
            ) : (
              registeredEvents.map((event) => (
                <Card key={event.id} className="p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="success" size="sm">Confirmed Reservation</Badge>
                        <span className="text-xs text-slate-400">• Pass ID: CIQ-2026-{event.id.toUpperCase()}</span>
                      </div>
                      <Link
                        to={`/events/${event.id}`}
                        className="text-base font-bold text-slate-900 hover:text-blue-600 transition-colors"
                      >
                        {event.title}
                      </Link>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setFeedbackModalEvent({ id: event.id, title: event.title })}
                      >
                        Leave Feedback
                      </Button>
                      <Link to={`/events/${event.id}`}>
                        <Button variant="primary" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Metadata Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span className="tabular-nums">{formatDate(event.start_datetime)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{event.venue?.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <span>Organized by {event.organizer?.organization_name}</span>
                    </div>
                  </div>

                  {/* Registration Status Tracker Timeline */}
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Registration Status Tracker
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded-lg text-emerald-800 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <p className="font-semibold">Registered</p>
                          <p className="text-[10px] text-emerald-600">RSVP Received</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded-lg text-emerald-800 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <p className="font-semibold">Confirmed</p>
                          <p className="text-[10px] text-emerald-600">Seat Guaranteed</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg text-slate-500 font-medium">
                        <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                        <div>
                          <p className="font-semibold">Check-in</p>
                          <p className="text-[10px] text-slate-400">Scan at entrance</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Bookmarked Events */}
        {activeTab === 'bookmarks' && (
          <div>
            {bookmarkedEvents.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-slate-200 rounded-xl bg-white p-8 space-y-3">
                <Bookmark className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">No saved bookmarks</p>
                <p className="text-xs text-slate-400">Click the bookmark icon on any event to save it here.</p>
                <Link to="/events">
                  <Button variant="secondary" size="sm">Explore Events</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {bookmarkedEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Feedback History */}
        {activeTab === 'feedback' && (
          <div className="space-y-4">
            <div className="p-4 bg-white border border-slate-200/80 rounded-xl space-y-1">
              <h3 className="text-sm font-semibold text-slate-900">Your Submitted Feedback</h3>
              <p className="text-xs text-slate-500">Reviews and ratings you've shared to help campus organizers improve.</p>
            </div>

            <div className="space-y-3">
              {mockFeedbackList.map((fb) => (
                <Card key={fb.id} className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">
                        University AI Symposium: Frontiers in Generative Architecture
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">Submitted on {formatDate(fb.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-1 text-amber-400">
                      {Array.from({ length: fb.rating }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                    "{fb.comment}"
                  </p>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Feedback Modal */}
      {feedbackModalEvent && (
        <FeedbackModal
          isOpen={!!feedbackModalEvent}
          onClose={() => setFeedbackModalEvent(null)}
          eventId={feedbackModalEvent.id}
          eventTitle={feedbackModalEvent.title}
          onSubmitted={() => toast.success('Feedback recorded!')}
        />
      )}
    </PageLayout>
  );
};
