import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  CheckCheck,
  X,
  Search,
  AlertTriangle,
  Sparkles,
  Users,
  Star,
  Layers,
  ArrowRight,
  Trash2,
  Clock,
  ExternalLink,
  ShieldAlert,
  TrendingUp,
  FileText,
  BarChart3,
  Bot,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export interface OrganizerNotificationItem {
  id: string;
  title: string;
  message: string;
  category: 'capacity' | 'campaign' | 'review' | 'copilot' | 'system';
  timestamp: string;
  timeAgo: string;
  isRead: boolean;
  actionUrl?: string;
  actionLabel?: string;
  badge?: string;
  badgeColor?: 'red' | 'amber' | 'emerald' | 'blue';
}

const INITIAL_ORGANIZER_NOTIFICATIONS: OrganizerNotificationItem[] = [
  {
    id: 'o-notif-1',
    title: 'High Demand Alert: CTF Bootcamp 88% Full',
    message:
      'Only 9 seats remain out of 120 available. Consider opening an overflow waitlist or expanding to Lab 5.',
    category: 'capacity',
    timestamp: '2026-11-19T20:42:00Z',
    timeAgo: '8m ago',
    isRead: false,
    actionUrl: '/organizer/events',
    actionLabel: 'Manage Seats & Waitlist',
    badge: 'Urgent: Capacity',
    badgeColor: 'amber',
  },
  {
    id: 'o-notif-2',
    title: 'Smart Invites: 18 Students Accepted Campaign',
    message:
      'Targeted campaign for "HackNight: Build & Ship" achieved a 68% accept rate. 18 confirmed attendees added to your roster.',
    category: 'campaign',
    timestamp: '2026-11-19T20:05:00Z',
    timeAgo: '45m ago',
    isRead: false,
    actionUrl: '/organizer/invites',
    actionLabel: 'View Campaign Analytics',
    badge: 'Campaign Success',
    badgeColor: 'emerald',
  },
  {
    id: 'o-notif-3',
    title: 'New 5-Star Attendee Feedback from Dev Kothari',
    message:
      '"Phenomenal mentors, beginner pacing, and high-energy atmosphere. The hands-on format made everything click!"',
    category: 'review',
    timestamp: '2026-11-19T17:50:00Z',
    timeAgo: '3h ago',
    isRead: false,
    actionUrl: '/organizer/analytics',
    actionLabel: 'Read All Reviews',
    badge: '5.0 Rating',
    badgeColor: 'emerald',
  },
  {
    id: 'o-notif-4',
    title: 'AI Drafting Agent: Blueprint Ready for NexCode',
    message:
      'Co-pilot formulated a full schedule agenda, venue allocations, and curriculum tracks for your upcoming 24-hour hackathon.',
    category: 'copilot',
    timestamp: '2026-11-18T14:20:00Z',
    timeAgo: '1d ago',
    isRead: true,
    actionUrl: '/organizer/events/new',
    actionLabel: 'Review Blueprint in Creator',
    badge: 'AI Generated',
    badgeColor: 'blue',
  },
  {
    id: 'o-notif-5',
    title: 'Feedback Intelligence: Hall B Acoustics Flagged',
    message:
      'Groq Llama-3.1 processed 312 post-event surveys: Recommendation to add a secondary wireless mic and an extra lunch counter.',
    category: 'system',
    timestamp: '2026-11-17T09:30:00Z',
    timeAgo: '2d ago',
    isRead: true,
    actionUrl: '/organizer/analytics',
    actionLabel: 'View Intelligence Report',
    badge: 'Action Item',
    badgeColor: 'amber',
  },
  {
    id: 'o-notif-6',
    title: 'RoboWars Season 4 Hit 100% Capacity',
    message:
      'All 210 spots filled 3 days before start time. 34 students currently queued on the automatic standby waitlist.',
    category: 'capacity',
    timestamp: '2026-11-16T16:00:00Z',
    timeAgo: '3d ago',
    isRead: true,
    actionUrl: '/organizer/events',
    actionLabel: 'View Attendee Roster',
    badge: 'Sold Out',
    badgeColor: 'red',
  },
];

export const OrganizerNotificationsView: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<OrganizerNotificationItem[]>(
    INITIAL_ORGANIZER_NOTIFICATIONS
  );
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'capacity' | 'campaign' | 'review'>('all');

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    toast.success('All organizer notifications marked as read');
  };

  const handleClearAll = () => {
    setNotifications([]);
    toast.success('Organizer activity feed cleared');
  };

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    toast.success('Alert dismissed');
  };

  const handleMarkSingleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleItemClick = (n: OrganizerNotificationItem) => {
    handleMarkSingleRead(n.id);
    if (n.actionUrl) {
      navigate(n.actionUrl);
    }
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (activeTab === 'unread' && n.isRead) return false;
      if (activeTab === 'capacity' && n.category !== 'capacity') return false;
      if (activeTab === 'campaign' && n.category !== 'campaign') return false;
      if (activeTab === 'review' && n.category !== 'review') return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        return n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q);
      }
      return true;
    });
  }, [notifications, activeTab, search]);

  const getIcon = (cat: OrganizerNotificationItem['category']) => {
    switch (cat) {
      case 'capacity':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'campaign':
        return <Sparkles className="w-4 h-4 text-[#e65c36]" />;
      case 'review':
        return <Star className="w-4 h-4 text-emerald-600" />;
      case 'copilot':
        return <Bot className="w-4 h-4 text-[#8b5cf6]" />;
      default:
        return <Layers className="w-4 h-4 text-[#112b20]" />;
    }
  };

  const getBadgeClass = (color?: string) => {
    switch (color) {
      case 'red':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'amber':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'emerald':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'blue':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="w-full font-sans text-left space-y-6 max-w-6xl mx-auto pb-16">
      {/* 1. Top Status Banner Strip */}
      <div className="bg-[#0e261d] text-white px-5 py-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono shadow-xs border border-[#1b3d2f]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[#e65c36] font-bold">—</span>
          <span className="text-white font-bold tracking-wider uppercase">
            ORGANIZER WORKSPACE · NOTIFICATIONS & CAPACITY DISPATCH
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[#d8fa57] font-semibold">
            {unreadCount} pending alert{unreadCount !== 1 ? 's' : ''}
          </span>
          <span className="text-[#8ea79a]">•</span>
          <span className="text-[#a4efb3] text-[11px]">CampusIQ Live Sentinel</span>
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
              Organizer Notifications
            </h1>
            <p className="text-xs sm:text-sm text-[#5f6e65] mt-0.5">
              Monitor real-time capacity thresholds, campaign responses, and attendee intelligence reviews.
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
            { id: 'all', label: `All Alerts (${notifications.length})` },
            { id: 'unread', label: `Unread (${unreadCount})` },
            { id: 'capacity', label: 'Capacity Warnings' },
            { id: 'campaign', label: 'Smart Invites' },
            { id: 'review', label: 'Attendee Reviews' },
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
            placeholder="Search alerts, events, reviews..."
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
            <h3 className="font-bold text-sm text-[#19231e]">No organizer alerts in this view</h3>
            <p className="text-xs text-[#738278] max-w-sm mx-auto leading-relaxed">
              {activeTab === 'unread'
                ? 'All operational alerts and student reviews have been acknowledged.'
                : 'Registration velocity spikes, room changes, and feedback digests will appear here.'}
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
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getBadgeClass(
                          n.badgeColor
                        )}`}
                      >
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
