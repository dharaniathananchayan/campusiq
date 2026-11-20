import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { eventsApi } from '../api/events';
import { mockEvents } from '../data/mockData';
import { PageLayout } from '../components/layout/PageLayout';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EventCard } from '../components/events/EventCard';
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Sparkles,
  Users,
  Search,
  Layers,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [activePersona, setActivePersona] = useState<'student' | 'organizer'>('student');

  const { data: featuredEvents = [] } = useQuery({
    queryKey: ['featuredEventsLanding'],
    queryFn: eventsApi.getFeaturedEvents,
    placeholderData: mockEvents.filter((e) => e.is_featured).slice(0, 3),
  });

  const displayEvents = featuredEvents.length > 0 ? featuredEvents : mockEvents.slice(0, 3);

  return (
    <PageLayout>
      <div className="space-y-24 py-4 text-left">
        {/* 1. Hero Section */}
        <section className="pt-8 pb-12 border-b border-slate-200/80">
          <div className="max-w-4xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span>Campus Operating System</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500">2026 Academic Term</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.1]">
              The unified event platform for university life and operations.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl font-normal">
              CampusIQ unifies student societies, academic departments, venue allocation, and ticketing into one calm, reliable institutional portal. Built for campus communities that value clarity, speed, and real participation.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link to="/events">
                <Button size="lg" variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Explore All Events
                </Button>
              </Link>
              <Link to="/register">
                <Button size="lg" variant="secondary">
                  Create University Account
                </Button>
              </Link>
            </div>

            {/* Institutional Trust Indicators */}
            <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-6 border-t border-slate-100 text-xs">
              <div>
                <p className="text-2xl font-bold text-slate-900 tabular-nums">48+</p>
                <p className="text-slate-500 font-medium mt-0.5">Departments & Clubs</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600 tabular-nums">100%</p>
                <p className="text-slate-500 font-medium mt-0.5">Capacity Enforcement</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 tabular-nums">18</p>
                <p className="text-slate-500 font-medium mt-0.5">Campus Venues</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600 tabular-nums">4.9 / 5</p>
                <p className="text-slate-500 font-medium mt-0.5">Student Satisfaction</p>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Interactive Value Proposition: Students vs Organizers */}
        <section className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Tailored Campus Experience
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Designed for both sides of university engagement.
              </h2>
            </div>

            {/* Persona Switcher Buttons */}
            <div className="flex p-1 bg-slate-100 rounded-lg border border-slate-200 self-start sm:self-auto">
              <button
                onClick={() => setActivePersona('student')}
                className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  activePersona === 'student'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                For Students
              </button>
              <button
                onClick={() => setActivePersona('organizer')}
                className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  activePersona === 'organizer'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                For Organizers & Faculty
              </button>
            </div>
          </div>

          {activePersona === 'student' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="space-y-3 p-6">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Search className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">Instant Event Discovery</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Search campus activities by department, topic, or seat availability. Filter out full sessions and bookmark talks to sync with your academic timetable.
                </p>
              </Card>

              <Card className="space-y-3 p-6">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">Guaranteed Seat Allocations</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  No more arriving at full lecture halls. Real-time capacity safeguards prevent overbooking and automatically manage fair waitlists.
                </p>
              </Card>

              <Card className="space-y-3 p-6">
                <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">Campus AI Assistant</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Ask natural language questions like "What computer vision seminars are scheduled next week?" and receive immediate, sourced answers.
                </p>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="space-y-3 p-6">
                <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">Command Center</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Monitor registration velocity across all hosted events. Track venue occupancy, check-in percentages, and attendance conversion in real time.
                </p>
              </Card>

              <Card className="space-y-3 p-6">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">AI Event Co-Pilot</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Draft complete academic symposiums, guest speaker panels, or workshops in seconds. Generates descriptions, tag suggestions, and target student criteria.
                </p>
              </Card>

              <Card className="space-y-3 p-6">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">Attendee & Ticket Roster</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Filter attendees by department, mark check-ins during the session, adjust venue limits on the fly, and export compliance CSV rosters.
                </p>
              </Card>
            </div>
          )}
        </section>

        {/* 3. Featured & Upcoming Events Preview */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Featured Highlights
              </span>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Upcoming campus sessions.
              </h2>
            </div>
            <Link to="/events">
              <Button variant="secondary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                View All Events
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>

        {/* 4. How CampusIQ Works */}
        <section className="space-y-8 pt-8 border-t border-slate-200/80">
          <div className="max-w-2xl space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Lifecycle
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              A frictionless campus experience from discovery to feedback.
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Engineered with university administration standards for zero friction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white border border-slate-200/80 rounded-xl space-y-3">
              <div className="text-xs font-mono font-semibold text-blue-600 bg-blue-50 w-6 h-6 rounded flex items-center justify-center">
                01
              </div>
              <h4 className="text-sm font-semibold text-slate-900">Publish & Coordinate</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Faculty and student leads publish events with venue rules, department eligibility, and capacity limits in minutes.
              </p>
            </div>

            <div className="p-6 bg-white border border-slate-200/80 rounded-xl space-y-3">
              <div className="text-xs font-mono font-semibold text-blue-600 bg-blue-50 w-6 h-6 rounded flex items-center justify-center">
                02
              </div>
              <h4 className="text-sm font-semibold text-slate-900">Discover & One-Click RSVP</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Students browse filtered listings or ask the Campus AI assistant, securing instant verified reservations on their student record.
              </p>
            </div>

            <div className="p-6 bg-white border border-slate-200/80 rounded-xl space-y-3">
              <div className="text-xs font-mono font-semibold text-blue-600 bg-blue-50 w-6 h-6 rounded flex items-center justify-center">
                03
              </div>
              <h4 className="text-sm font-semibold text-slate-900">Live Roster & Post-Event Feedback</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Organizers track attendance in real time. Students submit structured reviews, feeding AI sentiment summaries for continuous improvement.
              </p>
            </div>
          </div>
        </section>

        {/* 5. Institutional Trust Signals */}
        <section className="bg-slate-900 text-white rounded-2xl p-8 sm:p-12 space-y-8">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Enterprise Campus Standards</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Built for universities that need absolute reliability.
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Designed according to higher education standards: Single Sign-On integration, FERPA compliance, accessibility guidelines, and high-concurrency capacity locks.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Zero Overbooking</span>
              </div>
              <p className="text-xs text-slate-400">Atomic database transactions enforce venue fire codes strictly.</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>FERPA Compliant</span>
              </div>
              <p className="text-xs text-slate-400">Strict privacy controls protect student attendee records and feedback.</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>RAG AI Architecture</span>
              </div>
              <p className="text-xs text-slate-400">Retrieval-augmented generation grounds all assistant answers in real event data.</p>
            </div>
          </div>

          <div className="pt-4 flex flex-wrap gap-4">
            <Link to="/register">
              <Button size="md" className="bg-white text-slate-900 hover:bg-slate-100 border-white">
                Get Started Today
              </Button>
            </Link>
            <Link to="/events">
              <Button size="md" variant="secondary" className="bg-transparent text-white border-slate-700 hover:bg-slate-800 hover:text-white">
                Explore Event Catalog
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </PageLayout>
  );
};
