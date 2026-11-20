import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  CheckCheck,
  X,
  Search,
  Filter,
  Mail,
  Ticket,
  Sparkles,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Trash2,
  Clock,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export interface StudentNotificationItem {
  id: string;
  title: string;
  message: string;
  category: 'invite' | 'registration' | 'reminder' | 'ai' | 'announcement';
  timestamp: string;
  timeAgo: string;
  isRead: boolean;
  actionUrl?: string;
  actionLabel?: string;
  badge?: string;
}

const INITIAL_STUDENT_NOTIFICATIONS: StudentNotificationItem[] = [
  {
    id: 's-notif-1',
    title: 'New Direct Invitation from CyberSec Club',
    message:
      'You have been invited to "CTF Bootcamp: Zero to Hacker". Your profile matches 98% based on recent Python & Security workshop searches.',
    category: 'invite',
    timestamp: '2026-11-19T20:38:00Z',
    timeAgo: '12m ago',
    isRead: false,
    actionUrl: '/student/invitations',
    actionLabel: 'Review & Accept Invite',
    badge: 'Exclusive Invite',
  },
  {
    id: 's-notif-2',
    title: 'Registration Confirmed: HackNight: Build & Ship',
    message:
      'Your digital admission pass is confirmed for Innovation Block · Hall B. Doors open at 09:30 AM this Saturday.',
    category: 'registration',
    timestamp: '2026-11-19T18:50:00Z',
    timeAgo: '2h ago',
    isRead: false,
    actionUrl: '/student/registrations',
    actionLabel: 'View Digital Pass',
    badge: 'Confirmed RSVP',
  },
  {
    id: 's-notif-3',
    title: 'Event Reminder: RoboWars Season 4',
    message:
      'RoboWars Season 4 kicks off tomorrow at 10:00 AM at the Robotics Arena. 210 attendees checked in so far.',
    category: 'reminder',
    timestamp: '2026-11-18T10:00:00Z',
    timeAgo: '1d ago',
    isRead: true,
    actionUrl: '/student/registrations',
    actionLabel: 'View Schedule',
  },
  {
    id: 's-notif-4',
    title: 'AI Discovery: 4 New Hackathons Match Your Profile',
    message:
      'Based on your Machine Learning, Python, and Cybersecurity interests, CampusIQ identified 4 high-match sessions this month.',
    category: 'ai',
    timestamp: '2026-11-17T14:15:00Z',
    timeAgo: '2d ago',
    isRead: true,
    actionUrl: '/student/ai-studio',
    actionLabel: 'Explore Matches',
  },
  {
    id: 's-notif-5',
    title: 'Campus Announcement: Fine Arts Exhibition Open Call',
    message:
      'Fine Arts Society opened registrations for the Monsoon Portfolio Critique session. Submissions close Friday midnight.',
    category: 'announcement',
    timestamp: '2026-11-16T11:00:00Z',
    timeAgo: '3d ago',
    isRead: true,
    actionUrl: '/events',
    actionLabel: 'Explore Event',
  },
];

export const StudentNotificationsView: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<StudentNotificationItem[]>(
    INITIAL_STUDENT_NOTIFICATIONS
  );
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'invite' | 'registration' | 'reminder'>('all');

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    toast.success('All notifications marked as read');
  };

  const handleClearAll = () => {
    setNotifications([]);
    toast.success('Notification feed cleared');
  };

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    toast.success('Notification dismissed');
  };

  const handleMarkSingleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleItemClick = (n: StudentNotificationItem) => {
    handleMarkSingleRead(n.id);
    if (n.actionUrl) {
      navigate(n.actionUrl);
    }
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (activeTab === 'unread' && n.isRead) return false;
      if (activeTab === 'invite' && n.category !== 'invite') return false;
      if (activeTab === 'registration' && n.category !== 'registration') return false;
      if (activeTab === 'reminder' && n.category !== 'reminder') return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        return n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q);
      }
      return true;
    });
  }, [notifications, activeTab, search]);

  const getIcon = (cat: StudentNotificationItem['category']) => {
    switch (cat) {
      case 'invite':
        return <Mail className="w-4 h-4 text-[#e65c36]" />;
      case 'registration':
        return <Ticket className="w-4 h-4 text-[#19754f]" />;
      case 'reminder':
        return <Calendar className="w-4 h-4 text-[#2563eb]" />;
      case 'ai':
        return <Sparkles className="w-4 h-4 text-[#8b5cf6]" />;
      default:
        return <Bell className="w-4 h-4 text-[#112b20]" />;
    }
  };

  return (
    <div className="w-full font-sans text-left space-y-6 max-w-6xl mx-auto pb-16">
      {/* 1. Top Status Banner Strip */}
      <div className="bg-[#0e261d] text-white px-5 py-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono shadow-xs border border-[#1b3d2f]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[#e65c36] font-bold">—</span>
          <span className="text-white font-bold tracking-wider uppercase">
            STUDENT COMMUNICATIONS · NOTIFICATIONS & ALERTS
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[#d8fa57] font-semibold">
            {unreadCount} unread alert{unreadCount !== 1 ? 's' : ''}
          </span>
          <span className="text-[#8ea79a]">•</span>
          <span className="text-[#a4efb3] text-[11px]">Real-time sync</span>
        </div>
      </div>

      {/* 2. Main Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-6 border border-[#e5e2d6] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#112b20] text-[#d8fa57] flex items-center justify-center font-bold shadow-xs shrink-0">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#19231e] tracking-tight">
              Student Notifications
            </h1>
            <p className="text-xs sm:text-sm text-[#5f6e65] mt-0.5">
              Live updates on invitations, guaranteed pass confirmations, and schedule reminders.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#f4f2ea] hover:bg-[#ece8dc] text-[#19231e] border border-[#dedbd0] text-xs font-bold transition-colors cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5 text-[#19754f]" />
              <span>Mark all read</span>
            </button>
          )}

          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#dedbd4] text-[#738278] hover:text-rose-600 hover:border-rose-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear feed</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Search Bar & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-[#e5e2d6] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: `All (${notifications.length})` },
            { id: 'unread', label: `Unread (${unreadCount})` },
            { id: 'invite', label: 'Invitations' },
            { id: 'registration', label: 'Pass Confirmations' },
            { id: 'reminder', label: 'Reminders' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#112b20] text-white shadow-xs'
                  : 'text-[#55695f] hover:bg-[#f4f2ea]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#8ea79a] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search alerts by title or keyword..."
            className="w-full bg-[#fbf9f4] border border-[#dcd9ce] rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-[#19231e] focus:outline-none focus:ring-2 focus:ring-[#112b20]"
          />
        </div>
      </div>

      {/* 4. Notifications Stream */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-[#dcd9ce] p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#f4f2ea] text-[#738278] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6 text-[#19754f]" />
            </div>
            <h3 className="font-bold text-sm text-[#19231e]">All clear! No notifications found</h3>
            <p className="text-xs text-[#738278] max-w-sm mx-auto leading-relaxed">
              {activeTab === 'unread'
                ? 'You have caught up with all unread notifications.'
                : 'Any invitations, pass updates, or time modifications will appear here in real-time.'}
            </p>
          </div>
        ) : (
          filteredNotifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleItemClick(n)}
              className={`rounded-2xl p-4 sm:p-5 border transition-all cursor-pointer group relative flex items-start gap-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] ${
                !n.isRead
                  ? 'bg-white border-[#112b20]/30 border-l-4 border-l-[#e65c36]'
                  : 'bg-white/80 border-[#e5e2d6] hover:border-[#dedbd0] hover:bg-white'
              }`}
            >
              {/* Type Icon */}
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${
                  !n.isRead
                    ? 'bg-[#f4f2ea] border-[#dedbd0]'
                    : 'bg-[#faf8f2] border-[#eeebe2]'
                }`}
              >
                {getIcon(n.category)}
              </div>

              {/* Notification Content */}
              <div className="flex-1 min-w-0 pr-8">
                <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3
                      className={`text-sm ${
                        !n.isRead ? 'font-extrabold text-[#19231e]' : 'font-bold text-[#4a574f]'
                      }`}
                    >
                      {n.title}
                    </h3>
                    {n.badge && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#eaf6ed] text-[#1c643b] border border-[#cbe9d4]">
                        {n.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-[#8ea79a] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{n.timeAgo}</span>
                  </span>
                </div>

                <p className="text-xs text-[#526359] leading-relaxed mt-1">
                  {n.message}
                </p>

                {/* Action Link Button */}
                {n.actionLabel && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-[#e65c36] group-hover:underline">
                    <span>{n.actionLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                )}
              </div>

              {/* Right Dismiss Button */}
              <button
                type="button"
                onClick={(e) => handleDismiss(n.id, e)}
                className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4 p-1 rounded-lg hover:bg-[#f4f2ea] text-[#8ea79a] hover:text-[#19231e] cursor-pointer"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
