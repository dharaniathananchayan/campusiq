import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '../ui/Button';
import {
  Compass,
  CalendarCheck,
  Bookmark,
  Bot,
  LayoutDashboard,
  Calendar,
  Users,
  BarChart3,
  Sparkles,
  Plus,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Building2,
  GraduationCap,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { accessToken, role, user, loginAsStudent, loginAsOrganizer, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between gap-4">
        {/* Left Brand */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm tracking-tighter group-hover:bg-blue-600 transition-colors">
              IQ
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-base tracking-tight text-slate-900">CampusIQ</span>
              <span className="text-[10px] font-medium text-slate-600 uppercase tracking-wider">Portal</span>
            </div>
          </Link>

          {/* Quick Role Switcher Pill */}
          <div className="relative">
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200"
              title="Quickly switch roles for evaluation"
            >
              {role === 'student' ? (
                <>
                  <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                  <span>Student View</span>
                </>
              ) : role === 'organizer' ? (
                <>
                  <Building2 className="w-3.5 h-3.5 text-purple-600" />
                  <span>Organizer View</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span>Public View</span>
                </>
              )}
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {roleMenuOpen && (
              <div
                className="absolute left-0 mt-1.5 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 text-left"
                onMouseLeave={() => setRoleMenuOpen(false)}
              >
                <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                  Switch Active Persona
                </div>
                <button
                  onClick={() => {
                    loginAsStudent();
                    setRoleMenuOpen(false);
                    navigate('/student/dashboard');
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                >
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="font-medium">Student (Alex Chen)</p>
                    <p className="text-[10px] text-slate-400">Registrations, bookmarks, AI</p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    loginAsOrganizer();
                    setRoleMenuOpen(false);
                    navigate('/organizer/dashboard');
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                >
                  <Building2 className="w-4 h-4 text-purple-600" />
                  <div>
                    <p className="font-medium">Organizer (Dr. Jenkins)</p>
                    <p className="text-[10px] text-slate-400">Command Center, Attendees, Analytics</p>
                  </div>
                </button>
                <div className="border-t border-slate-100 mt-1 pt-1">
                  <button
                    onClick={() => {
                      logout();
                      setRoleMenuOpen(false);
                      navigate('/');
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 text-slate-500"
                  >
                    Switch to Public Mode
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            to="/events"
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
              isActive('/events')
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            Discover Events
          </Link>

          {role === 'student' && (
            <>
              <Link
                to="/student/dashboard"
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  isActive('/student/dashboard')
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <CalendarCheck className="w-3.5 h-3.5" />
                My Registrations
              </Link>
              <Link
                to="/student/bookmarks"
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  isActive('/student/bookmarks')
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                Saved
              </Link>
              <Link
                to="/student/ai/assistant"
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  isActive('/student/ai/assistant')
                    ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Bot className="w-3.5 h-3.5 text-blue-600" />
                Campus AI
              </Link>
            </>
          )}

          {role === 'organizer' && (
            <>
              <Link
                to="/organizer/dashboard"
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  isActive('/organizer/dashboard')
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Command Center
              </Link>
              <Link
                to="/organizer/events"
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  isActive('/organizer/events') && !location.pathname.includes('/new')
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Events
              </Link>
              <Link
                to="/organizer/attendees"
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  isActive('/organizer/attendees')
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Attendees
              </Link>
              <Link
                to="/organizer/analytics"
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  isActive('/organizer/analytics')
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Analytics
              </Link>
              <Link
                to="/organizer/ai/copilot"
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  isActive('/organizer/ai/copilot')
                    ? 'bg-purple-50 text-purple-700 font-semibold border border-purple-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                AI Co-Pilot
              </Link>
            </>
          )}
        </nav>

        {/* Right Nav Action */}
        <div className="flex items-center gap-2.5">
          {role === 'organizer' && (
            <Link to="/organizer/events/new">
              <Button size="sm" variant="primary" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                Create Event
              </Button>
            </Link>
          )}

          {accessToken && user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-slate-900 leading-none">{user.full_name}</p>
                <p className="text-[10px] text-slate-500 capitalize leading-tight mt-0.5">{role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="tertiary" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm">
                  Get Started
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
          <Link
            to="/events"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Discover Events
          </Link>
          {role === 'student' && (
            <>
              <Link
                to="/student/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                My Registrations & Schedule
              </Link>
              <Link
                to="/student/bookmarks"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Saved Events
              </Link>
              <Link
                to="/student/ai/assistant"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-xs font-medium text-blue-700 hover:bg-blue-50"
              >
                Campus AI Assistant
              </Link>
            </>
          )}
          {role === 'organizer' && (
            <>
              <Link
                to="/organizer/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Command Center
              </Link>
              <Link
                to="/organizer/events"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                All Events
              </Link>
              <Link
                to="/organizer/attendees"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Attendees & Tickets
              </Link>
              <Link
                to="/organizer/analytics"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Analytics
              </Link>
              <Link
                to="/organizer/ai/copilot"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-xs font-medium text-purple-700 hover:bg-purple-50"
              >
                AI Event Co-Pilot
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
};
