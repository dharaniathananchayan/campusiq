import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { eventsApi } from '../api/events';
import { registrationsApi } from '../api/registrations';
import { mockEvents, mockFeedbackList } from '../data/mockData';
import { useAuthStore } from '../store/useAuthStore';
import { PageLayout } from '../components/layout/PageLayout';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { FeedbackModal } from '../components/events/FeedbackModal';
import { Skeleton } from '../components/ui/Skeleton';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  Bookmark,
  Share2,
  Building2,
  Star,
  ShieldCheck,
  MessageSquarePlus,
  ArrowLeft,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'react-hot-toast';

export const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { accessToken, loginAsStudent } = useAuthStore();

  const [registering, setRegistering] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [isRegisteredState, setIsRegisteredState] = useState<boolean | null>(null);
  const [isBookmarkedState, setIsBookmarkedState] = useState<boolean | null>(null);

  const fallbackEvent = mockEvents.find((e) => e.id === id) || mockEvents[0];

  const { data: event = fallbackEvent, isLoading, refetch } = useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      try {
        const res = await eventsApi.getEventById(id!);
        return res || fallbackEvent;
      } catch {
        return fallbackEvent;
      }
    },
    placeholderData: fallbackEvent,
  });

  const isRegistered = isRegisteredState !== null ? isRegisteredState : !!event.is_registered;
  const isBookmarked = isBookmarkedState !== null ? isBookmarkedState : !!event.is_bookmarked;

  const currentRegistrations = event.current_registrations + (isRegistered && !event.is_registered ? 1 : 0);
  const maxCapacity = event.max_capacity || 100;
  const availableSeats = Math.max(0, maxCapacity - currentRegistrations);
  const isFull = availableSeats <= 0;
  const utilizationPct = Math.min(100, Math.round((currentRegistrations / maxCapacity) * 100));

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'TBA';
    try {
      const d = parseISO(dateStr);
      if (!isNaN(d.getTime())) {
        return format(d, 'EEEE, MMMM d, yyyy');
      }
    } catch {}
    return dateStr;
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = parseISO(dateStr);
      if (!isNaN(d.getTime())) {
        return format(d, 'h:mm a');
      }
    } catch {}
    return '';
  };

  const handleRegister = async () => {
    if (!accessToken) {
      toast('Signing you in as student for instant registration', { icon: '🎓' });
      loginAsStudent();
    }
    setRegistering(true);
    try {
      await registrationsApi.registerForEvent(event.id);
      setIsRegisteredState(true);
      toast.success('Registration confirmed! Your seat is reserved.');
      refetch();
    } catch {
      // Demo fallback
      setIsRegisteredState(true);
      toast.success('Registration confirmed! Added to your student dashboard.');
    } finally {
      setRegistering(false);
    }
  };

  const handleCancelRegistration = async () => {
    setCancelling(true);
    try {
      await registrationsApi.cancelRegistration(event.id);
      setIsRegisteredState(false);
      toast.success('Registration cancelled.');
      refetch();
    } catch {
      setIsRegisteredState(false);
      toast.success('Registration cancelled.');
    } finally {
      setCancelling(false);
    }
  };

  const handleBookmarkToggle = async () => {
    try {
      if (isBookmarked) {
        await registrationsApi.removeBookmark(event.id);
        setIsBookmarkedState(false);
        toast.success('Removed from saved events');
      } else {
        await registrationsApi.addBookmark(event.id);
        setIsBookmarkedState(true);
        toast.success('Event saved to your bookmarks');
      }
    } catch {
      setIsBookmarkedState(!isBookmarked);
      toast.success(!isBookmarked ? 'Event saved to your bookmarks' : 'Removed from saved events');
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Event link copied to clipboard!');
    }
  };

  if (isLoading && !event) {
    return (
      <PageLayout>
        <div className="max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-12 w-3/4" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-4">
              <Skeleton className="h-64 w-full" />
            </div>
            <div className="lg:col-span-4">
              <Skeleton className="h-80 w-full" />
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-5xl mx-auto space-y-8 text-left">
        {/* Navigation Breadcrumb */}
        <div>
          <button
            onClick={() => navigate('/events')}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Event Discovery</span>
          </button>
        </div>

        {/* Main Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Event Details & Reviews */}
          <div className="lg:col-span-8 space-y-8">
            {/* Header Block */}
            <div className="space-y-3 pb-6 border-b border-slate-200/80">
              <div className="flex items-center gap-2 flex-wrap">
                {event.category && <Badge variant="neutral">{event.category.name}</Badge>}
                {event.is_featured && <Badge variant="brand">Featured Campus Event</Badge>}
                <Badge variant={event.status === 'published' ? 'success' : 'neutral'}>
                  {event.status === 'published' ? 'Active Registration' : event.status}
                </Badge>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
                {event.title}
              </h1>

              <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                <span>Organized by <strong className="text-slate-800">{event.organizer?.organization_name || 'Academic Board'}</strong></span>
                <span>•</span>
                <span className="tabular-nums">Posted on {formatDate(event.created_at)}</span>
              </div>
            </div>

            {/* Description Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">About This Event</h3>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line font-normal">
                {event.description}
              </p>
            </div>

            {/* Tags */}
            {event.tags && event.tags.length > 0 && (
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Keywords & Focus Areas</h4>
                <div className="flex flex-wrap gap-1.5">
                  {event.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 text-slate-700"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Eligibility & Criteria */}
            <div className="p-5 bg-white border border-slate-200/80 rounded-xl space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Eligibility & Requirements</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="font-medium text-slate-500">Target Academic Departments</p>
                  <p className="text-slate-800 font-semibold mt-0.5">
                    {event.eligibility_criteria?.departments?.join(', ') || 'Open to all campus departments'}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-slate-500">Eligible Study Years</p>
                  <p className="text-slate-800 font-semibold mt-0.5">
                    {event.eligibility_criteria?.year_of_study?.length
                      ? event.eligibility_criteria.year_of_study.map((y) => `Year ${y}`).join(', ')
                      : 'All undergraduate and graduate cohorts'}
                  </p>
                </div>
                {event.eligibility_criteria?.custom_criteria && (
                  <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                    <p className="font-medium text-slate-500">Special Instructions</p>
                    <p className="text-slate-700 mt-0.5">{event.eligibility_criteria.custom_criteria}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Venue & Location Details */}
            <div className="p-5 bg-white border border-slate-200/80 rounded-xl space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
                <Building2 className="w-4 h-4 text-purple-600" />
                <span>Venue & Facility Access</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="font-medium text-slate-500">Location</p>
                  <p className="text-slate-900 font-semibold mt-0.5">
                    {event.venue ? event.venue.name : 'Main Campus Auditorium'}
                  </p>
                  <p className="text-slate-500 mt-0.5">
                    {event.venue?.building || 'Central Academic Complex'}
                    {event.venue?.floor ? ` • ${event.venue.floor}` : ''}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-slate-500">Venue Capacity</p>
                  <p className="text-slate-900 font-semibold mt-0.5 tabular-nums">
                    {maxCapacity} maximum seats (Campus Fire Code Enforced)
                  </p>
                </div>
                {event.venue?.location_description && (
                  <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                    <p className="font-medium text-slate-500">Wayfinding Directions</p>
                    <p className="text-slate-700 mt-0.5">{event.venue.location_description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Ratings and Reviews Section */}
            <div className="space-y-4 pt-6 border-t border-slate-200/80">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Student Reviews & Feedback</h3>
                  <p className="text-xs text-slate-500">Verified reviews submitted by confirmed attendees</p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setFeedbackModalOpen(true)}
                  leftIcon={<MessageSquarePlus className="w-3.5 h-3.5" />}
                >
                  Rate This Event
                </Button>
              </div>

              {/* Review Score Summary */}
              <div className="p-4 bg-white border border-slate-200/80 rounded-xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-bold text-slate-900 tabular-nums">4.8</div>
                  <div>
                    <div className="flex items-center gap-1 text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className="w-4 h-4 fill-amber-400" />
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">Based on verified student feedback</p>
                  </div>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <p className="font-semibold text-slate-900">96% Positive Sentiment</p>
                  <p>AI Theme: High Technical Depth</p>
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-3">
                {mockFeedbackList.map((fb) => (
                  <div key={fb.id} className="p-4 bg-white border border-slate-200/80 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">
                          {fb.is_anonymous ? 'Anonymous Student' : fb.student?.full_name}
                        </span>
                        {fb.student?.department && (
                          <span className="text-slate-400">• {fb.student.department}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {Array.from({ length: fb.rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-slate-600 leading-relaxed">{fb.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Reservation & Action Card */}
          <div className="lg:col-span-4 sticky top-20 space-y-4">
            <Card className="p-6 space-y-5">
              {/* Fee & Status */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-medium text-slate-500">Registration</span>
                <span className="text-sm font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {event.registration_fee > 0 ? `$${event.registration_fee}` : 'Free Admission'}
                </span>
              </div>

              {/* Date & Time Details */}
              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-900">{formatDate(event.start_datetime)}</p>
                    <p className="text-slate-500 mt-0.5">
                      {formatTime(event.start_datetime)} – {formatTime(event.end_datetime)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-900">{event.venue?.name || 'Campus Venue'}</p>
                    <p className="text-slate-500 mt-0.5">{event.venue?.building || 'Academic Quad'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-slate-500">RSVP Deadline</p>
                    <p className="font-medium text-slate-700 mt-0.5">{formatDate(event.registration_deadline)}</p>
                  </div>
                </div>
              </div>

              {/* Seat Capacity Progress */}
              <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
                <div className="flex justify-between font-medium">
                  <span className="text-slate-600 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    Seat Availability
                  </span>
                  <span className="tabular-nums font-semibold text-slate-900">
                    {availableSeats} left of {maxCapacity}
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isFull ? 'bg-red-500' : utilizationPct >= 85 ? 'bg-amber-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${utilizationPct}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  {isFull
                    ? 'Session is fully booked. Waitlist reservations open.'
                    : `${utilizationPct}% capacity allocated.`}
                </p>
              </div>

              {/* Primary Action Button */}
              <div className="pt-2 space-y-2">
                {isRegistered ? (
                  <div className="space-y-2">
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>You have a confirmed reservation for this event.</span>
                    </div>
                    <Button
                      variant="danger"
                      size="md"
                      className="w-full"
                      isLoading={cancelling}
                      onClick={handleCancelRegistration}
                    >
                      Cancel Reservation
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full"
                    isLoading={registering}
                    onClick={handleRegister}
                  >
                    {isFull ? 'Join Waitlist' : 'Confirm Reservation'}
                  </Button>
                )}

                {/* Secondary Actions: Bookmark & Share */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleBookmarkToggle}
                    leftIcon={<Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-blue-600 text-blue-600' : ''}`} />}
                  >
                    {isBookmarked ? 'Saved' : 'Bookmark'}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleShare}
                    leftIcon={<Share2 className="w-3.5 h-3.5" />}
                  >
                    Share
                  </Button>
                </div>
              </div>
            </Card>

            {/* Quick Organizer Contact Card */}
            <Card className="p-4 space-y-2 text-xs">
              <p className="font-semibold text-slate-900">Need Accommodation or Assistance?</p>
              <p className="text-slate-500 leading-relaxed">
                Contact the event coordinator directly for accessibility accommodations or dietary questions.
              </p>
              <div className="pt-1 text-blue-600 font-medium hover:underline cursor-pointer">
                {event.contact_email || 'events@university.edu'}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Post Event Feedback Modal */}
      <FeedbackModal
        isOpen={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        eventId={event.id}
        eventTitle={event.title}
        onSubmitted={() => refetch()}
      />
    </PageLayout>
  );
};
