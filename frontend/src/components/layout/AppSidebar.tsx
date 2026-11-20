import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  Plus,
  BarChart3,
  Sparkles,
  User,
  Compass,
  Mail,
  CheckCircle2,
  Heart,
  Bell,
  MessagesSquare,
  LogOut,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../../store/useAuthStore';
import '../Portal.css';

interface AppSidebarProps {
  forcedRole?: 'student' | 'organizer';
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ forcedRole }) => {
  const { user, role: authRole, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const role = forcedRole || authRole || 'student';

  const organizerLinks = [
    { to: '/organizer/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/organizer/events', label: 'My events', icon: CalendarDays },
    { to: '/organizer/events/new', label: 'Create event', icon: Plus },
    { to: '/organizer/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/organizer/invites', label: 'Smart Invites', icon: Sparkles },
    { to: '/organizer/discussions', label: 'Discussions', icon: MessagesSquare },
    { to: '/organizer/notifications', label: 'Notifications', icon: Bell },
    { to: '/organizer/profile', label: 'View Profile', icon: User },
  ];

  const studentLinks = [
    { to: '/student/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/events', label: 'Discover', icon: Compass },
    { to: '/student/ai-studio', label: 'Events you might like', icon: Sparkles },
    { to: '/student/invitations', label: 'Invitations', icon: Mail },
    { to: '/student/registrations', label: 'My schedule', icon: CheckCircle2 },
    { to: '/student/bookmarks', label: 'Saved events', icon: Heart },
    { to: '/student/discussions', label: 'Discussions', icon: MessagesSquare },
    { to: '/student/notifications', label: 'Notifications', icon: Bell },
    { to: '/student/profile', label: 'View Profile', icon: User },
  ];

  const links = role === 'organizer' ? organizerLinks : studentLinks;

  const initials =
    user?.full_name
      ?.split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || (role === 'organizer' ? 'CS' : 'AC');

  const displayName =
    user?.full_name ||
    (user as any)?.organization_name ||
    (role === 'organizer' ? 'CodeCell Society' : 'Alex Chen');

  const orgOrRole =
    (user as any)?.organization_name ||
    (role === 'organizer' ? 'Event Organizer' : 'Campus Member');

  const handleSignOut = () => {
    logout();
    toast.success('Signed out successfully');
    navigate('/login', { replace: true });
  };

  return (
    <aside className="portal-nav font-sans shrink-0">
      {/* 1. Brand Logo */}
      <Link className="portal-brand" to={role === 'organizer' ? '/organizer/dashboard' : '/student/dashboard'}>
        <span className="portal-brand-mark">▥</span>
        <span>
          campus<span style={{ color: '#f4673a' }}>iq</span>
        </span>
      </Link>

      {/* 2. Space / Studio Role Label */}
      <div className="portal-nav__role">
        {role === 'organizer' ? 'ORGANIZER STUDIO' : 'STUDENT SPACE'}
      </div>

      {/* 3. Navigation Links */}
      <nav>
        {links.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.to ||
            (item.to === '/organizer/dashboard' &&
              (location.pathname === '/organizer' ||
                location.pathname === '/organizer/' ||
                location.pathname === '/organizer/dashboard')) ||
            (item.to === '/student/dashboard' &&
              (location.pathname === '/student' ||
                location.pathname === '/student/' ||
                location.pathname === '/student/dashboard')) ||
            (item.to === '/student/registrations' &&
              (location.pathname === '/student/registrations' ||
                location.pathname === '/schedule' ||
                location.pathname === '/student/schedule')) ||
            (item.to === '/student/bookmarks' &&
              (location.pathname === '/student/bookmarks' ||
                location.pathname === '/bookmarks' ||
                location.pathname === '/saved')) ||
            (item.to === '/student/ai-studio' &&
              (location.pathname === '/student/ai-studio' ||
                location.pathname === '/student/recommended' ||
                location.pathname === '/events-you-might-like')) ||
            (item.to === '/student/profile' &&
              (location.pathname === '/student/profile' ||
                location.pathname === '/student/profile/edit')) ||
            (item.to === '/organizer/discussions' &&
              location.pathname === '/organizer/discussions') ||
            (item.to === '/student/discussions' &&
              location.pathname === '/student/discussions') ||
            (item.to === '/organizer/notifications' &&
              location.pathname === '/organizer/notifications') ||
            (item.to === '/student/notifications' &&
              location.pathname === '/student/notifications');

          return (
            <Link
              key={item.to}
              to={item.to}
              className={isActive ? 'current' : ''}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* 4. Bottom User Profile & Sign Out */}
      <div className="portal-user">
        <Link
          to={role === 'organizer' ? '/organizer/profile' : '/student/profile'}
          className="portal-user-profile"
          style={{ textDecoration: 'none' }}
          title="View profile"
        >
          <div className="portal-user-avatar">{initials}</div>
          <div className="portal-user-info">
            <b>{displayName}</b>
            <span>{orgOrRole}</span>
          </div>
        </Link>
        <button type="button" onClick={handleSignOut} title="Sign out of CampusIQ">
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </aside>
  );
};
