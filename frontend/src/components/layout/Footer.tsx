import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200/80 bg-white pt-12 pb-8 text-left text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                IQ
              </div>
              <span className="font-bold text-sm tracking-tight text-slate-900">CampusIQ</span>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 bg-slate-100 rounded border border-slate-200">
                Enterprise
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              Institutional event operating system for universities. Unifying academic departments, student organizations, venue operations, and campus engagement.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-700 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Campus Services Operational</span>
            </div>
          </div>

          {/* Student Experience */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900">For Students</h4>
            <ul className="space-y-1.5">
              <li><Link to="/events" className="hover:text-slate-900 transition-colors">Event Discovery</Link></li>
              <li><Link to="/student/dashboard" className="hover:text-slate-900 transition-colors">My Registrations</Link></li>
              <li><Link to="/student/bookmarks" className="hover:text-slate-900 transition-colors">Saved Events</Link></li>
              <li><Link to="/student/ai/assistant" className="hover:text-slate-900 transition-colors">Campus AI Assistant</Link></li>
            </ul>
          </div>

          {/* Organizer Experience */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900">For Organizers</h4>
            <ul className="space-y-1.5">
              <li><Link to="/organizer/dashboard" className="hover:text-slate-900 transition-colors">Command Center</Link></li>
              <li><Link to="/organizer/events/new" className="hover:text-slate-900 transition-colors">Create Event</Link></li>
              <li><Link to="/organizer/attendees" className="hover:text-slate-900 transition-colors">Event Insights</Link></li>
              <li><Link to="/organizer/analytics" className="hover:text-slate-900 transition-colors">Analytics & Insights</Link></li>
              <li><Link to="/organizer/ai/copilot" className="hover:text-slate-900 transition-colors">AI Event Co-Pilot</Link></li>
            </ul>
          </div>

          {/* Governance */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900">Compliance & Trust</h4>
            <ul className="space-y-1.5">
              <li className="flex items-center gap-1.5 text-slate-600">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>FERPA Compliant</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-600">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>University SSO / SAML</span>
              </li>
              <li><span className="text-slate-400">Campus Accessibility VPAT</span></li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <p>&copy; {new Date().getFullYear()} CampusIQ Institutional Platform. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-700 cursor-pointer">Privacy Standard</span>
            <span className="hover:text-slate-700 cursor-pointer">Security Protocol</span>
            <span className="hover:text-slate-700 cursor-pointer">Campus Directory</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
