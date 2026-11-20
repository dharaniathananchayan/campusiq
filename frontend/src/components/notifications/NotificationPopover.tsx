import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  CheckCheck,
  X,
  Sparkles,
  Ticket,
  Mail,
  AlertTriangle,
  Star,
  Clock,
  ArrowRight,
  Trash2,
  Calendar,
  Layers,
  Users,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../../store/useAuthStore';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timeAgo: string;
  isRead: boolean;
  type: 'invite' | 'registration' | 'capacity' | 'review' | 'system' | 'reminder';
  actionUrl?: string;
  actionLabel?: string;
}

const INITIAL_STUDENT_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'sn-1',
    title: 'New Direct Invitation',
    message: 'CyberSec Club sent you an invite for "CTF Bootcamp: Zero to Hacker" (98% match).',
    timeAgo: '12m ago',
    isRead: false,
    type: 'invite',
    actionUrl: '/student/invitations',
    actionLabel: 'View Invite',
  },
  {
    id: 'sn-2',
    title: 'Registration Confirmed',
    message: 'Your spot is locked in for "HackNight: Build & Ship" in Innovation Hall B.',
    timeAgo: '2h ago',
    isRead: false,
    type: 'registration',
    actionUrl: '/student/registrations',
    actionLabel: 'Digital Pass',
  },
  {
    id: 'sn-3',
    title: 'Upcoming Session Tomorrow',
    message: 'RoboWars Season 4 kicks off tomorrow at 10:00 AM at the Robotics Arena.',
    timeAgo: '1d ago',
    isRead: true,
    type: 'reminder',
    actionUrl: '/student/registrations',
    actionLabel: 'Schedule',
  },
  {
    id: 'sn-4',
    title: 'AI Recommendation Match',
    message: '4 new tech workshops and AI hackathons match your saved Machine Learning interests.',
    timeAgo: '2d ago',
    isRead: true,
    type: 'system',
    actionUrl: '/student/ai-studio',
    actionLabel: 'Explore',
  },
];

const INITIAL_ORGANIZER_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'on-1',
    title: 'High Demand: 88% Full',
    message: '"CTF Bootcamp" is filling up rapidly. Only 9 seats left out of 120.',
    timeAgo: '8m ago',
    isRead: false,
    type: 'capacity',
    actionUrl: '/organizer/events',
    actionLabel: 'Manage Seats',
  },
  {
    id: 'on-2',
    title: 'Smart Invites Accepted',
    message: '18 students accepted your targeted campaign invites for "HackNight".',
    timeAgo: '45m ago',
    isRead: false,
    type: 'invite',
    actionUrl: '/organizer/invites',
    actionLabel: 'View Campaign',
  },
  {
    id: 'on-3',
    title: 'New 5-Star Attendee Review',
    message: 'Dev Kothari rated HackNight: "Phenomenal mentors, great pacing and swags!"',
    timeAgo: '3h ago',
    isRead: false,
    type: 'review',
    actionUrl: '/organizer/analytics',
    actionLabel: 'Read Reviews',
  },
  {
    id: 'on-4',
    title: 'AI Drafter Schedule Suggestion',
    message: 'CampusIQ co-pilot identified 3 optimal, clash-free slots for your next event.',
    timeAgo: '1d ago',
    isRead: true,
    type: 'system',
    actionUrl: '/organizer/events/new',
    actionLabel: 'Review Slots',
  },
];

interface NotificationPopoverProps {
  role?: 'student' | 'organizer';
  variant?: 'light' | 'dark';
}

export const NotificationPopover: React.FC<NotificationPopoverProps> = ({
  role: forcedRole,
  variant = 'dark',
}) => {
  const navigate = useNavigate();
  const { role: authRole } = useAuthStore();
  const currentRole = forcedRole || authRole || 'student';

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    return currentRole === 'organizer'
      ? INITIAL_ORGANIZER_NOTIFICATIONS
      : INITIAL_STUDENT_NOTIFICATIONS;
  });

  const popoverRef = useRef<HTMLDivElement | null>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    toast.success('All notifications marked as read');
  };

  const handleClearAll = () => {
    setNotifications([]);
    toast.success('Notification feed cleared');
  };

  const handleDismissOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleNotificationClick = (n: AppNotification) => {
    handleMarkAsRead(n.id);
    if (n.actionUrl) {
      navigate(n.actionUrl);
      setIsOpen(false);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    return true;
  });

  const getNotificationIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'invite':
        return <Mail className="w-3.5 h-3.5 text-[#e65c36]" />;
      case 'registration':
        return <Ticket className="w-3.5 h-3.5 text-[#19754f]" />;
      case 'capacity':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />;
      case 'review':
        return <Star className="w-3.5 h-3.5 text-amber-500" />;
      case 'reminder':
        return <Calendar className="w-3.5 h-3.5 text-[#2563eb]" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-[#d8fa57]" />;
    }
  };

  return (
    <div className="relative inline-block text-left" ref={popoverRef}>
      {/* Notification Bell Button */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Notifications"
        aria-expanded={isOpen}
        className={`relative w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
          variant === 'dark'
            ? 'bg-[#1b4333] border border-[#26533f] text-[#c4d6cb] hover:text-white hover:bg-[#204e3b]'
            : 'bg-[#f4f2ea] border border-[#dcd9ce] text-[#2c3b31] hover:bg-[#ece8dc]'
        } ${isOpen ? 'ring-2 ring-[#d8fa57]/50' : ''}`}
      >
        <Bell className="w-4 h-4" />

        {/* Unread Red/Coral Badge Dot */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e65c36] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-[#e65c36] text-white text-[9px] font-bold items-center justify-center shadow-xs">
              {unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Floating Notification Popover Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2.5 w-80 sm:w-96 bg-white text-[#19231e] rounded-2xl shadow-2xl border border-[#dedbd4] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 font-sans">
          {/* Header */}
          <div className="bg-[#112b20] text-white px-4 py-3 flex items-center justify-between border-b border-[#1b3d2f]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#1b4333] flex items-center justify-center text-[#d8fa57]">
                <Bell className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-white">Notifications</h3>
                <p className="text-[10px] text-[#a6c1b3]">
                  {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="px-2 py-1 rounded text-[10px] font-semibold text-[#d8fa57] hover:bg-[#1b4333] transition-colors cursor-pointer"
                  title="Mark all as read"
                >
                  Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-6 h-6 rounded flex items-center justify-center text-[#a6c1b3] hover:text-white hover:bg-[#1b4333] transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Filter Sub-bar */}
          <div className="px-4 py-2 bg-[#fbf9f4] border-b border-[#eeebe2] flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-colors cursor-pointer ${
                  filter === 'all'
                    ? 'bg-[#112b20] text-white'
                    : 'text-[#617167] hover:bg-[#eeebe2]'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('unread')}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-colors cursor-pointer ${
                  filter === 'unread'
                    ? 'bg-[#112b20] text-white'
                    : 'text-[#617167] hover:bg-[#eeebe2]'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            <span className="text-[10px] font-mono text-[#738278] uppercase">
              {currentRole === 'organizer' ? 'Organizer Feed' : 'Student Feed'}
            </span>
          </div>

          {/* Notifications Feed List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[#eeebe2]">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-[#f4f2ea] text-[#738278] flex items-center justify-center mx-auto">
                  <CheckCheck className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-xs text-[#19231e]">No notifications here</h4>
                <p className="text-[11px] text-[#738278] max-w-xs mx-auto">
                  {filter === 'unread'
                    ? 'You have read all your notifications!'
                    : 'Activity, event confirmations, and smart invites will arrive here.'}
                </p>
              </div>
            ) : (
              filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3.5 transition-colors cursor-pointer group flex items-start gap-3 relative ${
                    n.isRead ? 'bg-white hover:bg-[#fbf9f4]' : 'bg-[#f4f8f3] hover:bg-[#ecf4ea]'
                  }`}
                >
                  {/* Left Type Icon */}
                  <div className="w-7 h-7 rounded-lg bg-white border border-[#dedbd4] flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                    {getNotificationIcon(n.type)}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h4
                        className={`text-xs truncate ${
                          n.isRead ? 'font-semibold text-[#19231e]' : 'font-extrabold text-[#112b20]'
                        }`}
                      >
                        {n.title}
                      </h4>
                      <span className="text-[10px] text-[#8e9c93] shrink-0 font-medium">
                        {n.timeAgo}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#55695f] leading-relaxed line-clamp-2">
                      {n.message}
                    </p>

                    {/* Action pill if available */}
                    {n.actionLabel && (
                      <div className="mt-2 flex items-center gap-1 text-[11px] font-bold text-[#e65c36] group-hover:underline">
                        <span>{n.actionLabel}</span>
                        <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    )}
                  </div>

                  {/* Unread indicator dot */}
                  {!n.isRead && (
                    <span className="w-2 h-2 rounded-full bg-[#e65c36] absolute top-4 right-3 shrink-0" />
                  )}

                  {/* Quick dismiss button */}
                  <button
                    type="button"
                    onClick={(e) => handleDismissOne(n.id, e)}
                    className="opacity-0 group-hover:opacity-100 absolute top-3 right-2 w-5 h-5 rounded hover:bg-[#dedbd4] text-[#738278] hover:text-[#19231e] flex items-center justify-center transition-all cursor-pointer"
                    title="Dismiss"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer Bar */}
          <div className="bg-[#fbf9f4] px-4 py-2.5 border-t border-[#eeebe2] flex items-center justify-between text-xs">
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[11px] text-[#738278] hover:text-rose-600 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear all</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                if (currentRole === 'organizer') {
                  navigate('/organizer/notifications');
                } else {
                  navigate('/student/notifications');
                }
              }}
              className="text-[11px] font-bold text-[#112b20] hover:text-[#e65c36] hover:underline flex items-center gap-1 ml-auto cursor-pointer"
            >
              <span>Full Activity Hub</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
