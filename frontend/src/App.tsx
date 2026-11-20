import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuthStore } from './store/useAuthStore';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { Portal } from './components/Portal';
import { EventSpotlight } from './components/EventSpotlight';
import { FloatingChatbot } from './components/ai/FloatingChatbot';
import { StudentDiscoverView } from './components/views/StudentDiscoverView';
import { OrganizerDashboardView } from './components/views/OrganizerDashboardView';
import './App.css';
import './Auth.css';
import './Profile.css';

export const App = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { accessToken, role } = useAuthStore();

  const isAuthenticated = Boolean(accessToken && role);
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  // Redirect unauthenticated users to /login if they attempt to access protected pages directly
  useEffect(() => {
    if (!isAuthenticated && !isAuthPage) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, isAuthPage, navigate]);

  // Redirect authenticated users away from /login or /register to their role home
  useEffect(() => {
    if (isAuthenticated && isAuthPage) {
      if (role === 'organizer') {
        navigate('/organizer/dashboard', { replace: true });
      } else {
        navigate('/student/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, isAuthPage, role, navigate]);

  // Protect organizer routes: students cannot access organizer routes
  useEffect(() => {
    if (isAuthenticated && role === 'student' && location.pathname.startsWith('/organizer')) {
      toast.error('Access restricted: Organizer workspace requires an organizer account.');
      navigate('/student/dashboard', { replace: true });
    }
  }, [isAuthenticated, role, location.pathname, navigate]);

  // 1. Unauthenticated Gateway: show Sign In page first (or Register page)
  if (!isAuthenticated) {
    return (
      <>
        <LoginPage />
        <FloatingChatbot />
      </>
    );
  }

  // 2. Authenticated Role-Based Routes
  const isOrganizerHome =
    location.pathname === '/organizer' ||
    location.pathname === '/organizer/' ||
    location.pathname === '/organizer/dashboard';

  const isOrganizerWorkspaceCustom =
    location.pathname === '/organizer/events' ||
    location.pathname === '/organizer/events/new' ||
    location.pathname === '/organizer/analytics' ||
    location.pathname === '/organizer/invites' ||
    location.pathname === '/organizer/discussions' ||
    location.pathname === '/organizer/notifications' ||
    location.pathname === '/organizer/profile';

  const isSubOrganizerWorkspace =
    location.pathname.startsWith('/organizer/') && !isOrganizerHome && !isOrganizerWorkspaceCustom;

  const isStudentWorkspaceExtra =
    location.pathname.startsWith('/student/') &&
    location.pathname !== '/student/dashboard' &&
    location.pathname !== '/student' &&
    location.pathname !== '/student/profile' &&
    location.pathname !== '/student/profile/edit' &&
    location.pathname !== '/student/discussions' &&
    location.pathname !== '/student/notifications';

  // Event Details (shared view)
  if (location.pathname.startsWith('/events/')) {
    return (
      <>
        <EventSpotlight />
        <FloatingChatbot />
      </>
    );
  }

  // Sub-workspaces (tickets, schedule, analytics, attendee manager, etc.)
  if (
    isSubOrganizerWorkspace ||
    isStudentWorkspaceExtra ||
    location.pathname === '/schedule' ||
    location.pathname === '/schedule/' ||
    location.pathname === '/bookmarks' ||
    location.pathname === '/bookmarks/' ||
    location.pathname === '/saved' ||
    location.pathname === '/saved/'
  ) {
    return (
      <>
        <Portal />
        <FloatingChatbot />
      </>
    );
  }

  // Organizer Dashboard Home & Custom Views (Overview, My Events, Create Event, Analytics)
  if ((isOrganizerHome || isOrganizerWorkspaceCustom) && role === 'organizer') {
    return (
      <>
        <OrganizerDashboardView
          onSwitchToStudent={() => navigate('/student/dashboard')}
          onCreateEvent={() => navigate('/organizer/events/new')}
          onOpenCopilot={() => {
            window.dispatchEvent(
              new CustomEvent('open-floating-chatbot', { detail: { mode: 'copilot' } })
            );
          }}
        />
        <FloatingChatbot />
      </>
    );
  }

  // If root `/` is accessed by an organizer, direct them to organizer dashboard
  if (location.pathname === '/' && role === 'organizer') {
    return (
      <>
        <OrganizerDashboardView
          onSwitchToStudent={() => navigate('/student/dashboard')}
          onCreateEvent={() => navigate('/organizer/events/new')}
          onOpenCopilot={() => {
            window.dispatchEvent(
              new CustomEvent('open-floating-chatbot', { detail: { mode: 'copilot' } })
            );
          }}
        />
        <FloatingChatbot />
      </>
    );
  }

  // Student Discover View (Home `/`, `/events`, `/student`, `/student/dashboard`)
  return (
    <>
      <StudentDiscoverView
        onSwitchToOrganizer={() => navigate('/organizer/dashboard')}
        onOpenAssistant={(query) => {
          window.dispatchEvent(
            new CustomEvent('open-floating-chatbot', {
              detail: { mode: 'assistant', initialQuery: query },
            })
          );
        }}
      />
      <FloatingChatbot />
    </>
  );
};

export default App;
