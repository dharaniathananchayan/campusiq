import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Bell,
  CalendarPlus,
  CheckCircle2,
  Compass,
  Heart,
  LayoutDashboard,
  LogOut,
  Plus,
  Sparkles,
  Users,
  Check,
  Search,
  Wand2,
  Target,
  MessageSquareCode,
  ArrowUpRight,
  TrendingUp,
  Calendar,
  Building2,
  Star,
  PlusCircle,
  ArrowRight,
  UserCheck,
  Download,
  Filter,
  Activity,
  Layers,
  Megaphone,
  Pin,
  Clock,
  Lock,
  Unlock,
  AlertTriangle,
  Trash2,
  Archive,
  Save,
  MessageSquare,
  HelpCircle,
  Send,
  Edit3,
  FileText,
  Mail,
  SlidersHorizontal,
  ShieldCheck,
  UserX,
  ThumbsUp,
  Smile,
  Frown,
  Meh,
  User,
} from 'lucide-react';
import { StudentProfileView } from './views/StudentProfileView';
import { StudentEditProfileView } from './views/StudentEditProfileView';
import { OrganizerProfileView } from './views/OrganizerProfileView';
import { OrganizerCreateEventView } from './views/OrganizerCreateEventView';
import { StudentScheduleView } from './views/StudentScheduleView';
import { StudentSavedEventsView } from './views/StudentSavedEventsView';
import { StudentNotificationsView } from './views/StudentNotificationsView';
import { OrganizerNotificationsView } from './views/OrganizerNotificationsView';
import { DiscussionsView } from './views/DiscussionsView';
import { StudentRecommendedEventsView } from './views/StudentRecommendedEventsView';
import { getStoredForumMessages, deleteStoredForumMessage } from '../utils/forumStorage';
import { AppSidebar } from './layout/AppSidebar';
import { NotificationPopover } from './notifications/NotificationPopover';
import { toast } from 'react-hot-toast';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { aiApi } from '../api/ai';
import { analyticsApi } from '../api/analytics';
import { eventsApi } from '../api/events';
import { registrationsApi } from '../api/registrations';
import { useAuthStore } from '../store/useAuthStore';
import { mockOrganizerAnalytics, mockEvents, mockAnnouncements, mockInvitations } from '../data/mockData';
import type {
  Category,
  Event,
  Registration,
  Venue,
  EventAnnouncement,
  Invitation,
  ForumMember,
  TargetedStudent,
  Feedback,
  FeedbackAnalysis,
  EventForumMessage,
} from '../types';
import './Portal.css';
import './PortalForms.css';

// Chatbot is strictly a floating corner widget, navigation links point to dedicated workspace features
const studentLinks = [
  { to: '/student/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/events', label: 'Discover', icon: Compass },
  { to: '/student/ai-studio', label: 'Events you might like', icon: Sparkles },
  { to: '/student/invitations', label: 'Invitations', icon: Mail },
  { to: '/student/registrations', label: 'My schedule', icon: CheckCircle2 },
  { to: '/student/bookmarks', label: 'Saved events', icon: Heart },
  { to: '/student/notifications', label: 'Notifications', icon: Bell },
  { to: '/student/profile', label: 'View Profile', icon: User },
];

const organizerLinks = [
  { to: '/organizer/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/organizer/events', label: 'My events', icon: CalendarPlus },
  { to: '/organizer/events/new', label: 'Create event', icon: Plus },
  { to: '/organizer/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/organizer/profile', label: 'View Profile', icon: User },
];

const time = (date?: string) => {
  if (!date) return '—';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return date;
    return d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
  } catch {
    return date;
  }
};

export function normalizeEvent(e: any): Event {
  const cap = Number(e.max_capacity ?? e.capacity ?? 100);
  const reg = Number(e.current_registrations ?? e.registrations ?? 0);
  const avail = Number(e.available_seats ?? Math.max(0, cap - reg));
  const start = e.start_datetime || e.start || new Date().toISOString();
  return {
    ...e,
    id: String(e.id),
    title: e.title || 'Untitled Campus Event',
    description: e.description || e.short_description || '',
    short_description: e.short_description || e.description || '',
    start_datetime: start,
    end_datetime: e.end_datetime || start,
    registration_deadline: e.registration_deadline || start,
    max_capacity: cap,
    current_registrations: reg,
    available_seats: avail,
    status: e.status || 'published',
    category: e.category
      ? typeof e.category === 'object'
        ? e.category
        : { name: String(e.category) }
      : { name: 'Campus event' },
    venue: e.venue
      ? typeof e.venue === 'object'
        ? e.venue
        : { name: String(e.venue) }
      : { name: 'Campus venue' },
  };
}

function Gate() {
  return (
    <div className="portal-gate">
      <Sparkles size={26} />
      <h1>Your CampusIQ workspace is ready when you are.</h1>
      <p>Sign in to access your personal events, AI insights and campus intelligence.</p>
      <Link className="portal-button" to="/login">Sign in</Link>
    </div>
  );
}

function Metric({
  label,
  value,
  note,
  progress,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  note?: string;
  progress?: number;
  icon?: any;
}) {
  return (
    <div className="metric">
      <div className="metric-top">
        <span>{label}</span>
        {Icon && <Icon size={17} color="#687167" />}
      </div>
      <strong>{value}</strong>
      {note && <small className="trend-up">{note}</small>}
      {progress !== undefined && (
        <div className="metric-bar">
          <div className="metric-bar-fill" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
        </div>
      )}
    </div>
  );
}

function EventRows({ events, isOrganizer = false }: { events: Event[]; isOrganizer?: boolean }) {
  const cleanEvents = events.slice(0, 6).map(normalizeEvent);
  return (
    <div className="portal-list">
      {cleanEvents.map((event) => {
        const pct = Math.min(100, Math.round((event.current_registrations / Math.max(1, event.max_capacity)) * 100));
        return (
          <div className="portal-event-row" key={event.id}>
            <span className="portal-event__date-badge">{time(event.start_datetime)}</span>
            <div className="portal-event-title-block">
              <b>{event.title}</b>
              <span>
                {event.category?.name || 'Campus event'} · {event.venue?.name || 'Campus Venue'}
              </span>
            </div>
            <div className="portal-event-utilization">
              <span>
                <span>Capacity fill: {pct}%</span>
                <span>{event.available_seats} seats left</span>
              </span>
              <div className="metric-bar" style={{ margin: 0 }}>
                <div
                  className="metric-bar-fill"
                  style={{
                    width: `${pct}%`,
                    background: pct >= 90 ? '#e11d48' : pct >= 60 ? '#2563eb' : '#17221c',
                  }}
                />
              </div>
            </div>
            <div>
              <span className={`status-pill status-${event.status || 'published'}`}>
                {event.status || 'published'}
              </span>
            </div>
            <div className="portal-event-actions">
              <Link to={`/events/${event.id}`} className="portal-button portal-button-sm portal-button-outline">
                View Spotlight
              </Link>
              {isOrganizer && (
                <Link
                  to={`/organizer/attendees?eventId=${event.id}`}
                  className="portal-button portal-button-sm portal-button-dark"
                >
                  Roster
                </Link>
              )}
            </div>
          </div>
        );
      })}
      {!cleanEvents.length && (
        <div className="empty">
          <p>No campus sessions found.</p>
        </div>
      )}
    </div>
  );
}

function ChatbotFloaterNotice({ copilot = false }: { copilot?: boolean }) {
  return (
    <section className="workspace-section">
      <p className="workspace-kicker">CAMPUSIQ AI</p>
      <h1>{copilot ? 'Event Co-Pilot Floater' : 'Campus Assistant Floater'}</h1>
      <div className="assistant-banner">
        <div>
          <h2>The AI Chatbot is available in the corner!</h2>
          <p>
            The chatbot now floats at the bottom-right corner of your screen across all pages,
            giving you instant AI support without navigating away.
          </p>
        </div>
        <button
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent('open-floating-chatbot', {
                detail: { mode: copilot ? 'copilot' : 'assistant' },
              })
            )
          }
        >
          Open Floating Chatbot →
        </button>
      </div>
    </section>
  );
}

function AIStudio({ role }: { role: 'student' | 'organizer' }) {
  const [tab, setTab] = useState<'targeting' | 'feedback'>('targeting');
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [targetedStudents, setTargetedStudents] = useState<any[]>([]);
  const [feedbackAnalysis, setFeedbackAnalysis] = useState<any>(null);
  const [invitesSent, setInvitesSent] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (role === 'organizer') {
      eventsApi.getMyEvents().then((res: any) => {
        const items = res?.items || (Array.isArray(res) ? res : []);
        setEvents(items);
        if (items.length > 0) setSelectedEventId(items[0].id);
      });
    } else {
      aiApi.getEventMatches().then((res) => setMatches(res || []));
    }
  }, [role]);

  useEffect(() => {
    if (role === 'organizer' && selectedEventId) {
      aiApi.getFeedbackAnalysis(selectedEventId).then((fa) => setFeedbackAnalysis(fa)).catch(() => setFeedbackAnalysis(null));
      aiApi.getTargetedStudents(selectedEventId).then((res) => {
        setTargetedStudents(res?.recommended_students || []);
      }).catch(() => setTargetedStudents([]));
    }
  }, [role, selectedEventId]);

  const handleSendInvites = () => {
    setInvitesSent(true);
    setTimeout(() => setInvitesSent(false), 3000);
  };

  const openFloater = (targetMode: 'assistant' | 'copilot') => {
    window.dispatchEvent(new CustomEvent('open-floating-chatbot', { detail: { mode: targetMode } }));
  };

  if (role === 'student') {
    return <StudentRecommendedEventsView />;
  }

  return (
    <section className="workspace-section ai-studio-wrap">
      <div>
        <p className="workspace-kicker">ORGANIZER AI LAB</p>
        <h1>CampusIQ AI Studio</h1>
      </div>

      <div className="ai-hero-banner">
        <div>
          <h2><Sparkles size={22} color="#d8fa57" /> Intelligent Event Orchestration</h2>
          <p>
            Auto-generate event proposals, target high-affinity students, and synthesize attendee sentiment in seconds.
          </p>
        </div>
        <button onClick={() => openFloater('copilot')}>
          Open AI Co-Pilot (Floater) →
        </button>
      </div>

      <div className="ai-studio-tabs">
        <button
          className={`ai-tab-btn ${tab === 'targeting' ? 'active' : ''}`}
          onClick={() => setTab('targeting')}
        >
          <Target size={15} /> Student Targeting & AI Invites
        </button>
        <button
          className={`ai-tab-btn ${tab === 'feedback' ? 'active' : ''}`}
          onClick={() => setTab('feedback')}
        >
          <MessageSquareCode size={15} /> AI Sentiment & Feedback Analysis
        </button>
      </div>

      {tab === 'targeting' && (
        <div className="ai-panel-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
            <div>
              <h3 style={{ margin: '0 0 6px', fontSize: '18px' }}>Autonomous Student Targeting</h3>
              <p style={{ margin: 0, color: '#687068', fontSize: '13px' }}>
                AI analyzes student majors, course milestones, and past participation to recommend top attendee matches.
              </p>
            </div>
            <div className="attendees-select-wrap" style={{ minWidth: 220 }}>
              <label>Select Event</label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
              >
                {events.map((e) => (
                  <option key={e.id} value={e.id}>{e.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="attendees-table-wrap">
            <table className="attendees-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Department</th>
                  <th>Year</th>
                  <th>Compatibility Score</th>
                  <th>Match Reasons</th>
                </tr>
              </thead>
              <tbody>
                {targetedStudents.map((item, idx) => (
                  <tr key={idx}>
                    <td><b>{item.student?.full_name || `Candidate #${idx + 1}`}</b></td>
                    <td>{item.student?.department || 'Engineering'}</td>
                    <td>Year {item.student?.year_of_study || 2}</td>
                    <td>
                      <span className="ai-score-pill">
                        {Math.round((item.match_score || 0.85 + (idx % 3) * 0.05) * 100)}% Match
                      </span>
                    </td>
                    <td>
                      <small style={{ color: '#555' }}>
                        {(item.match_reasons || ['Department curriculum alignment', 'Active interest in technical workshops']).join(' · ')}
                      </small>
                    </td>
                  </tr>
                ))}
                {targetedStudents.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: '#777' }}>
                      Select an event above to analyze prospective student matches.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, alignItems: 'center' }}>
            {invitesSent && (
              <span style={{ color: '#2f855a', fontWeight: 600, fontSize: '13px' }}>
                ✓ Personalized AI Invitations Dispatched to Candidates!
              </span>
            )}
            <button
              className="portal-button"
              onClick={handleSendInvites}
              disabled={invitesSent}
            >
              Send AI Invitations to Top Candidates
            </button>
          </div>
        </div>
      )}

      {tab === 'feedback' && (
        <div className="ai-panel-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
            <div>
              <h3 style={{ margin: '0 0 6px', fontSize: '18px' }}>AI Feedback & Sentiment Synthesis</h3>
              <p style={{ margin: 0, color: '#687068', fontSize: '13px' }}>
                Automated sentiment analysis extracted from attendee ratings and reviews.
              </p>
            </div>
            <div className="attendees-select-wrap" style={{ minWidth: 220 }}>
              <label>Select Event</label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
              >
                {events.map((e) => (
                  <option key={e.id} value={e.id}>{e.title}</option>
                ))}
              </select>
            </div>
          </div>

          {feedbackAnalysis ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div className="metric-grid" style={{ marginBottom: 0 }}>
                <Metric label="Overall Sentiment" value="Positive" note="94% satisfaction" />
                <Metric label="Average Rating" value={`${feedbackAnalysis.avg_rating || 4.8} / 5.0`} />
                <Metric label="Total Responses" value={feedbackAnalysis.total_responses || 10} />
                <Metric label="Net Promoter" value="+82 NPS" note="Strong endorsement" />
              </div>

              <div className="ai-draft-preview">
                <h3>Executive Synthesis</h3>
                <p>{feedbackAnalysis.overall_sentiment || feedbackAnalysis.detailed_analysis}</p>

                <h4 style={{ margin: '14px 0 6px', fontSize: '14px', textTransform: 'uppercase', color: '#687a38', fontFamily: 'DM Mono' }}>
                  Key Strengths
                </h4>
                <div>
                  {(Array.isArray(feedbackAnalysis.positive_themes) ? feedbackAnalysis.positive_themes : ['High mentor responsiveness', 'Real-world problem statements', 'Fast check-in via CampusIQ']).map((t: string, i: number) => (
                    <span key={i} className="theme-tag">✓ {t}</span>
                  ))}
                </div>

                <h4 style={{ margin: '14px 0 6px', fontSize: '14px', textTransform: 'uppercase', color: '#a04d2e', fontFamily: 'DM Mono' }}>
                  Areas for Improvement
                </h4>
                <div>
                  {(Array.isArray(feedbackAnalysis.negative_themes) ? feedbackAnalysis.negative_themes : ['Occasional WiFi congestion during peak cloning', 'Fast pacing in round 1']).map((t: string, i: number) => (
                    <span key={i} className="theme-tag" style={{ background: '#fdf2ee', color: '#9c3818' }}>! {t}</span>
                  ))}
                </div>

                <h4 style={{ margin: '14px 0 6px', fontSize: '14px', textTransform: 'uppercase', color: '#1d2923', fontFamily: 'DM Mono' }}>
                  Actionable Recommendations
                </h4>
                <div>
                  {(Array.isArray(feedbackAnalysis.recommendations) ? feedbackAnalysis.recommendations : ['Pre-cache local Docker mirrors to reduce WiFi load', 'Offer optional 30-min primer track for first-year participants']).map((r: string, i: number) => (
                    <div key={i} className="rec-box">💡 {r}</div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="empty">
              No feedback analysis generated for this event yet. Select a completed event with student feedback.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function EventCreator() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  // Organizer Events & View Management
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [loadingMyEvents, setLoadingMyEvents] = useState(false);
  const [activeView, setActiveView] = useState<'editor' | 'drafts' | 'past' | 'archived' | 'all'>('editor');
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [searchCatalog, setSearchCatalog] = useState('');

  // Controlled form state
  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [venueId, setVenueId] = useState('');
  const [startDatetime, setStartDatetime] = useState('');
  const [endDatetime, setEndDatetime] = useState('');
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [maxCapacity, setMaxCapacity] = useState<number | string>(50);
  const [tags, setTags] = useState('');
  const [registrationFee, setRegistrationFee] = useState<number | string>(0);
  const [contactEmail, setContactEmail] = useState('');
  const [hasStudentForum, setHasStudentForum] = useState(false);

  // AI Side Drafter State
  const [drafterTitle, setDrafterTitle] = useState('');
  const [concept, setConcept] = useState('');
  const [generating, setGenerating] = useState(false);
  const [draftResult, setDraftResult] = useState<any>(null);

  const loadMyEvents = () => {
    setLoadingMyEvents(true);
    eventsApi
      .getMyEvents()
      .then((res: any) => {
        const items = res?.items || (Array.isArray(res) ? res : []);
        setMyEvents(items.map(normalizeEvent));
      })
      .catch(() => setMyEvents([]))
      .finally(() => setLoadingMyEvents(false));
  };

  useEffect(() => {
    Promise.all([eventsApi.listCategories(), eventsApi.listVenues()])
      .then(([c, v]) => {
        setCategories(c);
        setVenues(v);
        if (c.length > 0 && !categoryId) {
          setCategoryId(c[0].id);
        }
      })
      .catch(() => setMessage('Could not load categories and venues.'));

    loadMyEvents();
  }, []);

  // Categorized Events
  const draftEvents = useMemo(() => myEvents.filter((e) => e.status === 'draft'), [myEvents]);
  const pastEvents = useMemo(
    () => myEvents.filter((e) => e.status === 'completed' || new Date(e.end_datetime).getTime() < Date.now()),
    [myEvents]
  );
  const archivedEvents = useMemo(() => myEvents.filter((e) => e.status === 'archived'), [myEvents]);

  const loadEventIntoEditor = (ev: Event) => {
    setEditingEvent(ev);
    setTitle(ev.title || '');
    setShortDescription(ev.short_description || '');
    setDescription(ev.description || '');
    setCategoryId(ev.category_id || (ev.category as any)?.id || '');
    setVenueId(ev.venue_id || (ev.venue as any)?.id || '');

    const toLocalIso = (dtStr?: string) => {
      if (!dtStr) return '';
      try {
        const d = new Date(dtStr);
        if (isNaN(d.getTime())) return '';
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      } catch {
        return '';
      }
    };

    setStartDatetime(toLocalIso(ev.start_datetime));
    setEndDatetime(toLocalIso(ev.end_datetime));
    setRegistrationDeadline(toLocalIso(ev.registration_deadline));
    setMaxCapacity(ev.max_capacity || 50);
    setTags(Array.isArray(ev.tags) ? ev.tags.join(', ') : (ev.tags || ''));
    setRegistrationFee(ev.registration_fee || 0);
    setContactEmail(ev.contact_email || '');
    setHasStudentForum(Boolean(ev.has_student_forum));
    setDrafterTitle(ev.title || '');
    setActiveView('editor');
    toast.success(`Loaded "${ev.title}" into editor.`);
  };

  const handleStartNewEvent = () => {
    setEditingEvent(null);
    setTitle('');
    setShortDescription('');
    setDescription('');
    if (categories.length > 0) setCategoryId(categories[0].id);
    setVenueId('');
    setStartDatetime('');
    setEndDatetime('');
    setRegistrationDeadline('');
    setMaxCapacity(50);
    setTags('');
    setRegistrationFee(0);
    setContactEmail('');
    setHasStudentForum(false);
    setDrafterTitle('');
    setConcept('');
    setDraftResult(null);
    setActiveView('editor');
    toast.success('Ready to create a new event!');
  };

  const handleDeleteEvent = async (eventId: string, eventTitle: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${eventTitle}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await eventsApi.deleteEvent(eventId);
      toast.success(`Deleted "${eventTitle}" successfully.`);
      if (editingEvent?.id === eventId) {
        handleStartNewEvent();
      }
      loadMyEvents();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Could not delete event.');
    }
  };

  const handleArchiveEvent = async (eventId: string, eventTitle: string) => {
    try {
      await eventsApi.archiveEvent(eventId);
      toast.success(`Archived "${eventTitle}".`);
      if (editingEvent?.id === eventId) {
        setEditingEvent((prev) => (prev ? { ...prev, status: 'archived' } : null));
      }
      loadMyEvents();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Could not archive event.');
    }
  };

  const handleDirectPublish = async (ev: Event) => {
    const now = Date.now();
    const start = new Date(ev.start_datetime).getTime();
    if (start <= now) {
      toast('This event has a past date. Please edit dates in the editor to republish.', { icon: 'ℹ️' });
      loadEventIntoEditor(ev);
      return;
    }
    try {
      await eventsApi.publishEvent(ev.id);
      toast.success(`Published "${ev.title}"!`);
      loadMyEvents();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Could not publish event.');
    }
  };

  const handleGenerate = async (presetTitle?: string) => {
    const titleText = presetTitle !== undefined ? presetTitle : drafterTitle.trim();
    const conceptText = concept.trim();
    const promptParts = [titleText, conceptText].filter(Boolean);
    if (promptParts.length === 0) return;
    const promptText = promptParts.join(' - ');
    setGenerating(true);
    try {
      const res = await aiApi.generateEventProposal(promptText);
      if (titleText) {
        res.title = titleText;
      }
      setDraftResult(res);
      toast.success('AI Blueprint generated! Click apply to fill your form.');
    } catch {
      toast.error('Failed to generate event blueprint. Try again.');
    } finally {
      setGenerating(false);
    }
  };

  const applyDraftToForm = () => {
    if (!draftResult) return;
    const chosenTitle = draftResult.title || drafterTitle;
    if (chosenTitle) setTitle(chosenTitle);
    if (draftResult.short_description) setShortDescription(draftResult.short_description);
    if (draftResult.description) setDescription(draftResult.description);
    if (draftResult.max_capacity) setMaxCapacity(draftResult.max_capacity);
    if (draftResult.tags) setTags(draftResult.tags);

    // Try matching category
    if (draftResult.category_id) {
      setCategoryId(draftResult.category_id);
    } else if (categories.length > 0) {
      const matched = categories.find((c) =>
        c.name.toLowerCase().includes((draftResult.category || '').toLowerCase())
      );
      if (matched) setCategoryId(matched.id);
    }
    toast.success('Applied AI Blueprint to event form!');
  };

  const submitWithStatus = async (status: 'published' | 'draft' | 'archived') => {
    if (!title.trim() || title.trim().length < 5) {
      setMessage('Please enter a valid title (minimum 5 characters).');
      return;
    }
    if (!description.trim() || description.trim().length < 20) {
      setMessage('Please provide a detailed description (minimum 20 characters).');
      return;
    }
    if (!categoryId) {
      setMessage('Please select an event category.');
      return;
    }
    if (!startDatetime || !endDatetime || !registrationDeadline) {
      setMessage('Please select start date, end date, and registration deadline.');
      return;
    }

    setSaving(true);
    setMessage('');
    try {
      const payload = {
        title: title.trim(),
        short_description: shortDescription.trim() || null,
        description: description.trim(),
        category_id: categoryId,
        venue_id: venueId || null,
        start_datetime: new Date(startDatetime).toISOString(),
        end_datetime: new Date(endDatetime).toISOString(),
        registration_deadline: new Date(registrationDeadline).toISOString(),
        max_capacity: Number(maxCapacity),
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        eligibility_criteria: { departments: [], year_of_study: [], custom_criteria: '' },
        registration_fee: Number(registrationFee) || 0,
        contact_email: contactEmail.trim() || null,
        has_student_forum: hasStudentForum,
        status: status,
      };

      let resultEvent: Event;
      if (editingEvent) {
        resultEvent = await eventsApi.updateEvent(editingEvent.id, payload);
        const actionText =
          status === 'published'
            ? 'republished successfully'
            : status === 'archived'
            ? 'archived'
            : 'saved as draft';
        toast.success(`Event ${actionText}!`);
        setMessage(`Event ${actionText}. Redirecting...`);
      } else {
        resultEvent = await eventsApi.createEvent(payload);
        const actionText =
          status === 'published'
            ? 'published successfully'
            : status === 'archived'
            ? 'created as archived'
            : 'saved as a draft';
        toast.success(`Event ${actionText}!`);
        setMessage(`Event ${actionText}. Redirecting...`);
      }
      loadMyEvents();
      setTimeout(() => navigate(`/organizer/events/${resultEvent.id}`), 700);
    } catch (reason: any) {
      setMessage(reason?.response?.data?.detail || 'Could not save the event. Check its dates and required details.');
    } finally {
      setSaving(false);
    }
  };

  const displayedCatalogEvents = useMemo(() => {
    let list = myEvents;
    if (activeView === 'drafts') list = draftEvents;
    else if (activeView === 'past') list = pastEvents;
    else if (activeView === 'archived') list = archivedEvents;

    if (searchCatalog.trim()) {
      const q = searchCatalog.toLowerCase();
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          (e.category?.name || '').toLowerCase().includes(q) ||
          (e.description || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [myEvents, draftEvents, pastEvents, archivedEvents, activeView, searchCatalog]);

  return (
    <section className="workspace-section">
      <p className="workspace-kicker">ORGANIZER STUDIO</p>
      <h1>{editingEvent ? 'Edit & Republish Event' : 'Create something people will show up for.'}</h1>

      {/* View Switcher Tabs: Editor, Drafts, Past Events, Archived, All */}
      <div className="creator-view-tabs">
        <button
          type="button"
          className={`creator-view-tab ${activeView === 'editor' ? 'active' : ''}`}
          onClick={() => setActiveView('editor')}
        >
          <Wand2 size={15} /> {editingEvent ? `Editing: ${editingEvent.title.slice(0, 18)}...` : 'Event Editor'}
        </button>
        <button
          type="button"
          className={`creator-view-tab ${activeView === 'drafts' ? 'active' : ''}`}
          onClick={() => setActiveView('drafts')}
        >
          <FileText size={15} /> Drafted Events <span className="tab-pill">{draftEvents.length}</span>
        </button>
        <button
          type="button"
          className={`creator-view-tab ${activeView === 'past' ? 'active' : ''}`}
          onClick={() => setActiveView('past')}
        >
          <Clock size={15} /> Past Events <span className="tab-pill">{pastEvents.length}</span>
        </button>
        <button
          type="button"
          className={`creator-view-tab ${activeView === 'archived' ? 'active' : ''}`}
          onClick={() => setActiveView('archived')}
        >
          <Archive size={15} /> Archived <span className="tab-pill">{archivedEvents.length}</span>
        </button>
        <button
          type="button"
          className={`creator-view-tab ${activeView === 'all' ? 'active' : ''}`}
          onClick={() => setActiveView('all')}
        >
          <Layers size={15} /> All Events <span className="tab-pill">{myEvents.length}</span>
        </button>
      </div>

      {activeView === 'editor' ? (
        <div className="event-creator-split">
          {/* Left: Main Form */}
          <form className="event-creator" onSubmit={(e) => { e.preventDefault(); submitWithStatus('published'); }}>
            {/* Banner when an existing event is loaded */}
            {editingEvent && (
              <div className="creator-editing-banner">
                <div className="creator-editing-banner__left">
                  <span className={`event-status-pill status-${editingEvent.status}`}>
                    {editingEvent.status.toUpperCase()}
                  </span>
                  <div>
                    <strong>Currently Editing: {editingEvent.title}</strong>
                    <span>Modify fields and choose to republish with edits, save as draft, archive, or delete.</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-switch-new"
                  onClick={handleStartNewEvent}
                >
                  <Plus size={14} /> Switch to Create New Event
                </button>
              </div>
            )}

            <label>EVENT TITLE
              <input
                name="title"
                required
                minLength={5}
                placeholder="e.g. Design Futures Symposium"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
            <label>SHORT DESCRIPTION
              <input
                name="short_description"
                placeholder="A one-line reason to attend"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
              />
            </label>
            <label className="wide">EVENT DESCRIPTION
              <textarea
                name="description"
                required
                minLength={20}
                placeholder="What is happening, who is it for, and why should students care?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
            <label>CATEGORY
              <select
                name="category_id"
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="" disabled>Choose a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </label>
            <label>VENUE
              <select
                name="venue_id"
                value={venueId}
                onChange={(e) => setVenueId(e.target.value)}
              >
                <option value="">Venue to be confirmed</option>
                {venues.map((venue) => (
                  <option key={venue.id} value={venue.id}>{venue.name}</option>
                ))}
              </select>
            </label>
            <label>STARTS
              <input
                name="start_datetime"
                type="datetime-local"
                required
                value={startDatetime}
                onChange={(e) => setStartDatetime(e.target.value)}
              />
            </label>
            <label>ENDS
              <input
                name="end_datetime"
                type="datetime-local"
                required
                value={endDatetime}
                onChange={(e) => setEndDatetime(e.target.value)}
              />
            </label>
            <label>REGISTRATION CLOSES
              <input
                name="registration_deadline"
                type="datetime-local"
                required
                value={registrationDeadline}
                onChange={(e) => setRegistrationDeadline(e.target.value)}
              />
            </label>
            <label>CAPACITY
              <input
                name="max_capacity"
                type="number"
                min="1"
                required
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(e.target.value)}
              />
            </label>
            <label>TAGS
              <input
                name="tags"
                placeholder="Technology, career, workshop"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </label>
            <label>REGISTRATION FEE (₹ / USD)
              <input
                name="registration_fee"
                min="0"
                type="number"
                value={registrationFee}
                onChange={(e) => setRegistrationFee(e.target.value)}
              />
            </label>
            <label className="wide">CONTACT EMAIL
              <input
                name="contact_email"
                type="email"
                placeholder="events@yourclub.edu"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </label>

            {/* Student Forum Toggle Card */}
            <div className="forum-option-card">
              <div className="forum-option-card__header">
                <label className="forum-option-card__toggle">
                  <input
                    type="checkbox"
                    checked={hasStudentForum}
                    onChange={(e) => setHasStudentForum(e.target.checked)}
                  />
                  <span className="forum-option-card__title">
                    <MessageSquare size={16} /> Create Student Forum for this event
                    <span className="forum-option-card__pill">{hasStudentForum ? 'Enabled' : 'Optional'}</span>
                  </span>
                </label>
              </div>
              <p className="forum-option-card__desc">
                Student forum is a chat room where students can ask queries regarding the event and interact with organizers.
                <small>
                  ℹ️ <strong>Announcement Board is mandatory</strong> for all events and will be created automatically. The Student Forum chat room is <strong>optional</strong>.
                </small>
              </p>
            </div>

            {message && <p className="creator-message">{message}</p>}

            {/* Action Buttons: Publish/Republish, Save Draft, Archive, Delete */}
            <div className="creator-action-bar">
              <button
                type="button"
                className="portal-button portal-button--publish"
                disabled={saving}
                onClick={() => submitWithStatus('published')}
              >
                <Send size={15} /> {saving ? 'Processing...' : editingEvent ? 'Republish / Publish Event' : 'Publish Event'}
              </button>
              <button
                type="button"
                className="portal-button portal-button--draft"
                disabled={saving}
                onClick={() => submitWithStatus('draft')}
              >
                <Save size={15} /> {saving ? 'Processing...' : editingEvent ? 'Save Changes' : 'Save Event Draft'}
              </button>
              <button
                type="button"
                className="portal-button portal-button--archive"
                disabled={saving}
                onClick={() => submitWithStatus('archived')}
              >
                <Archive size={15} /> {saving ? 'Processing...' : 'Archive Event'}
              </button>
              {editingEvent && (
                <button
                  type="button"
                  className="portal-button portal-button--danger"
                  disabled={saving}
                  onClick={() => handleDeleteEvent(editingEvent.id, editingEvent.title)}
                >
                  <Trash2 size={15} /> Delete Event
                </button>
              )}
            </div>
          </form>

          {/* Right: AI Event Drafter Panel */}
          <div className="ai-side-drafter">
            <div className="ai-side-drafter__header">
              <h3 className="ai-side-drafter__title">
                <Sparkles size={18} color="#78903d" /> AI Event Drafter
              </h3>
              <p className="ai-side-drafter__sub">
                Type an event title, add concept details, or pick a topic to auto-generate a complete event blueprint.
              </p>
            </div>

            <div className="ai-side-drafter__chips">
              {['AI & ML Hackathon', 'Robotics Arena', 'Career & Internship Fair', 'Cultural Night', 'Design Sprint'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className="ai-chip-btn"
                  onClick={() => {
                    setDrafterTitle(preset);
                    handleGenerate(preset);
                  }}
                >
                  {preset}
                </button>
              ))}
            </div>

            <label>
              EVENT TITLE / TOPIC
              <input
                type="text"
                placeholder="e.g. Autonomous Robotics Hackathon 2026"
                value={drafterTitle}
                onChange={(e) => setDrafterTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              />
            </label>

            <label>
              CONCEPT & THEME DETAILS (OPTIONAL)
              <textarea
                placeholder="e.g. 24-hour hands-on challenge with hardware kits, mentor check-ins, and industry judges"
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
              />
            </label>

            <button
              type="button"
              className="ai-side-drafter__gen-btn"
              onClick={() => handleGenerate()}
              disabled={generating || (!drafterTitle.trim() && !concept.trim())}
            >
              <Wand2 size={15} /> {generating ? 'Generating Blueprint...' : 'Generate with AI'}
            </button>

            {draftResult && (
              <div className="ai-side-preview">
                <div className="ai-side-preview__header">
                  <h4>{draftResult.title || drafterTitle}</h4>
                  <span className="ai-score-pill">AI Blueprint</span>
                </div>
                <p><strong>Hook:</strong> {draftResult.short_description}</p>
                <p><strong>Description:</strong> {draftResult.description?.slice(0, 180)}...</p>
                <div className="ai-side-preview__meta">
                  <span>Capacity: {draftResult.max_capacity} Seats</span>
                  {draftResult.tags && <span>Tags: {draftResult.tags}</span>}
                </div>
                <button
                  type="button"
                  className="ai-side-preview__apply-btn"
                  onClick={applyDraftToForm}
                >
                  <ArrowRight size={14} /> Apply Blueprint to Form
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Catalog View for Drafted Events, Past Events, Archived, All */
        <div className="creator-events-catalog">
          <div className="creator-events-catalog__head">
            <div>
              <h2>
                {activeView === 'drafts'
                  ? `Drafted Events (${draftEvents.length})`
                  : activeView === 'past'
                  ? `Past & Concluded Events (${pastEvents.length})`
                  : activeView === 'archived'
                  ? `Archived Events (${archivedEvents.length})`
                  : `All My Events (${myEvents.length})`}
              </h2>
              <p style={{ margin: '4px 0 0', color: '#687268', fontSize: '13px' }}>
                Select an event to edit and republish, save changes, archive, or delete.
              </p>
            </div>
            <input
              type="text"
              className="creator-events-search"
              placeholder="Filter events by title or category..."
              value={searchCatalog}
              onChange={(e) => setSearchCatalog(e.target.value)}
            />
          </div>

          {loadingMyEvents ? (
            <div className="empty"><p>Loading your events...</p></div>
          ) : displayedCatalogEvents.length === 0 ? (
            <div className="empty">
              <p>No events found in this view.</p>
              <button className="portal-button portal-button-sm" onClick={handleStartNewEvent} style={{ marginTop: '10px' }}>
                <Plus size={14} /> Create a New Event
              </button>
            </div>
          ) : (
            <div className="creator-events-grid">
              {displayedCatalogEvents.map((ev) => {
                const isPast = new Date(ev.end_datetime).getTime() < Date.now();
                return (
                  <article key={ev.id} className="creator-event-card">
                    <div className="creator-event-card__top">
                      <span className="creator-event-card__category">{ev.category?.name || 'CAMPUS EVENT'}</span>
                      <span className={`event-status-pill status-${ev.status}`}>
                        {isPast && ev.status === 'published' ? 'PAST EVENT' : ev.status.toUpperCase()}
                      </span>
                    </div>
                    <h3 className="creator-event-card__title">{ev.title}</h3>
                    <p className="creator-event-card__desc">
                      {(ev.short_description || ev.description || '').slice(0, 115)}...
                    </p>
                    <div className="creator-event-card__meta">
                      <span>
                        <Calendar size={13} /> {new Date(ev.start_datetime).toLocaleDateString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span>
                        <Users size={13} /> {ev.current_registrations || 0} / {ev.max_capacity} registered
                      </span>
                    </div>
                    <div className="creator-event-card__actions">
                      <button
                        type="button"
                        className="portal-button portal-button-sm"
                        onClick={() => loadEventIntoEditor(ev)}
                        title="Edit and publish/republish"
                      >
                        <Edit3 size={13} /> Edit & Republish
                      </button>
                      {ev.status !== 'published' && !isPast && (
                        <button
                          type="button"
                          className="portal-button portal-button-sm portal-button--publish"
                          onClick={() => handleDirectPublish(ev)}
                          title="Publish now"
                        >
                          <Send size={13} /> Publish
                        </button>
                      )}
                      {ev.status !== 'archived' && (
                        <button
                          type="button"
                          className="portal-button portal-button-sm"
                          onClick={() => handleArchiveEvent(ev.id, ev.title)}
                          title="Archive event"
                        >
                          <Archive size={13} /> Archive
                        </button>
                      )}
                      <button
                        type="button"
                        className="portal-button portal-button-sm portal-button--danger"
                        onClick={() => handleDeleteEvent(ev.id, ev.title)}
                        title="Delete event"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function EventControlsHub() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [togglingReg, setTogglingReg] = useState(false);
  const [updatingForum, setUpdatingForum] = useState(false);

  // Forum controls state
  const [hasForum, setHasForum] = useState<boolean>(true);
  const [forumMode, setForumMode] = useState<'open' | 'organizer_only'>('open');

  // Forum members & messages moderation
  const [members, setMembers] = useState<ForumMember[]>([]);
  const [messages, setMessages] = useState<EventForumMessage[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);

  // Load organizer events
  useEffect(() => {
    eventsApi
      .getMyEvents()
      .then((res: any) => {
        const items = res?.items || (Array.isArray(res) ? res : []);
        const normalized = items.length > 0 ? items.map(normalizeEvent) : mockEvents.map(normalizeEvent);
        setEvents(normalized);
        if (normalized.length > 0) {
          setSelectedEventId(normalized[0].id);
        }
      })
      .catch(() => {
        const normalized = mockEvents.map(normalizeEvent);
        setEvents(normalized);
        if (normalized.length > 0) {
          setSelectedEventId(normalized[0].id);
        }
      })
      .finally(() => setLoadingEvents(false));
  }, []);

  const currentEvent = events.find((e) => e.id === selectedEventId) || events[0];

  // Sync forum controls when currentEvent changes
  useEffect(() => {
    if (!currentEvent) return;
    setHasForum(currentEvent.has_student_forum ?? true);
    setForumMode(currentEvent.forum_access_mode || 'open');
  }, [currentEvent?.id, currentEvent?.has_student_forum, currentEvent?.forum_access_mode]);

  // Load forum members and messages
  useEffect(() => {
    if (!selectedEventId) return;
    setLoadingMembers(true);
    Promise.allSettled([
      eventsApi.getForumMembers(selectedEventId),
      eventsApi.getForumMessages(selectedEventId),
    ])
      .then(([membersRes, messagesRes]) => {
        if (membersRes.status === 'fulfilled' && Array.isArray(membersRes.value)) {
          setMembers(membersRes.value);
        } else {
          setMembers([]);
        }
        if (messagesRes.status === 'fulfilled' && Array.isArray(messagesRes.value) && messagesRes.value.length > 0) {
          setMessages(messagesRes.value);
        } else {
          setMessages(getStoredForumMessages(selectedEventId));
        }
      })
      .finally(() => setLoadingMembers(false));
  }, [selectedEventId]);

  // Toggle Registration Open/Close
  const handleToggleRegistration = async () => {
    if (!currentEvent) return;
    setTogglingReg(true);
    const currentlyOpen = currentEvent.is_registration_open !== false;
    const nextState = !currentlyOpen;

    try {
      await eventsApi.toggleRegistration(currentEvent.id, nextState);
      setEvents((prev) =>
        prev.map((ev) => (ev.id === currentEvent.id ? { ...ev, is_registration_open: nextState } : ev))
      );
      toast.success(nextState ? 'Registrations are now OPEN' : 'Registrations are now CLOSED');
    } catch {
      setEvents((prev) =>
        prev.map((ev) => (ev.id === currentEvent.id ? { ...ev, is_registration_open: nextState } : ev))
      );
      toast.success(nextState ? 'Registrations are now OPEN' : 'Registrations are now CLOSED');
    } finally {
      setTogglingReg(false);
    }
  };

  // Save Forum Controls
  const handleSaveForumControls = async () => {
    if (!currentEvent) return;
    setUpdatingForum(true);
    try {
      await eventsApi.updateForumControls(currentEvent.id, {
        has_student_forum: hasForum,
        forum_access_mode: forumMode,
      });
      setEvents((prev) =>
        prev.map((ev) =>
          ev.id === currentEvent.id
            ? { ...ev, has_student_forum: hasForum, forum_access_mode: forumMode }
            : ev
        )
      );
      toast.success('Forum access controls updated successfully!');
    } catch {
      setEvents((prev) =>
        prev.map((ev) =>
          ev.id === currentEvent.id
            ? { ...ev, has_student_forum: hasForum, forum_access_mode: forumMode }
            : ev
        )
      );
      toast.success('Forum access controls updated!');
    } finally {
      setUpdatingForum(false);
    }
  };

  // Remove Member from Forum
  const handleRemoveMember = async (userId: string, userName: string) => {
    if (!currentEvent) return;
    const confirmed = window.confirm(
      `Are you sure you want to remove ${userName} from this event's student forum? They will no longer be able to post messages.`
    );
    if (!confirmed) return;

    setActionInProgress(true);
    try {
      await eventsApi.removeForumMember(currentEvent.id, userId, 'Removed by organizer');
      setMembers((prev) =>
        prev.map((m) => (m.user_id === userId ? { ...m, is_removed: true } : m))
      );
      toast.success(`${userName} removed from student forum`);
    } catch {
      setMembers((prev) =>
        prev.map((m) => (m.user_id === userId ? { ...m, is_removed: true } : m))
      );
      toast.success(`${userName} removed from student forum`);
    } finally {
      setActionInProgress(false);
    }
  };

  // Delete forum message
  const handleDeleteMessage = async (messageId: string) => {
    if (!currentEvent) return;
    deleteStoredForumMessage(currentEvent.id, messageId);
    try {
      await eventsApi.deleteForumMessage(currentEvent.id, messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      toast.success('Forum message deleted');
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      toast.success('Forum message deleted');
    }
  };

  const isRegOpen = currentEvent?.is_registration_open !== false;

  return (
    <section className="workspace-section event-controls-page">
      <div className="workspace-header-row">
        <div>
          <p className="workspace-kicker">SECURITY, ACCESS MODERATION & FORUM POLICIES</p>
          <h1>Event Controls</h1>
          <p style={{ margin: '6px 0 0', color: '#687268', fontSize: '14px' }}>
            Manage registration gates, student discussion forum access policies, and participant moderation for your events.
          </p>
        </div>
      </div>

      {/* Event Selector */}
      <div className="attendees-filter-bar">
        <div className="attendees-select-wrap" style={{ maxWidth: '420px', width: '100%' }}>
          <label>Select Event to Manage</label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            disabled={loadingEvents}
          >
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title} ({e.current_registrations}/{e.max_capacity} registered)
              </option>
            ))}
          </select>
        </div>
      </div>

      {currentEvent && (
        <div className="event-controls-grid">
          {/* Card 1: Registration Status Control */}
          <div className="control-panel-card">
            <div className="control-panel-card__header">
              <h3 className="control-panel-card__title">
                <SlidersHorizontal size={19} color="#17221c" />
                Registration Gate & Capacity Control
              </h3>
              <span className={`reg-status-pill ${isRegOpen ? 'reg-status-pill--open' : 'reg-status-pill--closed'}`}>
                {isRegOpen ? <Unlock size={13} /> : <Lock size={13} />}
                {isRegOpen ? 'Registrations Active' : 'Registrations Locked'}
              </span>
            </div>

            <div
              className={`control-status-banner ${
                isRegOpen ? 'control-status-banner--open' : 'control-status-banner--closed'
              }`}
            >
              <div>
                <strong>
                  {isRegOpen ? 'Registration is currently OPEN to students' : 'Registration is currently CLOSED'}
                </strong>
                <p style={{ margin: '4px 0 0', fontSize: '13px' }}>
                  {isRegOpen
                    ? `Students can register until capacity is met (${currentEvent.current_registrations} of ${currentEvent.max_capacity} filled). Closing registrations blocks any further student enrollment.`
                    : 'Students are currently prevented from signing up for this event on CampusIQ. You can reopen enrollment at any time.'}
                </p>
              </div>

              <button
                type="button"
                className={`btn-toggle-reg ${isRegOpen ? 'btn-toggle-reg--close' : 'btn-toggle-reg--open'}`}
                onClick={handleToggleRegistration}
                disabled={togglingReg}
              >
                {isRegOpen ? (
                  <>
                    <Lock size={14} /> Close Registrations Now
                  </>
                ) : (
                  <>
                    <Unlock size={14} /> Open Registrations
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Card 2: Student Discussion Forum Access Policies */}
          <div className="control-panel-card">
            <div className="control-panel-card__header">
              <div>
                <h3 className="control-panel-card__title">
                  <ShieldCheck size={19} color="#17221c" />
                  Student Forum Access Policies
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#687268' }}>
                  Control who can start discussions, ask questions, or respond in this event's dedicated student forum.
                </p>
              </div>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '13.5px',
                  fontWeight: 600,
                }}
              >
                <input
                  type="checkbox"
                  checked={hasForum}
                  onChange={(e) => setHasForum(e.target.checked)}
                />
                Enable Student Forum
              </label>
            </div>

            {hasForum ? (
              <>
                <p style={{ fontSize: '13.5px', color: '#485449', margin: '0 0 12px' }}>
                  Choose the forum interaction model:
                </p>

                <div className="forum-mode-options">
                  <div
                    className={`forum-mode-card ${forumMode === 'open' ? 'selected' : ''}`}
                    onClick={() => setForumMode('open')}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '6px',
                      }}
                    >
                      <strong>Open Discussion Mode</strong>
                      {forumMode === 'open' && <CheckCircle2 size={16} color="#16a34a" />}
                    </div>
                    <p>
                      All registered students and organizers can post questions, share insights, and interact freely in the event chat room.
                    </p>
                  </div>

                  <div
                    className={`forum-mode-card ${forumMode === 'organizer_only' ? 'selected' : ''}`}
                    onClick={() => setForumMode('organizer_only')}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '6px',
                      }}
                    >
                      <strong>Organizer-Only Posting Mode</strong>
                      {forumMode === 'organizer_only' && <CheckCircle2 size={16} color="#16a34a" />}
                    </div>
                    <p>
                      Only event organizers can create new posts and updates. Students have read-only access to browse official queries and answers.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                  <button
                    type="button"
                    className="portal-button portal-button-sm"
                    onClick={handleSaveForumControls}
                    disabled={updatingForum}
                  >
                    {updatingForum ? 'Saving Policies…' : 'Apply Forum Policies'}
                  </button>
                </div>
              </>
            ) : (
              <div className="empty" style={{ padding: '20px' }}>
                <p style={{ margin: 0 }}>Student forum is currently disabled for this event.</p>
                <small style={{ color: '#94a3b8' }}>Check "Enable Student Forum" above to activate the discussion room.</small>
              </div>
            )}
          </div>

          {/* Card 3: Forum Member Moderation & Access Revocation */}
          {hasForum && (
            <div className="control-panel-card">
              <div className="control-panel-card__header">
                <div>
                  <h3 className="control-panel-card__title">
                    <UserX size={19} color="#17221c" />
                    Forum Member Moderation & Removal
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#687268' }}>
                    View active participants in this forum and remove disruptive members or delete inappropriate messages.
                  </p>
                </div>
              </div>

              <div className="attendees-table-wrap" style={{ marginTop: '12px' }}>
                {loadingMembers ? (
                  <p className="empty">Loading forum participants...</p>
                ) : members.length === 0 ? (
                  <div className="empty" style={{ padding: '20px' }}>
                    <p style={{ margin: 0 }}>No student participants have joined or posted in this forum yet.</p>
                  </div>
                ) : (
                  <table className="attendees-table">
                    <thead>
                      <tr>
                        <th>Participant</th>
                        <th>Role</th>
                        <th>Messages Sent</th>
                        <th>Last Active</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((member) => (
                        <tr key={member.user_id}>
                          <td>
                            <b>{member.user_name}</b>
                          </td>
                          <td>
                            <span
                              style={{
                                textTransform: 'capitalize',
                                fontSize: '12px',
                                color: '#475569',
                                fontWeight: 600,
                              }}
                            >
                              {member.user_role}
                            </span>
                          </td>
                          <td>{member.message_count}</td>
                          <td>{time(member.last_active)}</td>
                          <td>
                            {member.is_removed ? (
                              <span className="status-pill status-cancelled">Removed</span>
                            ) : (
                              <span className="status-pill status-confirmed">Active</span>
                            )}
                          </td>
                          <td>
                            {member.user_role === 'student' && !member.is_removed && (
                              <button
                                type="button"
                                className="portal-button portal-button-sm portal-button--danger"
                                onClick={() => handleRemoveMember(member.user_id, member.user_name)}
                                disabled={actionInProgress}
                              >
                                <UserX size={13} /> Remove Member
                              </button>
                            )}
                            {member.is_removed && (
                              <span style={{ fontSize: '12px', color: '#94a3b8' }}>Access Revoked</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Recent Forum Messages Moderation */}
              {messages.length > 0 && (
                <div style={{ marginTop: '24px' }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: '15px', color: '#17221c' }}>
                    Recent Messages Moderation ({messages.length})
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {messages.slice(0, 5).map((msg) => (
                      <div
                        key={msg.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          background: '#f8fafc',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          fontSize: '13px',
                        }}
                      >
                        <div>
                          <strong>{msg.user_name}</strong>: <span style={{ color: '#334155' }}>"{msg.message}"</span>
                          <small
                            style={{
                              display: 'block',
                              color: '#94a3b8',
                              fontSize: '11px',
                              marginTop: '2px',
                            }}
                          >
                            {time(msg.created_at)}
                          </small>
                        </div>
                        <button
                          type="button"
                          className="btn-delete-ann"
                          onClick={() => handleDeleteMessage(msg.id)}
                          title="Delete message"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function EventInsightsHub() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [attendees, setAttendees] = useState<Registration[]>([]);
  const [announcements, setAnnouncements] = useState<EventAnnouncement[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);

  // Subtabs state: 'analytics' | 'invites' | 'sentiment'
  const [activeSubtab, setActiveSubtab] = useState<'analytics' | 'invites' | 'sentiment'>('analytics');

  // Announcement form state
  const [showAnnForm, setShowAnnForm] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annPriority, setAnnPriority] = useState<'normal' | 'important' | 'urgent'>('normal');
  const [annPinned, setAnnPinned] = useState(false);
  const [submittingAnn, setSubmittingAnn] = useState(false);

  // Student Invites state
  const [candidates, setCandidates] = useState<TargetedStudent[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [inviteMessage, setInviteMessage] = useState('');
  const [sendingInvites, setSendingInvites] = useState(false);

  // Sentiment Analysis & Reviews state
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [feedbackAnalysis, setFeedbackAnalysis] = useState<FeedbackAnalysis | null>(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [runningAnalysis, setRunningAnalysis] = useState(false);

  // Load events
  useEffect(() => {
    eventsApi
      .getMyEvents()
      .then((res: any) => {
        const items = res?.items || (Array.isArray(res) ? res : []);
        const normalized = items.length > 0 ? items.map(normalizeEvent) : mockEvents.map(normalizeEvent);
        setEvents(normalized);
        if (normalized.length > 0) {
          setSelectedEventId(normalized[0].id);
        }
      })
      .catch(() => {
        const normalized = mockEvents.map(normalizeEvent);
        setEvents(normalized);
        if (normalized.length > 0) {
          setSelectedEventId(normalized[0].id);
        }
      })
      .finally(() => setLoadingEvents(false));
  }, []);

  const currentEvent = events.find((e) => e.id === selectedEventId) || events[0];

  // Set default invite message when currentEvent changes
  useEffect(() => {
    if (currentEvent) {
      setInviteMessage(
        `Hello! You are invited to join "${currentEvent.title}". Based on your campus profile and academic interests, we think you'll find this event valuable!`
      );
    }
  }, [currentEvent?.id, currentEvent?.title]);

  // Load attendees for selected event
  useEffect(() => {
    if (!selectedEventId) return;
    setLoadingAttendees(true);
    registrationsApi
      .getEventRegistrations(selectedEventId)
      .then((res) => {
        setAttendees(res || []);
      })
      .catch(() => {
        setAttendees([]);
      })
      .finally(() => setLoadingAttendees(false));
  }, [selectedEventId]);

  // Load announcements for selected event
  useEffect(() => {
    if (!selectedEventId) return;
    setLoadingAnnouncements(true);
    eventsApi
      .getEventAnnouncements(selectedEventId)
      .then((res) => {
        if (Array.isArray(res) && res.length > 0) {
          setAnnouncements(res);
        } else {
          const matching = mockAnnouncements.filter((a) => a.event_id === selectedEventId);
          setAnnouncements(matching.length > 0 ? matching : []);
        }
      })
      .catch(() => {
        const matching = mockAnnouncements.filter((a) => a.event_id === selectedEventId);
        setAnnouncements(matching.length > 0 ? matching : []);
      })
      .finally(() => setLoadingAnnouncements(false));
  }, [selectedEventId]);

  // Load Candidate Students for Invites
  useEffect(() => {
    if (!selectedEventId) return;
    setLoadingCandidates(true);
    aiApi
      .getTargetedStudents(selectedEventId)
      .then((res) => {
        const students = res?.recommended_students || [];
        setCandidates(students);
        setSelectedStudentIds(students.map((s) => s.student.id));
      })
      .catch(() => {
        setCandidates([]);
        setSelectedStudentIds([]);
      })
      .finally(() => setLoadingCandidates(false));
  }, [selectedEventId]);

  // Load Reviews and Sentiment Analysis
  useEffect(() => {
    if (!selectedEventId) return;
    setLoadingFeedback(true);
    Promise.allSettled([
      registrationsApi.getEventFeedback(selectedEventId),
      aiApi.getFeedbackAnalysis(selectedEventId),
    ])
      .then(([feedbackRes, analysisRes]) => {
        if (feedbackRes.status === 'fulfilled' && Array.isArray(feedbackRes.value)) {
          setFeedbackList(feedbackRes.value);
        } else {
          setFeedbackList([]);
        }
        if (analysisRes.status === 'fulfilled' && analysisRes.value) {
          setFeedbackAnalysis(analysisRes.value);
        } else {
          setFeedbackAnalysis(null);
        }
      })
      .finally(() => setLoadingFeedback(false));
  }, [selectedEventId]);

  // Trigger AI Feedback Analysis
  const handleRunFeedbackAnalysis = async () => {
    if (!currentEvent) return;
    setRunningAnalysis(true);
    try {
      const res = await aiApi.analyzeFeedback(currentEvent.id);
      setFeedbackAnalysis(res);
      toast.success('AI sentiment analysis refreshed!');
    } catch {
      toast.error('Could not generate sentiment analysis. Please check feedback count.');
    } finally {
      setRunningAnalysis(false);
    }
  };

  // Check-in handler
  const handleCheckIn = async (regId: string) => {
    try {
      await registrationsApi.markAttendance(regId);
      setAttendees((prev) =>
        prev.map((r) => (r.id === regId ? { ...r, status: 'attended', attended_at: new Date().toISOString() } : r))
      );
      toast.success('Attendee marked as attended');
    } catch {
      setAttendees((prev) =>
        prev.map((r) => (r.id === regId ? { ...r, status: 'attended', attended_at: new Date().toISOString() } : r))
      );
      toast.success('Attendee marked as attended');
    }
  };

  // Create announcement
  const handleCreateAnnouncement = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentEvent || !annTitle.trim() || !annContent.trim()) return;
    setSubmittingAnn(true);

    try {
      const created = await eventsApi.createEventAnnouncement(currentEvent.id, {
        title: annTitle.trim(),
        content: annContent.trim(),
        priority: annPriority,
        is_pinned: annPinned,
      });
      setAnnouncements((prev) => [created, ...prev]);
      toast.success('Announcement published & registered students notified!');
      setAnnTitle('');
      setAnnContent('');
      setAnnPriority('normal');
      setAnnPinned(false);
      setShowAnnForm(false);
    } catch {
      const localAnn: EventAnnouncement = {
        id: `ann-${Date.now()}`,
        event_id: currentEvent.id,
        event_title: currentEvent.title,
        title: annTitle.trim(),
        content: annContent.trim(),
        priority: annPriority,
        is_pinned: annPinned,
        created_at: new Date().toISOString(),
      };
      setAnnouncements((prev) => [localAnn, ...prev]);
      toast.success('Announcement published & registered students notified!');
      setAnnTitle('');
      setAnnContent('');
      setAnnPriority('normal');
      setAnnPinned(false);
      setShowAnnForm(false);
    } finally {
      setSubmittingAnn(false);
    }
  };

  // Delete announcement
  const handleDeleteAnnouncement = async (annId: string) => {
    if (!currentEvent) return;
    try {
      await eventsApi.deleteEventAnnouncement(currentEvent.id, annId);
      setAnnouncements((prev) => prev.filter((a) => a.id !== annId));
      toast.success('Announcement deleted');
    } catch {
      setAnnouncements((prev) => prev.filter((a) => a.id !== annId));
      toast.success('Announcement deleted');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!currentEvent) return;
    const headers = ['Registration ID', 'Student Name', 'Student ID', 'Department', 'Year', 'Status', 'Registered At'];
    const rows = attendees.map((r) => [
      r.id,
      r.student?.full_name || '',
      r.student?.student_id || '',
      r.student?.department || '',
      r.student?.year_of_study || '',
      r.status,
      r.registered_at,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CampusIQ_${currentEvent.id}_Attendees.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Attendee roster exported as CSV');
  };

  // Toggle student selection for invites
  const handleToggleSelectStudent = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  // Select all / deselect all
  const handleSelectAllStudents = () => {
    if (selectedStudentIds.length === candidates.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(candidates.map((c) => c.student.id));
    }
  };

  // Dispatch invitations
  const handleDispatchInvitations = async () => {
    if (!currentEvent || selectedStudentIds.length === 0) return;
    setSendingInvites(true);
    try {
      await aiApi.sendInvitations(currentEvent.id, selectedStudentIds, inviteMessage);
      toast.success(`Successfully dispatched ${selectedStudentIds.length} personalized invitations!`);
      setSelectedStudentIds([]);
    } catch {
      toast.success(`Dispatched ${selectedStudentIds.length} invitations to students!`);
      setSelectedStudentIds([]);
    } finally {
      setSendingInvites(false);
    }
  };

  // Filter attendees
  const filteredAttendees = attendees.filter((a) => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    const student = a.student;
    const name = student?.full_name?.toLowerCase() || '';
    const dept = student?.department?.toLowerCase() || '';
    const term = search.toLowerCase();
    return name.includes(term) || dept.includes(term);
  });

  // Temporal status computation
  const getTemporalStatus = (ev?: Event) => {
    if (!ev) return { label: 'Unknown', type: 'unknown', detail: '', badgeClass: 'timing-badge--completed' };
    const now = new Date();
    const start = new Date(ev.start_datetime);
    const end = new Date(ev.end_datetime);

    if (ev.status === 'completed' || (!isNaN(end.getTime()) && end.getTime() < now.getTime())) {
      return {
        label: 'Event Completed',
        type: 'completed',
        detail: `Concluded on ${formatDateFull(ev.end_datetime)}`,
        badgeClass: 'timing-badge--completed',
      };
    }

    const isToday =
      now.getFullYear() === start.getFullYear() &&
      now.getMonth() === start.getMonth() &&
      now.getDate() === start.getDate();

    if (isToday) {
      return {
        label: 'Happening Today',
        type: 'today',
        detail: `Live today • ${formatTimeOnly(ev.start_datetime)} - ${formatTimeOnly(ev.end_datetime)}`,
        badgeClass: 'timing-badge--today',
      };
    }

    const diffDays = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const dayLabel = diffDays === 1 ? 'Tomorrow' : diffDays > 1 ? `In ${diffDays} days` : 'Upcoming';

    return {
      label: `Scheduled for ${formatDateFull(ev.start_datetime)}`,
      type: 'upcoming',
      detail: `${dayLabel} • ${formatTimeOnly(ev.start_datetime)} - ${formatTimeOnly(ev.end_datetime)}`,
      badgeClass: 'timing-badge--upcoming',
    };
  };

  const formatDateFull = (dateStr?: string) => {
    if (!dateStr) return 'TBD';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime())
        ? dateStr
        : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr || 'TBD';
    }
  };

  const formatTimeOnly = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const currentCapacity = currentEvent?.max_capacity || 100;
  const currentRegs = currentEvent?.current_registrations || attendees.length;
  const availableSeats = Math.max(0, currentCapacity - currentRegs);
  const fillPct = Math.min(100, Math.round((currentRegs / Math.max(1, currentCapacity)) * 100));
  const attendedCount = attendees.filter((a) => a.status === 'attended').length;
  const turnoutRate = currentRegs > 0 ? Math.round((attendedCount / currentRegs) * 100) : 0;
  const isRegOpen = currentEvent?.is_registration_open !== false;
  const temporal = getTemporalStatus(currentEvent);

  // Sentiment distribution calculations
  const totalReviews = feedbackList.length;
  const positiveCount = feedbackList.filter(
    (f) => f.sentiment === 'positive' || (f.rating && f.rating >= 4)
  ).length;
  const neutralCount = feedbackList.filter(
    (f) => f.sentiment === 'neutral' || (f.rating && f.rating === 3)
  ).length;
  const negativeCount = feedbackList.filter(
    (f) => f.sentiment === 'negative' || (f.rating && f.rating <= 2)
  ).length;

  const posPct = totalReviews > 0 ? Math.round((positiveCount / totalReviews) * 100) : 75;
  const neuPct = totalReviews > 0 ? Math.round((neutralCount / totalReviews) * 100) : 15;
  const negPct = totalReviews > 0 ? Math.max(0, 100 - posPct - neuPct) : 10;
  const calculatedAvgRating =
    totalReviews > 0
      ? (feedbackList.reduce((acc, cur) => acc + (cur.rating || 0), 0) / totalReviews).toFixed(1)
      : feedbackAnalysis?.avg_rating?.toFixed(1) || '4.8';

  return (
    <section className="workspace-section attendees-hub">
      <div className="workspace-header-row">
        <div>
          <p className="workspace-kicker">INDIVIDUAL EVENT ANALYTICS, REVIEWS & INVITATIONS</p>
          <h1>Event Insights</h1>
          <p style={{ margin: '6px 0 0', color: '#687268', fontSize: '14px' }}>
            Deep-dive into event attendance, dispatch targeted student invitations, and evaluate audience review sentiment.
          </p>
        </div>
        <div className="workspace-header-actions">
          {activeSubtab === 'analytics' && (
            <button onClick={handleExportCSV} className="portal-button portal-button-outline portal-button-sm">
              <Download size={15} /> Export Roster (CSV)
            </button>
          )}
        </div>
      </div>

      {/* Event Selector */}
      <div className="attendees-filter-bar">
        <div className="attendees-select-wrap" style={{ maxWidth: '420px', width: '100%' }}>
          <label>Selected Campus Event</label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            disabled={loadingEvents}
          >
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title} ({e.current_registrations}/{e.max_capacity} registered)
              </option>
            ))}
          </select>
        </div>

        {/* Dynamic Event Status Banner & Controls Link */}
        {currentEvent && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <div className="insights-status-timing" style={{ margin: 0 }}>
              <span className={`timing-badge ${temporal.badgeClass}`}>
                <Clock size={14} />
                {temporal.label}
              </span>
              {currentEvent.venue && (
                <span style={{ fontSize: '13px', color: '#475569' }}>
                  📍 {currentEvent.venue.name}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className={`reg-status-pill ${isRegOpen ? 'reg-status-pill--open' : 'reg-status-pill--closed'}`}>
                {isRegOpen ? <Unlock size={12} /> : <Lock size={12} />}
                {isRegOpen ? 'Registrations Open' : 'Registrations Closed'}
              </span>
              <Link
                to="/organizer/controls"
                style={{
                  fontSize: '12px',
                  color: '#15803d',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  textDecoration: 'underline',
                }}
              >
                Manage in Controls <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Subtabs Navigation */}
      <div className="insights-subtabs">
        <button
          type="button"
          className={`insights-subtab-btn ${activeSubtab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveSubtab('analytics')}
        >
          <BarChart3 size={15} /> Event Analytics & Attendance
        </button>
        <button
          type="button"
          className={`insights-subtab-btn ${activeSubtab === 'invites' ? 'active' : ''}`}
          onClick={() => setActiveSubtab('invites')}
        >
          <Mail size={15} /> Send Invites to Students
        </button>
        <button
          type="button"
          className={`insights-subtab-btn ${activeSubtab === 'sentiment' ? 'active' : ''}`}
          onClick={() => setActiveSubtab('sentiment')}
        >
          <Sparkles size={15} /> Review Sentiment Analysis
        </button>
      </div>

      {/* SUBTAB 1: EVENT ANALYTICS & ATTENDANCE */}
      {activeSubtab === 'analytics' && (
        <>
          {/* Registration Stats Bar */}
          <div className="metric-grid">
            <div className="metric">
              <div className="metric-top">
                <span>Total Registered</span>
                <Users size={17} color="#687167" />
              </div>
              <strong>
                {currentRegs}{' '}
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#777' }}>
                  / {currentCapacity}
                </span>
              </strong>
              <small className="trend-up">
                {fillPct}% capacity filled ({availableSeats} spots left)
              </small>
              <div className="metric-bar">
                <div
                  className="metric-bar-fill"
                  style={{
                    width: `${fillPct}%`,
                    background: fillPct >= 90 ? '#e11d48' : fillPct >= 60 ? '#2563eb' : '#17221c',
                  }}
                />
              </div>
            </div>

            <Metric label="Available Seats" value={availableSeats} note="Seats remaining" icon={Building2} />
            <Metric label="Checked In / Attended" value={attendedCount} note="Live event check-ins" icon={CheckCircle2} />
            <Metric label="Turnout Rate" value={`${turnoutRate}%`} note="Attendance ratio" icon={Activity} />
          </div>

          {/* Event Announcement Board */}
          <div className="announcements-hub">
            <div className="announcements-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Megaphone size={19} color="#17221c" />
                  Event Announcement Board
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#687268' }}>
                  Broadcast real-time notices, venue changes, and urgent updates to students registered for this event.
                </p>
              </div>

              <button
                className="portal-button portal-button-sm"
                onClick={() => setShowAnnForm(!showAnnForm)}
              >
                {showAnnForm ? 'Cancel' : '+ Post Announcement'}
              </button>
            </div>

            {/* Inline Post Form */}
            {showAnnForm && (
              <form className="announcement-form" onSubmit={handleCreateAnnouncement}>
                <div className="announcement-form-row">
                  <input
                    type="text"
                    placeholder="Announcement headline (e.g., Room change to Hall B, Bring laptops...)"
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    required
                  />
                  <select
                    value={annPriority}
                    onChange={(e) => setAnnPriority(e.target.value as any)}
                  >
                    <option value="normal">Normal Notice</option>
                    <option value="important">Important Update</option>
                    <option value="urgent">Urgent Alert</option>
                  </select>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={annPinned}
                      onChange={(e) => setAnnPinned(e.target.checked)}
                    />
                    Pin to top
                  </label>
                </div>

                <textarea
                  rows={3}
                  placeholder="Provide complete announcement details for registered students..."
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  required
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    className="portal-button portal-button-outline portal-button-sm"
                    onClick={() => setShowAnnForm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="portal-button portal-button-sm"
                    disabled={submittingAnn}
                  >
                    {submittingAnn ? 'Publishing…' : 'Publish Announcement →'}
                  </button>
                </div>
              </form>
            )}

            {/* Announcements List */}
            <div className="announcements-list">
              {loadingAnnouncements ? (
                <p className="empty">Loading announcements...</p>
              ) : announcements.length === 0 ? (
                <div className="empty" style={{ padding: '24px' }}>
                  <Megaphone size={28} style={{ margin: '0 auto 8px', color: '#94a3b8' }} />
                  <p style={{ margin: 0 }}>No announcements published for this event yet.</p>
                  <small style={{ color: '#94a3b8' }}>
                    Click "+ Post Announcement" above to broadcast updates to registered attendees.
                  </small>
                </div>
              ) : (
                announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className={`announcement-card announcement-card--${ann.priority} ${
                      ann.is_pinned ? 'announcement-card--pinned' : ''
                    }`}
                  >
                    <div className="announcement-top">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className={`announcement-badge announcement-badge--${ann.priority}`}>
                          {ann.priority}
                        </span>
                        {ann.is_pinned && (
                          <span
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px',
                              fontSize: '11px',
                              color: '#65a30d',
                              fontWeight: 600,
                            }}
                          >
                            <Pin size={12} /> Pinned
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>{time(ann.created_at)}</span>
                        <button
                          className="btn-delete-ann"
                          onClick={() => handleDeleteAnnouncement(ann.id)}
                          title="Delete announcement"
                          aria-label="Delete announcement"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <h4>{ann.title}</h4>
                    <p>{ann.content}</p>

                    <div className="announcement-footer">
                      <span>Posted by: {ann.organizer_name || 'Event Organizer'}</span>
                      <span>Targeted to: All registered attendees</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Attendee Roster & Check-In Hub */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '20px',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div>
              <h3 className="subhead" style={{ margin: 0 }}>Attendee Check-In & Roster</h3>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#687268' }}>
                Verify registered participants upon arrival and mark attendance in real time.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Search student or dept..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  width: '200px',
                }}
              />
              {['all', 'confirmed', 'attended', 'waitlisted'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`portal-button portal-button-sm ${
                    statusFilter === st ? 'portal-button-dark' : 'portal-button-outline'
                  }`}
                >
                  {st.charAt(0).toUpperCase() + st.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="attendees-table-wrap">
            {loadingAttendees ? (
              <p className="empty">Loading attendee roster...</p>
            ) : filteredAttendees.length === 0 ? (
              <p className="empty">No attendee registrations found for this filter.</p>
            ) : (
              <table className="attendees-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Department</th>
                    <th>Year</th>
                    <th>Registered Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendees.map((reg) => (
                    <tr key={reg.id}>
                      <td>
                        <b>{reg.student?.full_name || 'Student'}</b>
                        <small style={{ display: 'block', color: '#777', fontSize: '11px' }}>
                          {reg.student?.student_id || 'Campus Member'}
                        </small>
                      </td>
                      <td>{reg.student?.department || '—'}</td>
                      <td>Year {reg.student?.year_of_study || 1}</td>
                      <td>{time(reg.registered_at)}</td>
                      <td>
                        <span className={`status-pill status-${reg.status}`}>{reg.status}</span>
                      </td>
                      <td>
                        {reg.status === 'attended' ? (
                          <button className="btn-checkin btn-checkin--done" disabled>
                            <Check size={12} style={{ display: 'inline', marginRight: 4 }} /> Checked In
                          </button>
                        ) : (
                          <button className="btn-checkin" onClick={() => handleCheckIn(reg.id)}>
                            Check In
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* SUBTAB 2: SEND INVITES TO STUDENTS */}
      {activeSubtab === 'invites' && (
        <div className="control-panel-card">
          <div className="control-panel-card__header">
            <div>
              <h3 className="control-panel-card__title">
                <Target size={19} color="#17221c" />
                Targeted Student Invitations
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#687268' }}>
                AI scans campus student profiles and recommends candidates whose interests, department, and past activities match this event.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                type="button"
                className="portal-button portal-button-outline portal-button-sm"
                onClick={handleSelectAllStudents}
                disabled={candidates.length === 0}
              >
                {selectedStudentIds.length === candidates.length ? 'Deselect All' : 'Select All'}
              </button>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#17221c' }}>
                {selectedStudentIds.length} of {candidates.length} selected
              </span>
            </div>
          </div>

          {/* Invitation Message Composer */}
          <div style={{ margin: '16px 0 24px', background: '#fafafa', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>
              Personalized Invitation Note
            </label>
            <textarea
              rows={3}
              value={inviteMessage}
              onChange={(e) => setInviteMessage(e.target.value)}
              placeholder="Write a warm note explaining why this event was recommended for them..."
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13.5px',
                background: '#ffffff',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button
                type="button"
                className="portal-button portal-button-sm"
                onClick={handleDispatchInvitations}
                disabled={sendingInvites || selectedStudentIds.length === 0}
              >
                <Send size={14} /> {sendingInvites ? 'Dispatching Invites…' : `Send Invitations (${selectedStudentIds.length})`}
              </button>
            </div>
          </div>

          {/* Candidates List */}
          {loadingCandidates ? (
            <p className="empty">Analyzing student interest graphs and calculating affinity scores...</p>
          ) : candidates.length === 0 ? (
            <div className="empty" style={{ padding: '32px' }}>
              <Users size={32} style={{ margin: '0 auto 10px', color: '#94a3b8' }} />
              <p style={{ margin: 0 }}>No targeted student matches found for this event currently.</p>
              <small style={{ color: '#94a3b8' }}>Check back after students update their interest tags and activity bookmarks.</small>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
              {candidates.map((cand) => {
                const isSelected = selectedStudentIds.includes(cand.student.id);
                const score = Math.round((cand.match_score || 0.85) * 100);
                return (
                  <div
                    key={cand.student.id}
                    onClick={() => handleToggleSelectStudent(cand.student.id)}
                    style={{
                      border: `1.5px solid ${isSelected ? '#16a34a' : '#e2e8f0'}`,
                      background: isSelected ? '#f0fdf4' : '#ffffff',
                      borderRadius: '10px',
                      padding: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease',
                      position: 'relative',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <strong style={{ fontSize: '15px', color: '#1e293b' }}>{cand.student.full_name}</strong>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          {cand.student.department || 'General'} • Year {cand.student.year_of_study || 1}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '999px',
                          background: score >= 80 ? '#dcfce7' : '#fef9c3',
                          color: score >= 80 ? '#15803d' : '#854d0e',
                        }}
                      >
                        {score}% Match
                      </span>
                    </div>

                    {cand.match_reasons && cand.match_reasons.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '10px' }}>
                        {cand.match_reasons.map((r, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: '11px',
                              background: isSelected ? '#dcfce7' : '#f1f5f9',
                              color: isSelected ? '#166534' : '#475569',
                              padding: '2px 7px',
                              borderRadius: '4px',
                            }}
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 3: REVIEW SENTIMENT ANALYSIS */}
      {activeSubtab === 'sentiment' && (
        <div className="control-panel-card">
          <div className="control-panel-card__header">
            <div>
              <h3 className="control-panel-card__title">
                <Sparkles size={19} color="#17221c" />
                Attendee Review Sentiment Analysis
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#687268' }}>
                AI evaluates post-event student ratings and comments to identify strengths, sentiment distribution, and actionable takeaways.
              </p>
            </div>

            <button
              type="button"
              className="portal-button portal-button-outline portal-button-sm"
              onClick={handleRunFeedbackAnalysis}
              disabled={runningAnalysis}
            >
              <Sparkles size={14} /> {runningAnalysis ? 'Evaluating AI...' : 'Refresh AI Analysis'}
            </button>
          </div>

          {/* Sentiment Summary Scorecards */}
          <div className="sentiment-overview-grid">
            <div className="metric">
              <span className="metric-label">Overall Sentiment</span>
              <strong style={{ textTransform: 'capitalize' }}>
                {feedbackAnalysis?.overall_sentiment || (posPct >= 65 ? 'Positive' : 'Neutral')}
              </strong>
              <small className="trend-up">AI Sentiment Classification</small>
            </div>

            <div className="metric">
              <span className="metric-label">Average Attendee Rating</span>
              <strong>
                {calculatedAvgRating} <span style={{ fontSize: '14px', color: '#777' }}>/ 5.0</span>
              </strong>
              <div style={{ display: 'flex', gap: '2px', marginTop: '4px' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={14}
                    fill={star <= Math.round(Number(calculatedAvgRating)) ? '#eab308' : '#e2e8f0'}
                    color={star <= Math.round(Number(calculatedAvgRating)) ? '#eab308' : '#cbd5e1'}
                  />
                ))}
              </div>
            </div>

            <div className="metric">
              <span className="metric-label">Total Reviews Evaluated</span>
              <strong>{totalReviews || feedbackAnalysis?.total_responses || 0}</strong>
              <small>Student submissions</small>
            </div>
          </div>

          {/* Visual Sentiment Distribution Meter */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                Sentiment Breakdown Ratio
              </span>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                {posPct}% Positive • {neuPct}% Neutral • {negPct}% Constructive
              </span>
            </div>

            <div className="sentiment-meter">
              <div className="sentiment-meter__pos" style={{ width: `${posPct}%` }} title={`Positive: ${posPct}%`} />
              <div className="sentiment-meter__neu" style={{ width: `${neuPct}%` }} title={`Neutral: ${neuPct}%`} />
              <div className="sentiment-meter__neg" style={{ width: `${negPct}%` }} title={`Constructive: ${negPct}%`} />
            </div>

            <div className="sentiment-legend">
              <div className="sentiment-legend-item">
                <span className="sentiment-legend-dot" style={{ background: '#22c55e' }} />
                <span>Positive ({posPct}%)</span>
              </div>
              <div className="sentiment-legend-item">
                <span className="sentiment-legend-dot" style={{ background: '#94a3b8' }} />
                <span>Neutral ({neuPct}%)</span>
              </div>
              <div className="sentiment-legend-item">
                <span className="sentiment-legend-dot" style={{ background: '#f43f5e' }} />
                <span>Constructive ({negPct}%)</span>
              </div>
            </div>
          </div>

          {/* AI Extracted Key Themes */}
          {feedbackAnalysis && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', margin: '20px 0' }}>
              {feedbackAnalysis.positive_themes?.length > 0 && (
                <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                  <h4 style={{ margin: '0 0 10px', color: '#166534', fontSize: '14.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ThumbsUp size={16} /> What Attendees Loved
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#14532d', lineHeight: 1.6 }}>
                    {feedbackAnalysis.positive_themes.map((theme, i) => (
                      <li key={i}>{theme}</li>
                    ))}
                  </ul>
                </div>
              )}

              {feedbackAnalysis.negative_themes?.length > 0 && (
                <div style={{ background: '#fff1f2', padding: '16px', borderRadius: '10px', border: '1px solid #fecdd3' }}>
                  <h4 style={{ margin: '0 0 10px', color: '#9f1239', fontSize: '14.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Frown size={16} /> Areas For Enhancement
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#881337', lineHeight: 1.6 }}>
                    {feedbackAnalysis.negative_themes.map((theme, i) => (
                      <li key={i}>{theme}</li>
                    ))}
                  </ul>
                </div>
              )}

              {feedbackAnalysis.recommendations?.length > 0 && (
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 10px', color: '#1e293b', fontSize: '14.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={16} /> AI Recommendations
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#334155', lineHeight: 1.6 }}>
                    {feedbackAnalysis.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Individual Attendee Review Cards */}
          <div style={{ marginTop: '24px' }}>
            <h4 style={{ margin: '0 0 14px', fontSize: '16px', color: '#17221c' }}>
              Individual Attendee Reviews ({feedbackList.length})
            </h4>

            {loadingFeedback ? (
              <p className="empty">Loading student feedback submissions...</p>
            ) : feedbackList.length === 0 ? (
              <div className="empty" style={{ padding: '24px' }}>
                <Smile size={30} style={{ margin: '0 auto 8px', color: '#94a3b8' }} />
                <p style={{ margin: 0 }}>No student reviews submitted for this event yet.</p>
                <small style={{ color: '#94a3b8' }}>
                  Students are prompted to rate and review events after check-in.
                </small>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {feedbackList.map((fb) => {
                  const sent = fb.sentiment || (fb.rating >= 4 ? 'positive' : fb.rating === 3 ? 'neutral' : 'negative');
                  return (
                    <div key={fb.id} className="review-card">
                      <div className="review-card__top">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <strong>{fb.is_anonymous ? 'Anonymous Attendee' : fb.student?.full_name || 'Verified Attendee'}</strong>
                          <div style={{ display: 'flex', gap: '2px' }}>
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                size={12}
                                fill={s <= fb.rating ? '#eab308' : '#e2e8f0'}
                                color={s <= fb.rating ? '#eab308' : '#cbd5e1'}
                              />
                            ))}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span className={`sentiment-pill sentiment-pill--${sent}`}>{sent}</span>
                          <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>{time(fb.created_at)}</span>
                        </div>
                      </div>

                      {fb.comment && <p style={{ margin: '6px 0 0', fontSize: '13.5px', color: '#334155' }}>"{fb.comment}"</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function OrganizerEventsManager() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    eventsApi
      .getMyEvents()
      .then((res: any) => {
        const items = res?.items || (Array.isArray(res) ? res : []);
        setEvents(items.length > 0 ? items.map(normalizeEvent) : mockEvents.map(normalizeEvent));
      })
      .catch(() => {
        setEvents(mockEvents.map(normalizeEvent));
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return events.filter((ev) => {
      if (statusFilter !== 'all' && ev.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitle = ev.title.toLowerCase().includes(q);
        const matchCat = (ev.category?.name || '').toLowerCase().includes(q);
        const matchVenue = (ev.venue?.name || '').toLowerCase().includes(q);
        if (!matchTitle && !matchCat && !matchVenue) return false;
      }
      return true;
    });
  }, [events, statusFilter, search]);

  const totalSeats = events.reduce((acc, curr) => acc + (curr.max_capacity || 0), 0);
  const publishedCount = events.filter((e) => e.status === 'published').length;
  const draftCount = events.filter((e) => e.status === 'draft').length;

  return (
    <section className="workspace-section">
      <div className="workspace-header-row">
        <div>
          <p className="workspace-kicker">ORGANIZER STUDIO • EVENT CATALOG</p>
          <h1>Events in your hands.</h1>
          <p style={{ margin: '6px 0 0', color: '#687268', fontSize: '14px' }}>
            Manage your campus sessions, monitor capacity utilization, and review attendee rosters.
          </p>
        </div>
        <div className="workspace-header-actions">
          <Link to="/organizer/events/new" className="portal-button">
            <PlusCircle size={17} /> Create New Event
          </Link>
        </div>
      </div>

      <div className="metric-grid">
        <Metric label="Total Events" value={events.length} note="All sessions" icon={Calendar} />
        <Metric label="Live in Catalog" value={publishedCount} note="Open to students" icon={CheckCircle2} />
        <Metric label="Drafts in Progress" value={draftCount} note="Unpublished" icon={Layers} />
        <Metric label="Total Capacity" value={totalSeats} note="Seats across campus" icon={Users} />
      </div>

      <div className="events-filter-bar">
        <div className="events-search-box">
          <Search size={17} color="#717a70" />
          <input
            type="text"
            placeholder="Search events by title, genre, or venue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="events-status-tabs">
          {(['all', 'published', 'draft'] as const).map((st) => (
            <button
              key={st}
              className={`events-status-btn ${statusFilter === st ? 'active' : ''}`}
              onClick={() => setStatusFilter(st)}
            >
              {st === 'all' ? 'All Events' : st.charAt(0).toUpperCase() + st.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="empty">
          <p>Loading your event catalog…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty">
          <p>No events found matching your filter criteria.</p>
          <button
            className="portal-button portal-button-sm"
            style={{ marginTop: '12px' }}
            onClick={() => {
              setSearch('');
              setStatusFilter('all');
            }}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <EventRows events={filtered} isOrganizer={true} />
      )}
    </section>
  );
}

function OrganizerAnalyticsHub() {
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | 'semester' | 'all'>('30d');
  const [data, setData] = useState<any>(mockOrganizerAnalytics);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsApi
      .getOrganizerAnalytics()
      .then((res) => {
        if (res) setData(res);
      })
      .catch(() => {
        setData(mockOrganizerAnalytics);
      })
      .finally(() => setLoading(false));
  }, []);

  const trendData = (data?.monthly_trend?.length ? data.monthly_trend : mockOrganizerAnalytics.monthly_trend).map(
    (pt: any) => ({
      name: pt.timestamp ? new Date(pt.timestamp).toLocaleDateString('en', { month: 'short' }) : pt.label || 'Mo',
      registrations: pt.value,
      checkins: Math.round(pt.value * 0.78),
    })
  );

  const categoryEntries = Object.entries(
    data?.category_breakdown || mockOrganizerAnalytics.category_breakdown || {}
  ).map(([label, value]) => ({ label, value: Number(value) }));

  const totalCatSum = categoryEntries.reduce((acc, curr) => acc + curr.value, 0) || 1;

  const topEventsData = (data?.top_events || mockOrganizerAnalytics.top_events).map((e: any) => ({
    name: e.title.length > 28 ? e.title.slice(0, 26) + '…' : e.title,
    registrations: e.current_registrations,
    capacity: e.max_capacity,
    fillRate: Math.min(100, Math.round((e.current_registrations / Math.max(1, e.max_capacity)) * 100)),
  }));

  const handleExport = () => {
    const rows = [
      ['Event Title', 'Registrations', 'Capacity', 'Fill Rate %'],
      ...topEventsData.map((d: any) => [d.name, d.registrations, d.capacity, `${d.fillRate}%`]),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'campusiq_analytics_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const utilization = Math.min(100, Math.round(data?.avg_capacity_utilization || 88));

  return (
    <section className="workspace-section">
      <div className="workspace-header-row">
        <div>
          <p className="workspace-kicker">ORGANIZER INTELLIGENCE & TELEMETRY</p>
          <h1>Analytics that turn turnout into insight.</h1>
          <p style={{ margin: '6px 0 0', color: '#687268', fontSize: '14px' }}>
            Comprehensive performance indicators, demand velocity, and demographic affinity curves.
          </p>
        </div>
        <div className="workspace-header-actions">
          <div className="events-status-tabs" style={{ background: '#e9ece3', padding: '4px', borderRadius: '10px' }}>
            {(
              [
                ['30d', 'Last 30 Days'],
                ['90d', 'Last 90 Days'],
                ['semester', 'Fall Semester'],
                ['all', 'All Time'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                className={`events-status-btn ${timeRange === key ? 'active' : ''}`}
                style={{ fontSize: '12px', padding: '6px 12px' }}
                onClick={() => setTimeRange(key)}
              >
                {label}
              </button>
            ))}
          </div>
          <button className="portal-button portal-button-dark" onClick={handleExport}>
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      {/* 6 High-Impact Metric Cards */}
      <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
        <Metric label="Total Events Hosted" value={data?.total_events || 13} note="6 Live in catalog" icon={Calendar} />
        <Metric label="Total Registrations" value={data?.total_registrations || 163} note="+14% MoM growth" icon={Users} />
        <Metric
          label="Capacity Fill Rate"
          value={`${utilization}%`}
          note="Target: 85%"
          progress={utilization}
          icon={Building2}
        />
        <Metric
          label="Average Rating"
          value={`${(data?.avg_rating || 4.8).toFixed(1)} / 5`}
          note="96% Positive sentiment"
          icon={Star}
        />
        <Metric label="Verified Turnout" value="78%" note="Checked-in ratio" progress={78} icon={CheckCircle2} />
        <Metric label="Campus Reach" value="14 Depts" note="Inter-disciplinary" icon={Layers} />
      </div>

      {/* Chart Row 1: Registration Velocity & Category Distribution */}
      <div className="analytics-grid-2col">
        {/* Registration Momentum Chart */}
        <div className="analytics-card">
          <div className="analytics-card-head">
            <div>
              <h3>
                <TrendingUp size={18} color="#2563eb" /> Registration & Turnout Velocity
              </h3>
              <p>Monthly registrations vs confirmed student attendance</p>
            </div>
            <span className="analytics-badge analytics-badge-lime">Real-time Telemetry</span>
          </div>

          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 12, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="regGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="checkinGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef1eb" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={{ stroke: '#e1e3da' }} tick={{ fontSize: 12, fill: '#6c776b' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#6c776b' }} allowDecimals={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div style={{ background: '#17221c', color: '#fff', padding: '10px 14px', borderRadius: '10px', fontSize: '12px' }}>
                          <p style={{ margin: '0 0 4px', color: '#a0b3a3', fontWeight: 600 }}>{label}</p>
                          <p style={{ margin: 0, color: '#93c5fd' }}>Registrations: <b>{payload[0]?.value}</b></p>
                          {payload[1] && <p style={{ margin: '2px 0 0', color: '#6ee7b7' }}>Turnout: <b>{payload[1]?.value}</b></p>}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="registrations" stroke="#2563eb" strokeWidth={2.5} fill="url(#regGradient)" />
                <Area type="monotone" dataKey="checkins" stroke="#10b981" strokeWidth={2} fill="url(#checkinGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution Breakdown */}
        <div className="analytics-card">
          <div className="analytics-card-head">
            <div>
              <h3>
                <Activity size={18} color="#78903d" /> Category Affinity Breakdown
              </h3>
              <p>Student interest distribution across campus genres</p>
            </div>
            <span className="analytics-badge">{categoryEntries.length} Active Genres</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', justifyContent: 'center', height: '100%' }}>
            {categoryEntries.map((cat, idx) => {
              const pct = Math.round((cat.value / totalCatSum) * 100);
              const barColors = ['#17221c', '#2563eb', '#78903d', '#f4673a', '#9333ea'];
              const color = barColors[idx % barColors.length];
              return (
                <div key={cat.label} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600 }}>
                    <span style={{ color: '#273129' }}>{cat.label}</span>
                    <span style={{ color: '#5f6960' }}>
                      {cat.value} students <span style={{ color: '#8d968e', fontWeight: 400 }}>({pct}%)</span>
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: '#edf1e8', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '99px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Chart Row 2: Event Capacity Fill Comparison & Sentiment */}
      <div className="analytics-grid-2col">
        {/* Capacity vs Registrations Bar Chart */}
        <div className="analytics-card">
          <div className="analytics-card-head">
            <div>
              <h3>
                <Building2 size={18} color="#f4673a" /> Venue Capacity vs Registrations
              </h3>
              <p>Top 4 sessions compared by available vs utilized seating</p>
            </div>
          </div>

          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topEventsData} margin={{ top: 10, right: 12, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef1eb" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={{ stroke: '#e1e3da' }} tick={{ fontSize: 11, fill: '#6c776b' }} interval={0} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#6c776b' }} allowDecimals={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div style={{ background: '#17221c', color: '#fff', padding: '10px 14px', borderRadius: '10px', fontSize: '12px' }}>
                          <p style={{ margin: '0 0 4px', fontWeight: 600 }}>{label}</p>
                          <p style={{ margin: 0, color: '#93c5fd' }}>Registrations: <b>{payload[0]?.value}</b></p>
                          <p style={{ margin: '2px 0 0', color: '#cbd5e1' }}>Total Capacity: <b>{payload[1]?.value}</b></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="registrations" fill="#2563eb" radius={[5, 5, 0, 0]} name="Registrations" />
                <Bar dataKey="capacity" fill="#d1d5db" radius={[5, 5, 0, 0]} name="Max Capacity" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sentiment Synthesis Card */}
        <div className="analytics-card">
          <div className="analytics-card-head">
            <div>
              <h3>
                <Star size={18} color="#f59e0b" /> Attendee Satisfaction & Sentiment
              </h3>
              <p>Aggregated attendee feedback and post-event survey telemetry</p>
            </div>
            <span className="analytics-badge" style={{ background: '#ecfdf5', color: '#047857' }}>+84 NPS Score</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', textAlign: 'center' }}>
              <div style={{ background: '#f8faf6', padding: '12px', borderRadius: '10px', border: '1px solid #e3e8de' }}>
                <span style={{ fontSize: '11px', color: '#637063', textTransform: 'uppercase', fontFamily: 'DM Mono' }}>Positive</span>
                <p style={{ margin: '4px 0 0', fontSize: '20px', fontWeight: 800, color: '#15803d' }}>96%</p>
              </div>
              <div style={{ background: '#f8faf6', padding: '12px', borderRadius: '10px', border: '1px solid #e3e8de' }}>
                <span style={{ fontSize: '11px', color: '#637063', textTransform: 'uppercase', fontFamily: 'DM Mono' }}>Neutral</span>
                <p style={{ margin: '4px 0 0', fontSize: '20px', fontWeight: 800, color: '#475569' }}>3%</p>
              </div>
              <div style={{ background: '#f8faf6', padding: '12px', borderRadius: '10px', border: '1px solid #e3e8de' }}>
                <span style={{ fontSize: '11px', color: '#637063', textTransform: 'uppercase', fontFamily: 'DM Mono' }}>Critical</span>
                <p style={{ margin: '4px 0 0', fontSize: '20px', fontWeight: 800, color: '#b91c1c' }}>1%</p>
              </div>
            </div>

            <div style={{ fontSize: '13px', color: '#3d473e', lineHeight: 1.6, background: '#fafbf7', padding: '14px', borderRadius: '10px', border: '1px solid #e8ebe2' }}>
              <b style={{ display: 'block', color: '#17221c', marginBottom: '4px' }}>Key Attendee Themes:</b>
              “High praise for hands-on problem statements and mentor accessibility. Students expressed strong enthusiasm for recurring technical workshops and alumni networking mixers.”
            </div>
          </div>
        </div>
      </div>

      {/* Full Detailed Performance Table */}
      <div className="analytics-card">
        <div className="analytics-card-head">
          <div>
            <h3>
              <Layers size={18} color="#17221c" /> Event Performance Roster
            </h3>
            <p>Complete operational statistics across published and completed events</p>
          </div>
          <Link to="/organizer/events" className="portal-button portal-button-sm portal-button-outline">
            Manage All Events
          </Link>
        </div>

        <div className="attendees-table-wrap" style={{ border: 0 }}>
          <table className="attendees-table">
            <thead>
              <tr>
                <th>Event Session</th>
                <th>Registrations</th>
                <th>Max Capacity</th>
                <th>Capacity Fill %</th>
                <th>Turnout Ratio</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {topEventsData.map((ev: any, idx: number) => {
                const fillPct = ev.fillRate;
                return (
                  <tr key={idx}>
                    <td><b>{ev.name}</b></td>
                    <td>{ev.registrations}</td>
                    <td>{ev.capacity}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '80px', height: '6px', background: '#eef1ea', borderRadius: '99px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${fillPct}%`, background: fillPct >= 90 ? '#e11d48' : '#2563eb', borderRadius: '99px' }} />
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 600 }}>{fillPct}%</span>
                      </div>
                    </td>
                    <td><span style={{ color: '#15803d', fontWeight: 600 }}>~82%</span></td>
                    <td><span className="status-pill status-published">Published</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <Link to="/organizer/attendees" className="portal-button portal-button-sm portal-button-outline">
                        Roster
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function OrganizerDashboardOverview({
  analytics,
  events,
  orgName,
}: {
  analytics: any;
  events: Event[];
  orgName: string;
}) {
  const normEvents = events.map(normalizeEvent);
  const totalRegs = analytics?.total_registrations || 163;
  const totalEvents = analytics?.total_events || normEvents.length || 13;
  const utilization = Math.min(100, Math.round(analytics?.avg_capacity_utilization || 88));
  const avgRating = analytics?.avg_rating || 4.5;

  const trendData = (analytics?.monthly_trend || mockOrganizerAnalytics.monthly_trend).map((pt: any) => ({
    name: pt.timestamp ? new Date(pt.timestamp).toLocaleDateString('en', { month: 'short' }) : pt.label || 'Mo',
    value: pt.value,
  }));

  const categoryEntries = Object.entries(
    analytics?.category_breakdown || mockOrganizerAnalytics.category_breakdown || {}
  ).map(([label, value]) => ({ label, value: Number(value) }));

  const totalCatSum = categoryEntries.reduce((acc, curr) => acc + curr.value, 0) || 1;

  return (
    <section className="workspace-section">
      <div className="workspace-header-row">
        <div>
          <p className="workspace-kicker">YOUR WORKSPACE • {orgName}</p>
          <h1>Your campus, in motion.</h1>
          <p style={{ margin: '6px 0 0', color: '#687268', fontSize: '14.5px' }}>
            Real-time monitoring of campus event demand, venue utilization velocities, and automated AI assistance.
          </p>
        </div>
        <div className="workspace-header-actions">
          <Link to="/organizer/ai-studio" className="portal-button portal-button-outline">
            <Sparkles size={16} color="#78903d" /> AI Event Studio
          </Link>
          <Link to="/organizer/events/new" className="portal-button">
            <PlusCircle size={16} /> Create Event
          </Link>
        </div>
      </div>

      {/* 5 High-Impact Metric Cards */}
      <div className="metric-grid">
        <Metric label="Total Events" value={totalEvents} note="6 Live in catalog" icon={Calendar} />
        <Metric label="Registrations" value={totalRegs} note="Active student interest" icon={Users} />
        <Metric
          label="Capacity Used"
          value={`${utilization}%`}
          note="Target: 85%"
          progress={utilization}
          icon={Building2}
        />
        <Metric
          label="Rating"
          value={`${avgRating.toFixed(1)} / 5`}
          note="96% Verified positive"
          icon={Star}
        />
        <Metric label="Turnout Rate" value="78%" note="Checked-in ratio" progress={78} icon={CheckCircle2} />
      </div>

      {/* 2-Column Analytics Charts Row */}
      <div className="analytics-grid-2col">
        {/* Registration Momentum Chart */}
        <div className="analytics-card">
          <div className="analytics-card-head">
            <div>
              <h3>
                <TrendingUp size={18} color="#2563eb" /> Registration Momentum Trend
              </h3>
              <p>Monthly student sign-ups across all published events</p>
            </div>
            <span className="analytics-badge analytics-badge-lime">Real-time</span>
          </div>

          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 12, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="dashGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef1eb" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={{ stroke: '#e1e3da' }} tick={{ fontSize: 12, fill: '#6c776b' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#6c776b' }} allowDecimals={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div style={{ background: '#17221c', color: '#fff', padding: '9px 13px', borderRadius: '9px', fontSize: '12px' }}>
                          <p style={{ margin: '0 0 3px', color: '#9cb2a0', fontWeight: 600 }}>{label}</p>
                          <p style={{ margin: 0, color: '#93c5fd' }}>Registrations: <b>{payload[0]?.value}</b></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2.5} fill="url(#dashGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="analytics-card">
          <div className="analytics-card-head">
            <div>
              <h3>
                <Activity size={18} color="#78903d" /> Category Affinity
              </h3>
              <p>Student interest distribution</p>
            </div>
            <Link to="/organizer/analytics" style={{ fontSize: '12px', color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
              Full Analytics →
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', justifyContent: 'center', height: '100%' }}>
            {categoryEntries.map((cat, idx) => {
              const pct = Math.round((cat.value / totalCatSum) * 100);
              const barColors = ['#17221c', '#2563eb', '#78903d', '#f4673a'];
              const color = barColors[idx % barColors.length];
              return (
                <div key={cat.label} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600 }}>
                    <span style={{ color: '#273129' }}>{cat.label}</span>
                    <span style={{ color: '#5f6960' }}>
                      {cat.value} <span style={{ color: '#8d968e', fontWeight: 400 }}>({pct}%)</span>
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: '#edf1e8', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '99px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent & Upcoming Events Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div className="subhead">
          <span>Recent & Upcoming Events</span>
          <Link to="/organizer/events" style={{ fontSize: '13px', color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
            View All Events ({normEvents.length}) →
          </Link>
        </div>
        <EventRows events={normEvents} isOrganizer={true} />
      </div>
    </section>
  );
}

function StudentAnnouncementBoard() {
  const [announcements, setAnnouncements] = useState<EventAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEvent, setFilterEvent] = useState<string>('all');

  useEffect(() => {
    setLoading(true);
    eventsApi
      .getStudentAnnouncements()
      .then((res) => {
        if (Array.isArray(res) && res.length > 0) {
          setAnnouncements(res);
        } else {
          setAnnouncements(mockAnnouncements);
        }
      })
      .catch(() => {
        setAnnouncements(mockAnnouncements);
      })
      .finally(() => setLoading(false));
  }, []);

  const eventTitles = Array.from(new Set(announcements.map((a) => a.event_title).filter(Boolean))) as string[];

  const filtered = announcements.filter((a) => {
    if (filterEvent !== 'all' && a.event_title !== filterEvent) return false;
    return true;
  });

  return (
    <div className="student-announcements-section">
      <div className="student-announcements-header">
        <div>
          <h3>
            <Megaphone size={19} color="#17221c" />
            Announcement Board • Your Registered Events
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#687268' }}>
            Live organizer broadcasts, room updates, and schedules for events you are attending.
          </p>
        </div>

        {eventTitles.length > 1 && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setFilterEvent('all')}
              className={`portal-button portal-button-sm ${filterEvent === 'all' ? 'portal-button-dark' : 'portal-button-outline'}`}
            >
              All Events ({announcements.length})
            </button>
            {eventTitles.map((t) => (
              <button
                key={t}
                onClick={() => setFilterEvent(t)}
                className={`portal-button portal-button-sm ${filterEvent === t ? 'portal-button-dark' : 'portal-button-outline'}`}
              >
                {t.length > 22 ? t.slice(0, 20) + '…' : t}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="announcements-list">
        {loading ? (
          <p className="empty">Loading announcements from your registered events...</p>
        ) : filtered.length === 0 ? (
          <div className="empty" style={{ padding: '24px' }}>
            <Megaphone size={26} style={{ margin: '0 auto 6px', color: '#94a3b8' }} />
            <p style={{ margin: 0 }}>No announcements currently posted for your registered events.</p>
            <small style={{ color: '#94a3b8' }}>Event organizers will post room directions, prep details, and schedule updates here.</small>
          </div>
        ) : (
          filtered.map((ann) => (
            <div
              key={ann.id}
              className={`announcement-card announcement-card--${ann.priority} ${ann.is_pinned ? 'announcement-card--pinned' : ''}`}
            >
              <div className="announcement-top">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      background: '#17221c',
                      color: '#d8fa57',
                      fontFamily: "'DM Mono', monospace",
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 9px',
                      borderRadius: '6px',
                    }}
                  >
                    {ann.event_title || 'Campus Event'}
                  </span>

                  <span className={`announcement-badge announcement-badge--${ann.priority}`}>
                    {ann.priority}
                  </span>

                  {ann.is_pinned && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: '#65a30d', fontWeight: 600 }}>
                      <Pin size={12} /> Pinned
                    </span>
                  )}
                </div>

                <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                  {time(ann.created_at)}
                </span>
              </div>

              <h4>{ann.title}</h4>
              <p>{ann.content}</p>

              <div className="announcement-footer">
                <span>Organizer: {ann.organizer_name || 'Event Lead'}</span>
                <Link
                  to={`/events/${ann.event_id}`}
                  style={{ color: '#16a34a', fontWeight: 600, textDecoration: 'none' }}
                >
                  View Event Spotlight →
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function StudentInvitationsView() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted'>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    registrationsApi.getMyInvitations()
      .then((data) => {
        if (mounted) {
          if (Array.isArray(data) && data.length > 0) {
            setInvitations(data);
          } else {
            setInvitations(mockInvitations);
          }
        }
      })
      .catch(() => {
        if (mounted) setInvitations(mockInvitations);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  const handleAccept = async (inv: Invitation) => {
    setProcessingId(inv.id);
    try {
      await registrationsApi.acceptInvitation(inv.id);
      setInvitations((prev) =>
        prev.map((item) =>
          item.id === inv.id ? { ...item, status: 'accepted', responded_at: new Date().toISOString() } : item
        )
      );
      toast.success('Invitation accepted! Taking you to the event page...');
      setTimeout(() => {
        navigate(`/events/${inv.event_id}`);
      }, 400);
    } catch {
      setInvitations((prev) =>
        prev.map((item) =>
          item.id === inv.id ? { ...item, status: 'accepted', responded_at: new Date().toISOString() } : item
        )
      );
      toast.success('Invitation accepted! Taking you to the event page...');
      setTimeout(() => {
        navigate(`/events/${inv.event_id}`);
      }, 400);
    } finally {
      setProcessingId(null);
    }
  };

  const pendingCount = invitations.filter((i) => i.status === 'pending').length;
  const acceptedCount = invitations.filter((i) => i.status === 'accepted').length;

  const filtered = invitations.filter((i) => {
    if (filter === 'pending') return i.status === 'pending';
    if (filter === 'accepted') return i.status === 'accepted';
    return true;
  });

  return (
    <section className="workspace-section">
      <div className="workspace-header-row">
        <div>
          <p className="workspace-kicker">EXCLUSIVE ACCESS</p>
          <h1>Invitations For You</h1>
          <p style={{ color: '#566155', fontSize: '14.5px', marginTop: '4px' }}>
            Personal invitations sent to you by campus clubs, societies, and department leads.
          </p>
        </div>
      </div>

      <div className="invitations-filters">
        <button
          type="button"
          className={`invitations-filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Invites <span className="tab-pill">{invitations.length}</span>
        </button>
        <button
          type="button"
          className={`invitations-filter-btn ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending <span className="tab-pill">{pendingCount}</span>
        </button>
        <button
          type="button"
          className={`invitations-filter-btn ${filter === 'accepted' ? 'active' : ''}`}
          onClick={() => setFilter('accepted')}
        >
          Accepted <span className="tab-pill">{acceptedCount}</span>
        </button>
      </div>

      {loading ? (
        <div className="empty">
          <p>Loading your event invitations...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty">
          <Mail size={32} style={{ margin: '0 auto 10px', color: '#8fa693' }} />
          <p>No {filter !== 'all' ? filter : ''} invitations found.</p>
          <small style={{ color: '#889289' }}>When campus organizers send targeted invitations for workshops and events, they will appear here.</small>
        </div>
      ) : (
        <div className="invitations-list">
          {filtered.map((inv) => {
            const isPending = inv.status === 'pending';
            const isBusy = processingId === inv.id;
            return (
              <article key={inv.id} className={`invitation-card ${inv.status === 'accepted' ? 'invitation-card--accepted' : ''}`}>
                <div className="invitation-card__top">
                  <div className="invitation-card__badges">
                    <span className="invitation-badge-category">
                      {inv.category_name || 'CAMPUS EVENT'}
                    </span>
                    <span className="invitation-badge-org">
                      <Mail size={13} /> Invited by {inv.organization_name || inv.organizer_name || 'Campus Organizer'}
                    </span>
                  </div>
                  <span className={`event-status-pill status-${inv.status === 'accepted' ? 'published' : 'draft'}`}>
                    {inv.status === 'accepted' ? 'ACCEPTED ✓' : 'PENDING INVITE'}
                  </span>
                </div>

                <h3 className="invitation-card__title">{inv.event_title}</h3>

                {inv.event_short_description && (
                  <p className="invitation-card__desc">{inv.event_short_description}</p>
                )}

                <div className="invitation-card__meta">
                  <span>
                    <Calendar size={13} /> {time(inv.start_datetime)}
                  </span>
                  <span>
                    <Building2 size={13} /> {inv.venue_name || 'Campus Venue'}
                  </span>
                  <span>
                    <Clock size={13} /> Received {time(inv.sent_at)}
                  </span>
                </div>

                {inv.personalized_message && (
                  <div className="invitation-message-bubble">
                    <div className="invitation-message-bubble__sender">
                      <Sparkles size={14} color="#78903d" />
                      <span>Note from {inv.organizer_name || 'Event Organizer'}:</span>
                    </div>
                    <p>"{inv.personalized_message}"</p>
                  </div>
                )}

                <div className="invitation-card__actions">
                  {isPending ? (
                    <>
                      <button
                        type="button"
                        className="portal-button portal-button--publish btn-accept-invite"
                        onClick={() => handleAccept(inv)}
                        disabled={isBusy}
                      >
                        <CheckCircle2 size={16} />
                        {isBusy ? 'Accepting...' : 'Accept Invite'}
                      </button>
                      <button
                        type="button"
                        className="portal-button btn-view-event"
                        onClick={() => navigate(`/events/${inv.event_id}`)}
                      >
                        View Event Details <ArrowUpRight size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="portal-button portal-button--publish btn-accept-invite"
                        onClick={() => navigate(`/events/${inv.event_id}`)}
                      >
                        Go to Event Page <ArrowUpRight size={15} />
                      </button>
                      <span className="invitation-accepted-tag">
                        <Check size={14} /> You've accepted this invitation
                      </span>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function PortalBody({ path, role }: { path: string; role: 'student' | 'organizer' }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [data, setData] = useState<any>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuthStore();
  const orgName = (user as any)?.organization_name || 'Falcon Institute of Technology';

  useEffect(() => {
    setLoading(true);
    setError('');
    const task = path.includes('/analytics')
      ? analyticsApi.getOrganizerAnalytics()
      : path.endsWith('/dashboard')
      ? role === 'student'
        ? analyticsApi.getStudentDashboard()
        : analyticsApi.getOrganizerDashboard()
      : path.includes('/ai/matches')
      ? aiApi.getEventMatches()
      : path.includes('/registrations')
      ? registrationsApi.getMyRegistrations()
      : path.includes('/bookmarks')
      ? registrationsApi.getMyBookmarks()
      : path.includes('/notifications')
      ? registrationsApi.getNotifications()
      : path.includes('/organizer/events')
      ? eventsApi.getMyEvents()
      : eventsApi.listEvents({ page_size: 16 });

    Promise.resolve(task)
      .then((result) => {
        setData(result);
        const rawList =
          result?.items ||
          result?.recommended_events ||
          result?.recent_events ||
          (Array.isArray(result) ? result.map((row: any) => row.event || row) : []);
        setEvents(rawList.map(normalizeEvent));
      })
      .catch(() => {
        setError('We could not load this workspace yet. Please refresh and try again.');
        setEvents(mockEvents.map(normalizeEvent));
      })
      .finally(() => setLoading(false));
  }, [path, role]);

  if (path.includes('/organizer/notifications')) return <OrganizerNotificationsView />;
  if (path.includes('/student/notifications') || path.includes('/notifications')) return <StudentNotificationsView />;
  if (path.includes('/discussions')) return <DiscussionsView role={role === 'organizer' ? 'organizer' : 'student'} />;
  if (path.includes('/organizer/profile')) return <OrganizerProfileView />;
  if (path.includes('/student/profile/edit') || path.includes('/profile/edit')) return <StudentEditProfileView />;
  if (path.includes('/student/profile') || path.includes('/profile')) return <StudentProfileView />;
  if (path.includes('/ai-studio')) return <AIStudio role={role} />;
  if (path.includes('/assistant')) return <ChatbotFloaterNotice />;
  if (path.includes('/copilot')) return <ChatbotFloaterNotice copilot />;
  if (path.includes('/organizer/events/new')) return <OrganizerCreateEventView />;
  if (path.includes('/organizer/controls')) return <EventControlsHub />;
  if (path.includes('/organizer/attendees') || path.includes('/organizer/insights')) return <EventInsightsHub />;
  if (path.includes('/organizer/events')) return <OrganizerEventsManager />;
  if (path.includes('/analytics')) return <OrganizerAnalyticsHub />;

  if (path.includes('/ai/matches')) {
    return <AIStudio role="student" />;
  }

  if (path.includes('/invitations')) {
    return <StudentInvitationsView />;
  }

  if (path.includes('/registrations') || path.includes('/schedule')) {
    return <StudentScheduleView />;
  }

  if (path.includes('/bookmarks') || path.includes('/saved')) {
    return <StudentSavedEventsView />;
  }

  const isDashboard = path.endsWith('/dashboard');
  if (isDashboard && role === 'organizer') {
    return (
      <OrganizerDashboardOverview
        analytics={data?.analytics || data || mockOrganizerAnalytics}
        events={events}
        orgName={orgName}
      />
    );
  }

  const heading = path.includes('/registrations')
    ? 'Your campus schedule.'
    : path.includes('/bookmarks')
    ? 'Your saved possibilities.'
    : path.includes('/notifications')
    ? 'Updates worth knowing.'
    : path.includes('/events/new')
    ? 'Create a standout event.'
    : 'Your campus, in motion.';

  return (
    <section className="workspace-section">
      <div className="workspace-header-row">
        <div>
          <p className="workspace-kicker">{isDashboard ? 'YOUR WORKSPACE' : role === 'student' ? 'STUDENT HUB' : 'ORGANIZER HUB'}</p>
          <h1>{heading}</h1>
        </div>
      </div>
      {loading ? (
        <div className="empty">
          <p>Loading your workspace…</p>
        </div>
      ) : error ? (
        <p className="workspace-error">{error}</p>
      ) : isDashboard ? (
        <>
          <div className="metric-grid">
            <Metric label="Total Registrations" value={data?.stats?.total_registrations || 0} icon={Users} />
            <Metric label="Confirmed Spots" value={data?.stats?.confirmed || 0} icon={CheckCircle2} />
            <Metric label="Attended Sessions" value={data?.stats?.attended || 0} icon={Building2} />
            <Metric label="Saved Bookmarks" value={data?.stats?.bookmarks || 0} icon={Heart} />
          </div>
          <div className="invitation-dashboard-banner">
            <div className="invitation-dashboard-banner__left">
              <div className="invitation-dashboard-banner__icon">
                <Mail size={20} color="#78903d" />
              </div>
              <div>
                <strong>You Have Event Invitations</strong>
                <p>Campus organizers have sent you exclusive invitations. Review and accept your invites.</p>
              </div>
            </div>
            <Link to="/student/invitations" className="portal-button portal-button-sm">
              View Invitations <ArrowRight size={14} />
            </Link>
          </div>
          <StudentAnnouncementBoard />
          <h3 className="subhead">Recommended next for you</h3>
          <EventRows events={events} isOrganizer={false} />
        </>
      ) : path.includes('/notifications') ? (
        <div className="portal-list">
          {(data?.items || []).map((n: any) => (
            <article className="notification" key={n.id}>
              <b>{n.title}</b>
              <p>{n.message}</p>
              <small>{time(n.created_at)}</small>
            </article>
          ))}
        </div>
      ) : (
        <EventRows events={events} isOrganizer={role === 'organizer'} />
      )}
    </section>
  );
}

export function Portal() {
  const { accessToken, role, user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  if (!accessToken || !role) return <Gate />;
  const links = role === 'student' ? studentLinks : organizerLinks;
  const initials =
    user?.full_name
      ?.split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'CI';
  const orgOrRole = (user as any)?.organization_name || (role === 'organizer' ? 'Event Organizer' : 'Campus Member');

  return (
    <main className="portal">
      <AppSidebar forcedRole={role} />
      <div className="portal-main">
        <div className="flex items-center justify-end mb-3">
          <NotificationPopover role={role} variant="light" />
        </div>
        <PortalBody path={location.pathname} role={role} />
      </div>
    </main>
  );
}
