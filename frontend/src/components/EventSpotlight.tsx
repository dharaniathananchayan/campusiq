import React, { useEffect, useState, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  Heart,
  MapPin,
  Ticket,
  Users,
  LayoutDashboard,
  Star,
  ThumbsUp,
  Megaphone,
  Pin,
  Clock,
  RotateCw,
  BellRing,
  MessageSquare,
  Send,
  Plus,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { eventsApi } from '../api/events';
import { registrationsApi } from '../api/registrations';
import { useAuthStore } from '../store/useAuthStore';
import { mockEvents } from '../data/mockData';
import type { Event, EventAnnouncement, EventForumMessage } from '../types';
import {
  getStoredForumMessages,
  saveForumMessage,
  syncBackendMessages,
} from '../utils/forumStorage';
import './EventSpotlight.css';

// Attendee Feedback & Reviews data interface
export interface EventFeedbackItem {
  id: string;
  student_name: string;
  department: string;
  year: string;
  rating: number;
  tag: string;
  comment: string;
  created_at: string;
}

const SAMPLE_FEEDBACK_DATA: Record<string, EventFeedbackItem[]> = {
  'ev-1': [
    {
      id: 'fb-1',
      student_name: 'Arjun Mehta',
      department: 'Computer Science',
      year: 'Year 3',
      rating: 5,
      tag: 'Mentorship',
      comment: 'The midnight mentor office hours were incredible! Cloud GPUs and debugging assistance allowed us to deploy our full prototype on time.',
      created_at: '2 hours ago',
    },
    {
      id: 'fb-2',
      student_name: 'Priya Nair',
      department: 'Data Science',
      year: 'Year 2',
      rating: 5,
      tag: 'Team Formation',
      comment: 'Great team formation icebreaker at the start. Found two fantastic co-hackers and the sponsor APIs had zero setup friction.',
      created_at: '5 hours ago',
    },
    {
      id: 'fb-3',
      student_name: 'Devin Cole',
      department: 'Electrical Engineering',
      year: 'Year 4',
      rating: 4.8,
      tag: 'Infrastructure',
      comment: 'Wi-Fi was rock solid in Lab 104 throughout the night. Loved the hardware sensor kits provided by the robotics lab.',
      created_at: '1 day ago',
    },
  ],
  'ev-2': [
    {
      id: 'fb-201',
      student_name: 'Tanvi Joshi',
      department: 'Computer Science',
      year: 'Year 4',
      rating: 5,
      tag: 'Keynote & Research',
      comment: 'Dr. Rao’s lecture on multi-modal reasoning models was easily the highlight of the semester. Very high signal and actionable research takeaways.',
      created_at: '3 hours ago',
    },
    {
      id: 'fb-202',
      student_name: 'Karan Malhotra',
      department: 'Mechanical Eng',
      year: 'Year 3',
      rating: 4.8,
      tag: 'Networking',
      comment: 'Met senior researchers working on edge robotics and autonomous vehicles. The poster hall layout was very well spaced.',
      created_at: '1 day ago',
    },
  ],
  'ev-3': [
    {
      id: 'fb-301',
      student_name: 'Aditya Roy',
      department: 'Business & Analytics',
      year: 'Year 2',
      rating: 5,
      tag: 'Pitch Feedback',
      comment: 'Angel investors gave sharp, no-nonsense feedback on unit economics that completely reshaped our pitch deck before finals.',
      created_at: '4 hours ago',
    },
    {
      id: 'fb-302',
      student_name: 'Meera Iyer',
      department: 'Design',
      year: 'Year 3',
      rating: 4.9,
      tag: 'Mentorship',
      comment: 'The 1-on-1 VC clinic was worth its weight in gold. Super crisp suggestions on product market fit and consumer onboarding.',
      created_at: '2 days ago',
    },
  ],
};

function getInitialFeedbackForEvent(eventId: string, title?: string): EventFeedbackItem[] {
  if (SAMPLE_FEEDBACK_DATA[eventId]) {
    return SAMPLE_FEEDBACK_DATA[eventId];
  }
  const cleanTitle = title || 'this campus event';
  return [
    {
      id: `fb-gen-1-${eventId}`,
      student_name: 'Rohan Gupta',
      department: 'Computer Science',
      year: 'Year 3',
      rating: 5,
      tag: 'Overall Experience',
      comment: `Incredible organization and hands-on session for ${cleanTitle}. Learned practical techniques directly relevant to modern engineering challenges.`,
      created_at: '1 day ago',
    },
    {
      id: `fb-gen-2-${eventId}`,
      student_name: 'Sneha Patel',
      department: 'Design & Engineering',
      year: 'Year 2',
      rating: 4.8,
      tag: 'Mentorship & Networking',
      comment: `The speakers were very approachable and gave direct, actionable feedback on our project ideas. Well worth attending!`,
      created_at: '2 days ago',
    },
  ];
}

// Default announcements fallback
const SAMPLE_ANNOUNCEMENTS: EventAnnouncement[] = [
  {
    id: 'ann-1',
    event_id: 'ev-1',
    title: '🚨 Fast-Track Badge Desk & Room Allocation',
    content: 'Registration badge pickup and room allocations are situated at the East Wing Entrance. Please have your university student ID ready upon arrival.',
    priority: 'urgent',
    is_pinned: true,
    created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
  {
    id: 'ann-2',
    event_id: 'ev-1',
    title: '📢 Speaker Lineup & Mentors Finalized',
    content: 'Guest fellows from leading industry labs will conduct interactive breakout sessions, hardware labs, and mentor office hours.',
    priority: 'important',
    is_pinned: false,
    created_at: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
  },
  {
    id: 'ann-3',
    event_id: 'ev-1',
    title: 'ℹ️ Wi-Fi Access & Cloud Credentials',
    content: 'Complimentary high-speed compute credits and lab credentials will be distributed at the start of the opening keynote.',
    priority: 'normal',
    is_pinned: false,
    created_at: new Date(Date.now() - 1000 * 60 * 1200).toISOString(),
  },
];

// Default forum messages fallback
const SAMPLE_FORUM_MESSAGES: EventForumMessage[] = [
  {
    id: 'msg-1',
    event_id: 'ev-1',
    user_id: 'user-org',
    user_name: 'Dr. Sarah Jenkins',
    user_role: 'organizer',
    message: 'Welcome everyone to the event discussion forum! Feel free to ask questions about prerequisites, room locations, or project teams.',
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
  {
    id: 'msg-2',
    event_id: 'ev-1',
    user_id: 'user-stu-1',
    user_name: 'Aarav Sharma',
    user_role: 'student',
    message: 'Will cloud GPU instances be provided during the hands-on session or do we need local CUDA setups?',
    created_at: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
  },
  {
    id: 'msg-3',
    event_id: 'ev-1',
    user_id: 'user-org',
    user_name: 'Dr. Sarah Jenkins',
    user_role: 'organizer',
    message: 'Hi Aarav! Cloud Jupyter environments with GPU acceleration are provided for all attendees. Just bring a laptop with a modern web browser!',
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
];

// Fallback resolver for all event IDs clicked in student or organizer views
const resolveEventFallback = (id: string): Event => {
  const cleanId = id.toLowerCase().replace(/[^a-z0-9]/g, '');

  // 1. Direct match in mockEvents
  const mockMatch = mockEvents.find(
    (e) => e.id.toLowerCase() === id.toLowerCase() || e.id.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanId
  );
  if (mockMatch) {
    return {
      ...mockMatch,
      has_student_forum: mockMatch.has_student_forum ?? true,
    };
  }

  // 2. HackNight
  if (cleanId.includes('hacknight') || cleanId.includes('evlive1')) {
    return {
      id: 'hacknight',
      title: 'HackNight: Build & Ship in 12 Hours',
      category: { id: 'cat-1', name: 'Engineering & Tech', slug: 'tech', is_active: true },
      short_description: 'Overnight collegiate sprint with hardware kits, cloud credits, and sponsor mentors.',
      description:
        'Join over 200 developers, designers, and innovators for an intensive 12-hour build sprint. Work in teams of up to 4 to conceptualize, prototype, and demo working software and hardware solutions. Key sponsors will provide dedicated API access, cloud GPUs, and mentor guidance throughout the night. Food, refreshments, and midnight pizza will be provided.',
      start_datetime: '2026-11-15T10:00:00Z',
      end_datetime: '2026-11-15T22:00:00Z',
      registration_deadline: '2026-11-14T23:59:00Z',
      max_capacity: 220,
      current_registrations: 184,
      available_seats: 36,
      status: 'published',
      is_featured: true,
      registration_fee: 0,
      tags: ['Hackathon', 'AI', 'Coding', 'Open Source', 'Sprint'],
      venue: {
        id: 'ven-2',
        name: 'Founders Innovation Hub · Lab 104',
        building: 'Engineering Hall',
        capacity: 220,
        is_available: true,
      },
      organizer: {
        id: 'org-1',
        full_name: 'Dr. Sarah Jenkins',
        organization_name: 'CodeCell Society & Engineering Dept',
        organization_type: 'club',
      },
      eligibility_criteria: {
        departments: ['Computer Science', 'Electrical Engineering', 'Data Science', 'All Majors'],
        year_of_study: [1, 2, 3, 4],
        custom_criteria: 'Bring student ID and laptop',
      },
      created_at: '2026-09-01T10:00:00Z',
      updated_at: '2026-09-10T12:00:00Z',
      is_registered: false,
      is_bookmarked: false,
      has_student_forum: true, // Forum is ON!
    };
  }

  // 3. CTF Bootcamp
  if (cleanId.includes('ctfbootcamp') || cleanId.includes('evdraft1') || cleanId.includes('ctf')) {
    return {
      id: 'ctf-bootcamp',
      title: 'CTF Bootcamp: Zero to Hacker',
      category: { id: 'cat-3', name: 'Career & Security', slug: 'career', is_active: true },
      short_description: 'Hands-on offensive security fundamentals, web exploitation, and binary reverse engineering.',
      description:
        'Immerse yourself in capture-the-flag challenges guided by industry red-teamers. Learn cryptography attacks, web vulnerability discovery, privilege escalation, and memory forensics in a guided sandbox environment.',
      start_datetime: '2026-11-21T14:00:00Z',
      end_datetime: '2026-11-21T18:00:00Z',
      registration_deadline: '2026-11-20T23:59:00Z',
      max_capacity: 120,
      current_registrations: 111,
      available_seats: 9,
      status: 'published',
      is_featured: false,
      registration_fee: 99,
      tags: ['Cybersecurity', 'CTF', 'Python', 'Reverse Engineering'],
      venue: {
        id: 'ven-cse',
        name: 'CSE Annex · Lab 4',
        building: 'Computing Sciences Center',
        capacity: 120,
        is_available: true,
      },
      organizer: {
        id: 'org-sec',
        full_name: 'Alex Rivera',
        organization_name: 'CyberSec Club',
        organization_type: 'club',
      },
      eligibility_criteria: {
        departments: ['Computer Science', 'Information Systems'],
        year_of_study: [2, 3, 4],
        custom_criteria: 'Basic Linux shell familiarity',
      },
      created_at: '2026-09-02T10:00:00Z',
      updated_at: '2026-09-11T12:00:00Z',
      is_registered: false,
      is_bookmarked: false,
      has_student_forum: true, // Forum is ON!
    };
  }

  // 4. Portfolio Critique
  if (cleanId.includes('portfoliocritique') || cleanId.includes('portfolio')) {
    return {
      id: 'portfolio-critique',
      title: 'Monsoon Portfolio Critique',
      category: { id: 'cat-2', name: 'Arts & Culture', slug: 'arts', is_active: true },
      short_description: 'Constructive 1-on-1 portfolio reviews with visiting design leads from top product studios.',
      description:
        'Bring your Figma files, design systems, and case studies for direct feedback from UX directors and visual design leads. Learn how to tell impactful product design stories that land internships and roles.',
      start_datetime: '2026-11-21T11:00:00Z',
      end_datetime: '2026-11-21T14:00:00Z',
      registration_deadline: '2026-11-20T18:00:00Z',
      max_capacity: 80,
      current_registrations: 46,
      available_seats: 34,
      status: 'published',
      is_featured: false,
      registration_fee: 0,
      tags: ['Design', 'UX', 'Portfolio', 'Review'],
      venue: {
        id: 'ven-art',
        name: 'Old Library · Gallery',
        building: 'Historic Arts Quad',
        capacity: 80,
        is_available: true,
      },
      organizer: {
        id: 'org-arts',
        full_name: 'Maya Lin',
        organization_name: 'Fine Arts Society',
        organization_type: 'society',
      },
      eligibility_criteria: {
        departments: ['All Departments'],
        year_of_study: [1, 2, 3, 4],
        custom_criteria: 'Bring printed or digital portfolio links',
      },
      created_at: '2026-09-03T10:00:00Z',
      updated_at: '2026-09-12T12:00:00Z',
      is_registered: false,
      is_bookmarked: true,
      has_student_forum: true, // Forum is ON!
    };
  }

  // 5. Inter-Hostel Football (Forum is OFF for sports match spectator event)
  if (cleanId.includes('football') || cleanId.includes('interhostel')) {
    return {
      id: 'inter-hostel-football',
      title: 'Inter-Hostel Football: Semis',
      category: { id: 'cat-6', name: 'Sports', slug: 'sports', is_active: true },
      short_description: 'The annual inter-hostel football championship reaches the semifinal knockout round.',
      description:
        'Cheer for your hostel team as the top 4 squads battle under floodlights for a place in next week’s championship final. Complimentary cheer gear and energy drinks available for spectators.',
      start_datetime: '2026-11-20T17:30:00Z',
      end_datetime: '2026-11-20T20:30:00Z',
      registration_deadline: '2026-11-20T17:00:00Z',
      max_capacity: 200,
      current_registrations: 80,
      available_seats: 120,
      status: 'published',
      is_featured: false,
      registration_fee: 0,
      tags: ['Football', 'Sports', 'Hostel Cup'],
      venue: {
        id: 'ven-pitch',
        name: 'Main Ground · Pitch 1',
        building: 'Athletic Pavilion',
        capacity: 200,
        is_available: true,
      },
      organizer: {
        id: 'org-sports',
        full_name: 'Coach Miller',
        organization_name: 'Sports Committee',
        organization_type: 'committee',
      },
      eligibility_criteria: {
        departments: ['All Departments'],
        year_of_study: [1, 2, 3, 4],
        custom_criteria: 'All students and staff welcome',
      },
      created_at: '2026-09-04T10:00:00Z',
      updated_at: '2026-09-13T12:00:00Z',
      is_registered: false,
      is_bookmarked: false,
      has_student_forum: false, // Forum is OFF!
    };
  }

  // 6. Generic or Organizer Event Item Fallback
  return {
    id: id,
    title: id.replace(/^ev-/, '').replace(/-/g, ' ').toUpperCase(),
    category: { id: 'cat-1', name: 'Engineering & Tech', slug: 'tech', is_active: true },
    short_description: 'Comprehensive campus session organized with live tracking and interactive modules.',
    description:
      'Detailed event overview, agenda schedule, interactive sessions, and mentor breakouts for registered students and faculty.',
    start_datetime: '2026-11-28T10:00:00Z',
    end_datetime: '2026-11-28T18:00:00Z',
    registration_deadline: '2026-11-27T23:59:00Z',
    max_capacity: 150,
    current_registrations: 94,
    available_seats: 56,
    status: 'published',
    is_featured: false,
    registration_fee: 0,
    tags: ['CampusIQ', 'Symposium', 'Workshop'],
    venue: {
      id: 'ven-default',
      name: 'Founders Innovation Hub · Lab 104',
      building: 'Engineering Hall',
      capacity: 150,
      is_available: true,
    },
    organizer: {
      id: 'org-1',
      full_name: 'Dr. Sarah Jenkins',
      organization_name: 'Association of Computing & Engineering',
      organization_type: 'department',
    },
    eligibility_criteria: {
      departments: ['All Departments'],
      year_of_study: [1, 2, 3, 4],
      custom_criteria: 'University student ID required',
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_registered: false,
    is_bookmarked: false,
    has_student_forum: true,
  };
};

export function EventSpotlight() {
  const params = useParams();
  const navigate = useNavigate();
  const pathnameId =
    typeof window !== 'undefined'
      ? window.location.pathname.replace(/^\/events\/?/, '').split('/')[0].split('?')[0]
      : '';
  const id = params.id || pathnameId;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [announcements, setAnnouncements] = useState<EventAnnouncement[]>(SAMPLE_ANNOUNCEMENTS);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [forumMessages, setForumMessages] = useState<EventForumMessage[]>(() => {
    const targetId = params.id || pathnameId || 'ev-1';
    return getStoredForumMessages(targetId);
  });
  const [loadingForum, setLoadingForum] = useState(false);
  const [forumInput, setForumInput] = useState('');
  const [postingForum, setPostingForum] = useState(false);

  // Keep forum synchronized reactively
  useEffect(() => {
    const targetId = event?.id || params.id || pathnameId;
    if (!targetId) return;

    const handleUpdate = (e: globalThis.Event) => {
      const custom = e as CustomEvent;
      if (!custom.detail?.eventId || custom.detail.eventId === targetId) {
        setForumMessages(getStoredForumMessages(targetId, event?.title, event?.organizer?.organization_name));
      }
    };

    window.addEventListener('campusiq-forum-updated', handleUpdate);
    return () => window.removeEventListener('campusiq-forum-updated', handleUpdate);
  }, [event?.id, event?.title, event?.organizer?.organization_name, params.id, pathnameId]);

  // Organizer announcement broadcasting form
  const [showAddAnn, setShowAddAnn] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annPriority, setAnnPriority] = useState<'urgent' | 'important' | 'normal'>('normal');
  const [annPinned, setAnnPinned] = useState(false);
  const [postingAnn, setPostingAnn] = useState(false);

  // Attendee Feedback & Reviews state
  const [feedbackList, setFeedbackList] = useState<EventFeedbackItem[]>([]);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [userRating, setUserRating] = useState<number>(5);
  const [feedbackTag, setFeedbackTag] = useState<string>('Overall Experience');
  const [feedbackComment, setFeedbackComment] = useState<string>('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const averageRating = useMemo(() => {
    if (!feedbackList || feedbackList.length === 0) return '4.9';
    const sum = feedbackList.reduce((acc, curr) => acc + (curr.rating || 5), 0);
    return (sum / feedbackList.length).toFixed(1);
  }, [feedbackList]);

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackComment.trim()) {
      toast.error('Please write a short review before submitting.');
      return;
    }
    setSubmittingFeedback(true);
    const newItem: EventFeedbackItem = {
      id: `fb-user-${Date.now()}`,
      student_name: user?.full_name || (role === 'organizer' ? 'Organizer Reviewer' : 'Student Reviewer'),
      department: 'Campus Student',
      year: 'Verified Attendee',
      rating: userRating,
      tag: feedbackTag,
      comment: feedbackComment.trim(),
      created_at: 'Just now',
    };
    setFeedbackList((prev) => [newItem, ...prev]);
    setFeedbackComment('');
    setShowFeedbackForm(false);
    setSubmittingFeedback(false);
    toast.success('🎉 Thank you! Your review has been posted.');
  };

  const { role, accessToken, user } = useAuthStore();

  const loadAnnouncements = (eventId: string) => {
    setLoadingAnnouncements(true);
    eventsApi
      .getEventAnnouncements(eventId)
      .then((res) => {
        if (Array.isArray(res) && res.length > 0) {
          setAnnouncements(res);
        } else {
          setAnnouncements(SAMPLE_ANNOUNCEMENTS);
        }
      })
      .catch(() => {
        setAnnouncements(SAMPLE_ANNOUNCEMENTS);
      })
      .finally(() => {
        setLoadingAnnouncements(false);
      });
  };

  const loadForumMessages = (eventId: string) => {
    // 1. Immediately render persistent stored messages
    const local = getStoredForumMessages(eventId, event?.title, event?.organizer?.organization_name);
    setForumMessages(local);

    // 2. Fetch from backend API and sync
    setLoadingForum(true);
    eventsApi
      .getForumMessages(eventId)
      .then((res) => {
        if (Array.isArray(res) && res.length > 0) {
          const synced = syncBackendMessages(eventId, res);
          setForumMessages(synced);
        }
      })
      .catch(() => {
        // Safe offline/mock fallback: keep the locally stored messages
      })
      .finally(() => {
        setLoadingForum(false);
      });
  };

  const handleSendForumMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forumInput.trim() || !event?.id || postingForum) return;
    setPostingForum(true);

    const messageText = forumInput.trim();
    const newMsg: EventForumMessage = {
      id: `msg-${Date.now()}`,
      event_id: event.id,
      user_id: user?.id || (role === 'organizer' ? 'org-curr' : 'stu-curr'),
      user_name: user?.full_name || (role === 'organizer' ? 'Organizer' : 'Student Attendee'),
      user_role: role === 'organizer' ? 'organizer' : 'student',
      message: messageText,
      created_at: new Date().toISOString(),
    };

    // 1. Immediately persist message so it never vanishes on refresh
    const updated = saveForumMessage(event.id, newMsg);
    setForumMessages(updated);
    setForumInput('');
    setPostingForum(false);
    toast.success('Message posted to discussion forum!');

    // 2. Background sync to backend API
    try {
      await eventsApi.postForumMessage(event.id, messageText);
    } catch {
      // Graceful offline/mock support
    }
  };

  const handleBroadcastAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) {
      toast.error('Announcement title and content are required.');
      return;
    }
    setPostingAnn(true);
    const newAnn: EventAnnouncement = {
      id: `ann-${Date.now()}`,
      event_id: event?.id || 'ev-1',
      title: annTitle.trim(),
      content: annContent.trim(),
      priority: annPriority,
      is_pinned: annPinned,
      created_at: new Date().toISOString(),
    };

    setAnnouncements((prev) => [newAnn, ...prev]);
    setAnnTitle('');
    setAnnContent('');
    setAnnPinned(false);
    setAnnPriority('normal');
    setShowAddAnn(false);
    setPostingAnn(false);
    toast.success('📢 Announcement broadcasted to attendees!');
  };

  useEffect(() => {
    if (!id) {
      setNotice('Event identifier was not specified.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setNotice('');

    eventsApi
      .getEventById(id)
      .then((res) => {
        if (res && (res.id || (res as any).title)) {
          setEvent(res);
          loadAnnouncements(res.id);
          if (res.has_student_forum !== false) {
            loadForumMessages(res.id);
          }
          setFeedbackList(getInitialFeedbackForEvent(res.id, res.title));
        } else {
          throw new Error('Invalid event response');
        }
      })
      .catch(() => {
        const fallback = resolveEventFallback(id);
        setEvent(fallback);
        loadAnnouncements(fallback.id);
        if (fallback.has_student_forum) {
          loadForumMessages(fallback.id);
        }
        setFeedbackList(getInitialFeedbackForEvent(fallback.id, fallback.title));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const register = async () => {
    if (!accessToken) {
      toast('Please sign in as a student to register.', { icon: '🔑' });
      navigate('/login');
      return;
    }
    if (!id) return;

    if (event?.is_registered) {
      setEvent((current) =>
        current
          ? {
              ...current,
              is_registered: false,
              available_seats: (current.available_seats ?? 0) + 1,
            }
          : current
      );
      toast('Registration cancelled', { icon: 'ℹ️' });
      return;
    }

    try {
      await registrationsApi.registerForEvent(String(id));
    } catch {
      // Mock fallback
    }

    setEvent((current) =>
      current
        ? {
            ...current,
            is_registered: true,
            available_seats: Math.max(0, (current.available_seats ?? 1) - 1),
          }
        : current
    );
    toast.success(`🎉 You're registered for "${event?.title}"! Ticket added to your schedule.`);
  };

  const bookmark = async () => {
    if (role !== 'student') {
      toast('Saved event to organizer watchlist');
      return;
    }
    if (!id) return;
    try {
      if (event?.is_bookmarked) {
        await registrationsApi.removeBookmark(String(id));
      } else {
        await registrationsApi.addBookmark(String(id));
      }
    } catch {
      // Mock fallback
    }
    setEvent((current) =>
      current ? { ...current, is_bookmarked: !current.is_bookmarked } : current
    );
    toast(event?.is_bookmarked ? 'Removed from saved events' : 'Saved to your schedule!', {
      icon: event?.is_bookmarked ? '🗑️' : '🔖',
    });
  };

  const backUrl = role === 'organizer' ? '/organizer/events' : '/student/dashboard';

  if (loading) {
    return (
      <main className="spotlight loading-spotlight font-sans">
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div className="spotlight-spinner" />
          <h2 style={{ fontSize: '20px', marginTop: '16px', fontWeight: 600 }}>
            Loading event details…
          </h2>
          <p style={{ color: '#727971', fontSize: '14px', marginTop: '6px' }}>
            Fetching schedule, venue allocations, and community channels.
          </p>
        </div>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="spotlight loading-spotlight font-sans">
        <div style={{ textAlign: 'center', maxWidth: '480px', padding: '50px 20px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1b1b18', marginBottom: '10px' }}>
            Event Not Found
          </h2>
          <p style={{ color: '#687068', fontSize: '14px', marginBottom: '24px', lineHeight: 1.5 }}>
            {notice || 'We could not locate this campus session. It may have been archived or unpublished.'}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              className="portal-button"
              onClick={() => navigate(backUrl)}
              style={{ cursor: 'pointer' }}
            >
              ← Back to {role === 'organizer' ? 'My Events' : 'Discovery'}
            </button>
            <button
              className="portal-button"
              style={{ background: '#1d2923', color: '#fff', cursor: 'pointer' }}
              onClick={() => navigate('/events')}
            >
              Browse All Events
            </button>
          </div>
        </div>
      </main>
    );
  }

  const seatsLeft =
    event.available_seats ??
    Math.max(0, (event.max_capacity || 0) - (event.current_registrations || 0));

  return (
    <main className="spotlight font-sans">
      {/* Top Header Navigation */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '28px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <Link to={backUrl} className="spotlight-back" style={{ marginBottom: 0 }}>
          <ArrowLeft size={16} /> Back to {role === 'organizer' ? 'My Events' : 'Student Discover'}
        </Link>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {role === 'organizer' ? (
            <>
              <span
                style={{
                  fontSize: '12px',
                  background: '#eef3e6',
                  color: '#3f5b12',
                  padding: '4px 12px',
                  borderRadius: '99px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <ShieldCheck size={14} /> Organizer Preview ({event.status || 'Active'})
              </span>
            </>
          ) : (
            <span
              style={{
                fontSize: '12px',
                background: '#eaf6ed',
                color: '#165a39',
                padding: '4px 12px',
                borderRadius: '99px',
                fontWeight: 600,
              }}
            >
              Student Portal View
            </span>
          )}
        </div>
      </div>

      {/* Hero Visual Art Banner */}
      <div className="spotlight-art">
        <span>{event.category?.name || 'CAMPUS EVENT'}</span>
        <i />
        <b>
          {event.start_datetime
            ? new Date(event.start_datetime).toLocaleDateString('en', {
                month: 'short',
                day: 'numeric',
              })
            : 'EVENT'}
        </b>
      </div>

      {/* Main Content Layout */}
      <section className="spotlight-main">
        {/* Left Column: Event Details, Announcements, Discussion Forum */}
        <div>
          <p className="spotlight-kicker">
            {event.organizer?.organization_name || 'CAMPUSIQ PRESENTS'}
          </p>
          <h1 className="tracking-tight">{event.title}</h1>
          <p className="spotlight-description">{event.description || event.short_description}</p>

          {/* Quick Facts Strip */}
          <div className="spotlight-facts">
            <span>
              <CalendarDays size={17} />{' '}
              {event.start_datetime
                ? new Date(event.start_datetime).toLocaleString('en', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })
                : 'Date to be announced'}
            </span>
            <span>
              <MapPin size={17} /> {event.venue?.name || 'Campus venue to be announced'}
            </span>
            <span>
              <Users size={17} /> {seatsLeft} seats remaining ({event.current_registrations || 0} registered)
            </span>
            <span
              onClick={() => {
                document.getElementById('attendee-feedback-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{ cursor: 'pointer' }}
              title="View student reviews"
            >
              <Star size={17} className="text-amber-500 fill-amber-500" />
              <strong style={{ color: '#1b1b18' }}>{averageRating} / 5.0</strong>
              <span style={{ color: '#727971' }}>({feedbackList.length} reviews)</span>
            </span>
          </div>

          {/* Quick Navigation Buttons */}
          <div style={{ marginTop: '22px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {event.has_student_forum && (
              <button
                type="button"
                onClick={() => {
                  document.getElementById('discussion-forum-section')?.scrollIntoView({ behavior: 'smooth' });
                  const input = document.getElementById('forum-input-field');
                  if (input) input.focus();
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#fff7f4',
                  border: '1px solid rgba(230, 92, 54, 0.4)',
                  color: '#e65c36',
                  padding: '9px 18px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 1px 3px rgba(230, 92, 54, 0.1)',
                }}
              >
                <MessageSquare size={16} />
                <span>Join Discussion Forum</span>
                <ChevronRight size={14} />
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                document.getElementById('attendee-feedback-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#fefce8',
                border: '1px solid #fde047',
                color: '#854d0e',
                padding: '9px 18px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 1px 3px rgba(234, 179, 8, 0.1)',
              }}
            >
              <Star size={16} fill="#eab308" color="#eab308" />
              <span>Attendee Reviews ({feedbackList.length})</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Discussion Forum (Rendered in left column if turned on by organizer) */}
          {event.has_student_forum ? (
            <div id="discussion-forum-section" className="spotlight-forum">
              <div className="spotlight-forum__header">
                <div className="spotlight-forum__title">
                  <MessageSquare size={19} color="#e65c36" />
                  <span>Discussion Forum & Attendee Q&A</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      background: '#fff7f4',
                      border: '1px solid rgba(230, 92, 54, 0.3)',
                      color: '#e65c36',
                      padding: '3px 10px',
                      borderRadius: '99px',
                      fontWeight: 700,
                    }}
                  >
                    {forumMessages.length} {forumMessages.length === 1 ? 'Message' : 'Messages'}
                  </span>
                  <button
                    type="button"
                    onClick={() => event && loadForumMessages(event.id)}
                    title="Refresh student forum"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#727971',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <RotateCw size={13} className={loadingForum ? 'spotlight-spin' : ''} />
                  </button>
                </div>
              </div>
              <p className="spotlight-forum__sub">
                Ask questions, clarify doubts, coordinate ride-shares, and chat directly with organizers and fellow students.
              </p>

              <div className="spotlight-forum__chatbox">
                <div className="spotlight-forum__messages">
                  {loadingForum && forumMessages.length === 0 ? (
                    <div className="spotlight-announcements__loading">
                      <Clock size={15} /> Loading forum queries…
                    </div>
                  ) : forumMessages.length === 0 ? (
                    <div className="spotlight-forum__empty">
                      <p className="spotlight-forum__empty-title">No messages in discussion forum yet</p>
                      <span>Have a question regarding this session? Be the first to start the conversation below!</span>
                    </div>
                  ) : (
                    forumMessages.map((msg) => (
                      <div key={msg.id} className="spotlight-forum__msg">
                        <div
                          className={`spotlight-forum__avatar ${
                            msg.user_role === 'organizer' ? 'spotlight-forum__avatar--organizer' : ''
                          }`}
                        >
                          {(msg.user_name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="spotlight-forum__bubble">
                          <div className="spotlight-forum__msg-header">
                            <div className="spotlight-forum__user-info">
                              <span className="spotlight-forum__sender">
                                {msg.user_name || 'Anonymous User'}
                              </span>
                              <span
                                className={`spotlight-forum__role-tag spotlight-forum__role-tag--${msg.user_role}`}
                              >
                                {msg.user_role}
                              </span>
                            </div>
                            <time className="spotlight-forum__msg-date">
                              {msg.created_at
                                ? new Date(msg.created_at).toLocaleDateString('en', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit',
                                  })
                                : 'Recent'}
                            </time>
                          </div>
                          <p className="spotlight-forum__text">{msg.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Message Input Box */}
                <form className="spotlight-forum__input-row" onSubmit={handleSendForumMessage}>
                  <input
                    id="forum-input-field"
                    type="text"
                    className="spotlight-forum__input"
                    placeholder="Ask a question or post a message to the event forum..."
                    value={forumInput}
                    onChange={(e) => setForumInput(e.target.value)}
                    disabled={postingForum}
                  />
                  <button
                    type="submit"
                    className="spotlight-forum__send-btn"
                    disabled={postingForum || !forumInput.trim()}
                  >
                    <Send size={13} /> {postingForum ? 'Posting...' : 'Send Message'}
                  </button>
                </form>
              </div>
            </div>
          ) : null}

          {/* 3. Attendee Feedback & Student Reviews Section */}
          <div id="attendee-feedback-section" className="spotlight-feedback">
            <div className="spotlight-feedback__header">
              <div className="spotlight-feedback__title">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <span>Attendee Feedback & Reviews</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="spotlight-feedback__badge">
                  ★ {averageRating} / 5.0 ({feedbackList.length} verified reviews)
                </span>
                <button
                  type="button"
                  onClick={() => setShowFeedbackForm((v) => !v)}
                  className="cursor-pointer"
                  style={{
                    background: showFeedbackForm ? '#e1e4de' : '#1e2b24',
                    color: showFeedbackForm ? '#19201c' : '#ffffff',
                    border: 'none',
                    borderRadius: '7px',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <Plus size={14} /> {showFeedbackForm ? 'Close Form' : 'Leave Feedback'}
                </button>
              </div>
            </div>
            <p className="spotlight-feedback__sub">
              Verified student takeaways, peer feedback, and ratings for {event.title}.
            </p>

            {/* Feedback Submission Form */}
            {showFeedbackForm && (
              <form className="spotlight-feedback__form" onSubmit={handleSendFeedback}>
                <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 700, color: '#1b1b18' }}>
                  Write a Review for {event.title}
                </h4>

                {/* Star Selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#4c524b' }}>Your Rating:</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setUserRating(star)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '2px',
                          color: star <= userRating ? '#f59e0b' : '#d1d6cb',
                        }}
                      >
                        <Star size={20} fill={star <= userRating ? '#f59e0b' : 'none'} />
                      </button>
                    ))}
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#1b1b18' }}>
                    {userRating}.0 / 5.0
                  </span>
                </div>

                {/* Tag Selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#4c524b' }}>Category:</span>
                  {['Overall Experience', 'Mentorship & Speakers', 'Content & Coding', 'Venue & Facilities', 'Networking'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setFeedbackTag(tag)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '99px',
                        fontSize: '11px',
                        fontWeight: 700,
                        border: feedbackTag === tag ? '1.5px solid #113326' : '1px solid #d4dad0',
                        background: feedbackTag === tag ? '#113326' : '#ffffff',
                        color: feedbackTag === tag ? '#ffffff' : '#455240',
                        cursor: 'pointer',
                      }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>

                {/* Comment text area */}
                <textarea
                  rows={3}
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="Share what you liked about this event, speaker guidance, or helpful feedback..."
                  style={{
                    width: '100%',
                    border: '1px solid #d4dad0',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                    outlineColor: '#71873d',
                    marginBottom: '12px',
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setShowFeedbackForm(false)}
                    style={{
                      background: 'transparent',
                      border: '1px solid #d4dad0',
                      borderRadius: '6px',
                      padding: '7px 14px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingFeedback || !feedbackComment.trim()}
                    style={{
                      background: '#113326',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '7px 18px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Send size={12} /> Submit Review
                  </button>
                </div>
              </form>
            )}

            {/* Feedback List */}
            <div className="spotlight-feedback__list">
              {feedbackList.map((item) => (
                <div key={item.id} className="spotlight-feedback-card">
                  <div className="spotlight-feedback-card__top">
                    <div className="spotlight-feedback-card__stars">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          fill={i < Math.floor(item.rating) ? '#f59e0b' : 'none'}
                          color="#f59e0b"
                        />
                      ))}
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#1b1b18', marginLeft: '4px' }}>
                        {item.rating}
                      </span>
                    </div>
                    <span className="spotlight-feedback-card__tag">{item.tag}</span>
                  </div>

                  <p className="spotlight-feedback-card__comment">“{item.comment}”</p>

                  <div className="spotlight-feedback-card__author">
                    <div>
                      <strong style={{ color: '#1b1b18' }}>{item.student_name}</strong>
                      <span style={{ marginLeft: '6px', color: '#727971' }}>
                        · {item.department} ({item.year})
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="spotlight-feedback-card__badge">
                        <CheckCircle2 size={12} /> Verified Attendee
                      </span>
                      <span>· {item.created_at}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Aside Column: Registration Cart + Announcement Board below it */}
        <aside className="spotlight-sidebar-col">
          {/* 1. Registration Cart / Ticket Box */}
          <div className="ticket-box">
            <span>{event.registration_fee ? `₹${event.registration_fee}` : 'Free Entry'}</span>
            <strong>
              {role === 'organizer'
                ? 'Event Status'
                : event.is_registered
                ? 'You’re Registered'
                : event.is_registration_open === false
                ? 'Registration Closed'
                : 'Save Your Spot'}
            </strong>
            <p>
              {role === 'organizer'
                ? `Currently ${event.current_registrations || 0} students enrolled out of ${event.max_capacity || 0} capacity.`
                : event.is_registration_open === false && !event.is_registered
                ? 'The organizer has closed registrations for this event.'
                : event.registration_deadline
                ? `Registration closes ${new Date(event.registration_deadline).toLocaleDateString('en', {
                    month: 'short',
                    day: 'numeric',
                  })}.`
                : 'Open for registration.'}
            </p>

            {/* Action Buttons for Student vs Organizer */}
            {role === 'organizer' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '18px' }}>
                <Link
                  to="/organizer/analytics"
                  state={{ selectedEventId: event.id }}
                  className="spotlight-register"
                  style={{ textDecoration: 'none', textAlign: 'center' }}
                >
                  <CalendarDays size={19} /> View Event Analytics
                </Link>

                {/* Join Discussion Forum Button for Organizer (if turned on) */}
                {event.has_student_forum && (
                  <button
                    type="button"
                    className="spotlight-forum-btn"
                    onClick={() => {
                      document.getElementById('discussion-forum-section')?.scrollIntoView({ behavior: 'smooth' });
                      const input = document.getElementById('forum-input-field');
                      if (input) input.focus();
                    }}
                  >
                    <MessageSquare size={19} /> Join Discussion Forum
                  </button>
                )}

                <Link
                  to="/organizer/events"
                  className="spotlight-save"
                  style={{ textDecoration: 'none', textAlign: 'center' }}
                >
                  <LayoutDashboard size={19} /> Back to My Events
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '18px' }}>
                {/* Register Button */}
                <button
                  className="spotlight-register cursor-pointer"
                  disabled={event.is_registration_open === false}
                  onClick={register}
                  style={{
                    background: event.is_registered ? '#1c6b45' : '#d8fa57',
                    color: event.is_registered ? 'white' : '#19201c',
                  }}
                >
                  {event.is_registered ? (
                    <>
                      <CheckCircle2 size={19} />
                      <span>Registered · Ticket Confirmed</span>
                    </>
                  ) : event.is_registration_open === false ? (
                    <span>Registration Closed</span>
                  ) : (
                    <>
                      <span>Register now</span>
                      <Ticket size={19} />
                    </>
                  )}
                </button>

                {/* Join Discussion Forum Button (Only if turned on) */}
                {event.has_student_forum && (
                  <button
                    type="button"
                    className="spotlight-forum-btn"
                    onClick={() => {
                      document.getElementById('discussion-forum-section')?.scrollIntoView({ behavior: 'smooth' });
                      const input = document.getElementById('forum-input-field');
                      if (input) input.focus();
                    }}
                  >
                    <MessageSquare size={19} />
                    <span>Join Discussion Forum</span>
                  </button>
                )}

                {/* Save for Later Button */}
                <button className="spotlight-save cursor-pointer" onClick={bookmark}>
                  <Heart
                    size={19}
                    fill={event.is_bookmarked ? 'currentColor' : 'none'}
                  />{' '}
                  {event.is_bookmarked ? 'Saved to Your Schedule' : 'Save for Later'}
                </button>
              </div>
            )}

            {notice && <p className="spotlight-notice">{notice}</p>}
          </div>

          {/* 2. Announcement Board (Placed directly below registration cart) */}
          <div className="spotlight-announcements spotlight-announcements--sidebar">
            <div className="spotlight-announcements__header">
              <div className="spotlight-announcements__title">
                <Megaphone size={18} color="#3f5b12" />
                <span>Announcement Board</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="spotlight-announcements__badge">
                  {announcements.length} {announcements.length === 1 ? 'Notice' : 'Notices'}
                </span>
                <button
                  type="button"
                  onClick={() => event && loadAnnouncements(event.id)}
                  title="Refresh announcements"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#727971',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <RotateCw size={13} className={loadingAnnouncements ? 'spotlight-spin' : ''} />
                </button>

                {role === 'organizer' && (
                  <button
                    type="button"
                    onClick={() => setShowAddAnn(!showAddAnn)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: '#113326',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '5px 10px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <Plus size={13} /> {showAddAnn ? 'Cancel' : 'Post Notice'}
                  </button>
                )}
              </div>
            </div>
            <p className="spotlight-announcements__sub">
              Live updates, schedule adjustments, and direct notices broadcast by the organizer.
            </p>

            {/* Organizer Inline Announcement Broadcast Form */}
            {role === 'organizer' && showAddAnn && (
              <form
                onSubmit={handleBroadcastAnnouncement}
                style={{
                  background: '#fcfdfb',
                  border: '1px solid #d4dad0',
                  borderRadius: '10px',
                  padding: '14px',
                  marginBottom: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#11241c' }}>
                  Broadcast New Notice
                </h4>
                <input
                  type="text"
                  placeholder="Notice Headline (e.g. Schedule shift)"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    fontSize: '12px',
                    border: '1px solid #d4dad0',
                    borderRadius: '6px',
                    outline: 'none',
                  }}
                />
                <textarea
                  rows={2}
                  placeholder="Write clear instructions for attendees..."
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    fontSize: '12px',
                    border: '1px solid #d4dad0',
                    borderRadius: '6px',
                    outline: 'none',
                    resize: 'none',
                  }}
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={annPinned}
                        onChange={(e) => setAnnPinned(e.target.checked)}
                      />
                      <span>Pin</span>
                    </label>
                    <select
                      value={annPriority}
                      onChange={(e) => setAnnPriority(e.target.value as any)}
                      style={{
                        padding: '4px 6px',
                        fontSize: '11px',
                        borderRadius: '4px',
                        border: '1px solid #d4dad0',
                      }}
                    >
                      <option value="normal">Normal</option>
                      <option value="important">Important</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={postingAnn}
                    style={{
                      background: '#e65c36',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {postingAnn ? 'Publishing…' : 'Publish'}
                  </button>
                </div>
              </form>
            )}

            {/* Announcements List */}
            {loadingAnnouncements && announcements.length === 0 ? (
              <div className="spotlight-announcements__loading">
                <Clock size={15} /> Fetching latest announcements…
              </div>
            ) : announcements.length === 0 ? (
              <div className="spotlight-announcements__empty">
                <p>No announcements posted yet.</p>
                <span>Any room shifts, schedule changes, or organizer reminders will appear here in real-time.</span>
              </div>
            ) : (
              <div className="spotlight-announcements__list">
                {announcements.map((ann) => (
                  <article
                    key={ann.id}
                    className={`spotlight-announcement-card ${
                      ann.is_pinned ? 'spotlight-announcement-card--pinned' : ''
                    } ${ann.priority === 'urgent' ? 'spotlight-announcement-card--urgent' : ''}`}
                  >
                    <div className="spotlight-announcement-card__top">
                      <div className="spotlight-announcement-card__tags">
                        {ann.is_pinned && (
                          <span className="spotlight-announcement-pill spotlight-announcement-pill--pinned">
                            <Pin size={10} /> Pinned
                          </span>
                        )}
                        <span className={`spotlight-announcement-pill spotlight-announcement-pill--${ann.priority}`}>
                          {ann.priority}
                        </span>
                      </div>
                      <time className="spotlight-announcement-card__date">
                        {ann.created_at
                          ? new Date(ann.created_at).toLocaleDateString('en', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })
                          : 'Recent'}
                      </time>
                    </div>
                    <h3 className="spotlight-announcement-card__heading">{ann.title}</h3>
                    <p className="spotlight-announcement-card__content">{ann.content}</p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}
