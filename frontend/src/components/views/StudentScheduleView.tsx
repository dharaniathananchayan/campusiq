import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Download,
  Share2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Sparkles,
  ExternalLink,
  Ticket,
  Star,
  Users,
  Compass,
  X,
  PlayCircle,
  FileText,
  CalendarCheck,
  Check,
  ArrowRight,
  Award,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../../store/useAuthStore';

export type ScheduleStatus = 'all' | 'ongoing' | 'upcoming' | 'completed';

export interface ScheduledEvent {
  id: string;
  title: string;
  organizer: string;
  category: string;
  status: 'ongoing' | 'upcoming' | 'completed';
  startDate: string; // ISO format or YYYY-MM-DD
  endDate: string;
  timeRange: string;
  location: string;
  room: string;
  registrationId: string;
  seatNumber?: string;
  matchScore: number;
  attendedHours?: number;
  hasCertificate?: boolean;
  notes?: string;
  rating?: number;
  progressPercent?: number; // for ongoing
}

export const StudentScheduleView: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<ScheduleStatus>('all');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentCalendarDate, setCurrentCalendarDate] = useState<Date>(new Date(2026, 9, 1)); // Oct 2026 as per app demo date
  const [ticketModalEvent, setTicketModalEvent] = useState<ScheduledEvent | null>(null);
  const [feedbackModalEvent, setFeedbackModalEvent] = useState<ScheduledEvent | null>(null);
  const [userRating, setUserRating] = useState<number>(5);
  const [feedbackComment, setFeedbackComment] = useState<string>('');

  // Sample comprehensive schedule data for student
  const [events, setEvents] = useState<ScheduledEvent[]>([
    // ONGOING EVENTS (Live Now)
    {
      id: 'sched-1',
      title: 'HackNight: Build & Ship in 12 Hours',
      organizer: 'CodeCell Society',
      category: 'Technology',
      status: 'ongoing',
      startDate: '2026-10-01',
      endDate: '2026-10-01',
      timeRange: '10:00 AM – 10:00 PM',
      location: 'Maxwell Innovation Lab Complex',
      room: 'Lab 102 & Maker Hall',
      registrationId: 'REG-8921-HN',
      seatNumber: 'Table 4B',
      matchScore: 98,
      progressPercent: 55,
      notes: 'Active hack sprint underway. Mentors available at Desk 3.',
    },
    {
      id: 'sched-2',
      title: 'AI Builders Hands-on Lab: Fine-Tuning Llama 3',
      organizer: 'AI Student Chapter',
      category: 'Research',
      status: 'ongoing',
      startDate: '2026-10-01',
      endDate: '2026-10-01',
      timeRange: '01:30 PM – 05:30 PM',
      location: 'Turing Grand Auditorium',
      room: 'Computing Suite 2',
      registrationId: 'REG-8922-AI',
      seatNumber: 'Seat E-14',
      matchScore: 94,
      progressPercent: 35,
      notes: 'GPU cluster notebooks active. Bring your USB-C charger.',
    },

    // UPCOMING EVENTS (Future Confirmed Bookings)
    {
      id: 'sched-3',
      title: 'CTF Bootcamp: Zero to Hacker Weekend',
      organizer: 'CyberSec Club',
      category: 'Career',
      status: 'upcoming',
      startDate: '2026-10-04',
      endDate: '2026-10-05',
      timeRange: '10:00 AM – 06:00 PM',
      location: 'Science Complex',
      room: 'Hall A',
      registrationId: 'REG-9014-CTF',
      seatNumber: 'Desk 22',
      matchScore: 96,
      notes: 'Pre-requisite: Install Kali Linux VM or Docker container.',
    },
    {
      id: 'sched-4',
      title: 'Venture Sprint: Campus Startup Pitch & Showcase',
      organizer: 'Campus Entrepreneurship Lab',
      category: 'Leadership',
      status: 'upcoming',
      startDate: '2026-10-08',
      endDate: '2026-10-08',
      timeRange: '02:00 PM – 06:00 PM',
      location: 'Founders Hall',
      room: 'Auditorium 1',
      registrationId: 'REG-9102-VS',
      seatNumber: 'Row C-8',
      matchScore: 89,
      notes: 'Angel investors and alumni scouts attending.',
    },
    {
      id: 'sched-5',
      title: 'RoboWars Season 4: Autonomous Drone Challenge',
      organizer: 'Robotics & Hardware Club',
      category: 'Technology',
      status: 'upcoming',
      startDate: '2026-10-11',
      endDate: '2026-10-11',
      timeRange: '09:00 AM – 05:00 PM',
      location: 'Campus Sports Arena',
      room: 'Arena Ground Zone B',
      registrationId: 'REG-9145-RW',
      seatNumber: 'Paddock 6',
      matchScore: 91,
      notes: 'Safety goggles provided at registration counter.',
    },
    {
      id: 'sched-6',
      title: 'Fall University Career Fair: Engineering & Tech',
      organizer: 'Northwood Career Advancement Center',
      category: 'Career',
      status: 'upcoming',
      startDate: '2026-10-16',
      endDate: '2026-10-16',
      timeRange: '11:00 AM – 04:00 PM',
      location: 'Student Union Plaza',
      room: 'Grand Exhibition Hall',
      registrationId: 'REG-9210-CF',
      seatNumber: 'Priority Slot 14',
      matchScore: 95,
      notes: 'Bring printed resumes and digital portfolio QR.',
    },
    {
      id: 'sched-7',
      title: 'Design Systems Workshop: Figma to Code in React',
      organizer: 'Design Guild & UI Collective',
      category: 'Arts',
      status: 'upcoming',
      startDate: '2026-10-21',
      endDate: '2026-10-21',
      timeRange: '03:00 PM – 06:00 PM',
      location: 'Fine Arts & Media Building',
      room: 'Media Studio 3',
      registrationId: 'REG-9288-DS',
      seatNumber: 'Studio Desk 11',
      matchScore: 86,
    },
    {
      id: 'sched-8',
      title: 'Open-Source Hacktoberfest Campus Sprint',
      organizer: 'Northwood Open Source Guild',
      category: 'Technology',
      status: 'upcoming',
      startDate: '2026-10-25',
      endDate: '2026-10-25',
      timeRange: '10:00 AM – 08:00 PM',
      location: 'Central Library Commons',
      room: 'Collaborative Study Pod B',
      registrationId: 'REG-9340-OS',
      seatNumber: 'Pod 4',
      matchScore: 92,
    },

    // COMPLETED EVENTS (Past Attended)
    {
      id: 'sched-9',
      title: 'University AI Symposium: Frontiers in Generative Architecture',
      organizer: 'Association of Computing & Engineering',
      category: 'Research',
      status: 'completed',
      startDate: '2026-09-18',
      endDate: '2026-09-18',
      timeRange: '09:00 AM – 05:00 PM',
      location: 'Turing Grand Auditorium',
      room: 'Main Hall',
      registrationId: 'REG-8120-AIS',
      seatNumber: 'Seat B-12',
      matchScore: 97,
      attendedHours: 8,
      hasCertificate: true,
      rating: 5,
      notes: 'Keynote by Stanford AI Fellow. Certified badge earned.',
    },
    {
      id: 'sched-10',
      title: 'Intro to Rust Systems Programming & Memory Safety',
      organizer: 'Systems Programming Chapter',
      category: 'Technology',
      status: 'completed',
      startDate: '2026-09-12',
      endDate: '2026-09-12',
      timeRange: '02:00 PM – 06:00 PM',
      location: 'Maxwell Science Complex',
      room: 'Room 204',
      registrationId: 'REG-8012-RUST',
      seatNumber: 'Desk 8',
      matchScore: 93,
      attendedHours: 4,
      hasCertificate: true,
      rating: 5,
    },
    {
      id: 'sched-11',
      title: 'Campus Startup Founder Fireside Chat',
      organizer: 'Campus Entrepreneurship Lab',
      category: 'Leadership',
      status: 'completed',
      startDate: '2026-09-05',
      endDate: '2026-09-05',
      timeRange: '05:00 PM – 08:00 PM',
      location: 'Innovation Wing',
      room: 'Lounge A',
      registrationId: 'REG-7890-FC',
      seatNumber: 'Open Seating',
      matchScore: 84,
      attendedHours: 3,
      hasCertificate: false,
      rating: 4,
    },
    {
      id: 'sched-12',
      title: 'Cybersecurity Defense League: Fall Qualifier',
      organizer: 'CyberSec Club',
      category: 'Technology',
      status: 'completed',
      startDate: '2026-08-28',
      endDate: '2026-08-28',
      timeRange: '10:00 AM – 04:00 PM',
      location: 'Science Complex',
      room: 'Server Lab 3',
      registrationId: 'REG-7622-CDL',
      seatNumber: 'Terminal 19',
      matchScore: 91,
      attendedHours: 6,
      hasCertificate: true,
      rating: 5,
    },
  ]);

  // Statistics counters
  const stats = useMemo(() => {
    const ongoing = events.filter((e) => e.status === 'ongoing').length;
    const upcoming = events.filter((e) => e.status === 'upcoming').length;
    const completed = events.filter((e) => e.status === 'completed').length;
    const totalHours = events
      .filter((e) => e.status === 'completed')
      .reduce((acc, curr) => acc + (curr.attendedHours || 0), 0);

    return {
      total: events.length,
      ongoing,
      upcoming,
      completed,
      totalHours,
    };
  }, [events]);

  // Filter events by tab and by calendar date (if selected)
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      // 1. Tab filter
      if (activeTab !== 'all' && ev.status !== activeTab) {
        return false;
      }
      // 2. Calendar date filter
      if (selectedDate) {
        const dateStr = selectedDate.toISOString().split('T')[0];
        if (ev.startDate !== dateStr && ev.endDate !== dateStr) {
          return false;
        }
      }
      return true;
    });
  }, [events, activeTab, selectedDate]);

  // Calendar Helpers
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  const monthName = currentCalendarDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  // Map dates in current month to event statuses
  const dateEventsMap = useMemo(() => {
    const map: Record<number, { ongoing: boolean; upcoming: boolean; completed: boolean; count: number }> = {};
    events.forEach((ev) => {
      const evDate = new Date(ev.startDate);
      if (evDate.getFullYear() === year && evDate.getMonth() === month) {
        const day = evDate.getDate();
        if (!map[day]) {
          map[day] = { ongoing: false, upcoming: false, completed: false, count: 0 };
        }
        map[day].count += 1;
        if (ev.status === 'ongoing') map[day].ongoing = true;
        if (ev.status === 'upcoming') map[day].upcoming = true;
        if (ev.status === 'completed') map[day].completed = true;
      }
    });
    return map;
  }, [events, year, month]);

  const handlePrevMonth = () => {
    setCurrentCalendarDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentCalendarDate(new Date(year, month + 1, 1));
  };

  const handleDateClick = (day: number) => {
    const targetDate = new Date(year, month, day);
    if (
      selectedDate &&
      selectedDate.getFullYear() === year &&
      selectedDate.getMonth() === month &&
      selectedDate.getDate() === day
    ) {
      setSelectedDate(null); // toggle off
    } else {
      setSelectedDate(targetDate);
    }
  };

  const handleCancelBooking = (eventId: string, title: string) => {
    if (window.confirm(`Are you sure you want to release your seat for "${title}"?`)) {
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      toast.success('Registration released. Seat opened to waitlisted students.');
    }
  };

  const handleExportICS = () => {
    const icsData =
      'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//CampusIQ//Student Schedule//EN\n' +
      events
        .map(
          (e) =>
            `BEGIN:VEVENT\nSUMMARY:${e.title}\nLOCATION:${e.location} - ${e.room}\nDESCRIPTION:Organized by ${e.organizer}. Registration: ${e.registrationId}\nSTATUS:CONFIRMED\nEND:VEVENT`
        )
        .join('\n') +
      '\nEND:VCALENDAR';

    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', 'campusiq_my_schedule.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Downloaded iCalendar schedule (.ics) file!');
  };

  const handleSaveFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (feedbackModalEvent) {
      setEvents((prev) =>
        prev.map((item) =>
          item.id === feedbackModalEvent.id ? { ...item, rating: userRating } : item
        )
      );
      toast.success('Thank you! Feedback submitted to organizers.');
      setFeedbackModalEvent(null);
    }
  };

  return (
    <div className="w-full font-sans text-left space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. Header with Title, Actions & View Mode Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#e5e2d6]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold tracking-widest text-[#e65c36] uppercase">
              STUDENT SPACE
            </span>
            <span className="text-[#8e998a]">•</span>
            <span className="text-xs font-semibold text-[#11241c]">Northwood University</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#11241c] mt-1 flex items-center gap-2.5">
            <CalendarCheck className="w-7 h-7 text-[#112b20]" />
            <span>My Schedule</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#526359] mt-0.5 max-w-2xl">
            Live tracker for your campus commitments: view ongoing sessions, upcoming guaranteed passes, and completed certificates.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportICS}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#f8f7f2] text-[#19231e] border border-[#dcd9ce] rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
            title="Export iCalendar file"
          >
            <Download className="w-3.5 h-3.5 text-[#e65c36]" />
            <span>Sync iCal</span>
          </button>

          <button
            onClick={() => navigate('/events')}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#112b20] hover:bg-[#1a4030] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5 text-[#d8fa57]" />
            <span>Discover More</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards (Overview at a glance) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Scheduled */}
        <div
          onClick={() => setActiveTab('all')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'bg-white border-[#112b20] ring-2 ring-[#112b20]/10 shadow-xs'
              : 'bg-white border-[#e5e2d6] hover:border-[#cfcbc0]'
          }`}
        >
          <div className="text-[10px] font-mono font-bold tracking-wider text-[#738278] uppercase">
            TOTAL SCHEDULED
          </div>
          <div className="text-3xl font-extrabold text-[#19231e] mt-1.5">{stats.total}</div>
          <div className="text-xs text-[#526359] font-medium mt-1">All events together</div>
        </div>

        {/* Ongoing */}
        <div
          onClick={() => setActiveTab('ongoing')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'ongoing'
              ? 'bg-[#f4faee] border-[#1f6b45] ring-2 ring-[#1f6b45]/15 shadow-xs'
              : 'bg-white border-[#e5e2d6] hover:border-[#cfcbc0]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold tracking-wider text-[#1f6b45] uppercase">
              LIVE / ONGOING
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          </div>
          <div className="text-3xl font-extrabold text-[#1f6b45] mt-1.5">{stats.ongoing}</div>
          <div className="text-xs text-emerald-700 font-semibold mt-1">Happening right now</div>
        </div>

        {/* Upcoming */}
        <div
          onClick={() => setActiveTab('upcoming')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'upcoming'
              ? 'bg-[#fef9f7] border-[#e65c36] ring-2 ring-[#e65c36]/15 shadow-xs'
              : 'bg-white border-[#e5e2d6] hover:border-[#cfcbc0]'
          }`}
        >
          <div className="text-[10px] font-mono font-bold tracking-wider text-[#e65c36] uppercase">
            UPCOMING SESSIONS
          </div>
          <div className="text-3xl font-extrabold text-[#e65c36] mt-1.5">{stats.upcoming}</div>
          <div className="text-xs text-[#a34428] font-medium mt-1">Confirmed admissions</div>
        </div>

        {/* Completed */}
        <div
          onClick={() => setActiveTab('completed')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'completed'
              ? 'bg-[#fbf9f4] border-[#112b20] ring-2 ring-[#112b20]/15 shadow-xs'
              : 'bg-white border-[#e5e2d6] hover:border-[#cfcbc0]'
          }`}
        >
          <div className="text-[10px] font-mono font-bold tracking-wider text-[#738278] uppercase">
            COMPLETED & CERTIFIED
          </div>
          <div className="text-3xl font-extrabold text-[#19231e] mt-1.5">{stats.completed}</div>
          <div className="text-xs text-[#526359] font-medium mt-1">{stats.totalHours} hrs attended</div>
        </div>
      </div>

      {/* 3. Main Two-Column Layout (Interactive Calendar on Left, Filterable Event Feed on Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================= LEFT COLUMN: INTERACTIVE CALENDAR ================= */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-5">
          {/* Calendar Card */}
          <div className="bg-white rounded-2xl p-5 border border-[#e5e2d6] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            {/* Calendar Month Navigation Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-sm sm:text-base text-[#19231e] tracking-tight flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-[#e65c36]" />
                <span>{monthName}</span>
              </h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevMonth}
                  className="w-7 h-7 rounded-lg bg-[#f4f2ea] hover:bg-[#ece8dc] text-[#344138] flex items-center justify-center transition-colors cursor-pointer"
                  title="Previous month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentCalendarDate(new Date(2026, 9, 1))}
                  className="px-2 py-1 rounded-lg bg-[#f4f2ea] hover:bg-[#ece8dc] text-[#344138] text-[11px] font-bold transition-colors cursor-pointer"
                >
                  Today
                </button>
                <button
                  onClick={handleNextMonth}
                  className="w-7 h-7 rounded-lg bg-[#f4f2ea] hover:bg-[#ece8dc] text-[#344138] flex items-center justify-center transition-colors cursor-pointer"
                  title="Next month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Day of Week Headers */}
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                <div key={d} className="text-[11px] font-mono font-bold text-[#8fa095] py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-1.5 text-center">
              {/* Empty leading offset days */}
              {Array.from({ length: firstDayIndex }).map((_, idx) => (
                <div key={`empty-${idx}`} className="h-9 sm:h-10 rounded-xl bg-transparent"></div>
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNumber = idx + 1;
                const info = dateEventsMap[dayNumber];
                const isSelected =
                  selectedDate &&
                  selectedDate.getFullYear() === year &&
                  selectedDate.getMonth() === month &&
                  selectedDate.getDate() === dayNumber;

                const isToday =
                  year === 2026 && month === 9 && dayNumber === 1; // Demo today: Oct 1, 2026

                return (
                  <button
                    key={`day-${dayNumber}`}
                    onClick={() => handleDateClick(dayNumber)}
                    className={`relative h-9 sm:h-10 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer text-xs font-semibold ${
                      isSelected
                        ? 'bg-[#112b20] text-white shadow-xs'
                        : isToday
                        ? 'bg-[#f4faee] text-[#1f6b45] font-bold border-2 border-[#1f6b45]'
                        : info
                        ? 'bg-[#fbf9f4] hover:bg-[#f4f1e6] text-[#19231e] border border-[#e8e4d8]'
                        : 'text-[#6b7870] hover:bg-[#fbf9f4]'
                    }`}
                  >
                    <span>{dayNumber}</span>

                    {/* Dot indicators for events */}
                    {info && (
                      <div className="flex items-center gap-0.5 mt-0.5">
                        {info.ongoing && (
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSelected ? 'bg-[#d8fa57]' : 'bg-emerald-500 animate-pulse'
                            }`}
                          ></span>
                        )}
                        {info.upcoming && (
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSelected ? 'bg-orange-300' : 'bg-[#e65c36]'
                            }`}
                          ></span>
                        )}
                        {info.completed && (
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSelected ? 'bg-slate-300' : 'bg-slate-400'
                            }`}
                          ></span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Calendar Legend */}
            <div className="flex items-center justify-between gap-2 pt-4 mt-4 border-t border-[#eeebe2] text-[11px] text-[#6b7870]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Ongoing</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#e65c36]"></span>
                <span>Upcoming</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                <span>Completed</span>
              </div>
            </div>

            {/* Clear selected date filter button if active */}
            {selectedDate && (
              <div className="mt-3 pt-3 border-t border-[#eeebe2] flex items-center justify-between">
                <span className="text-xs text-[#19231e] font-bold">
                  Filtered by:{' '}
                  {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="text-xs text-[#e65c36] hover:underline font-semibold cursor-pointer"
                >
                  Clear filter
                </button>
              </div>
            )}
          </div>

          {/* Quick Schedule Notice Card */}
          <div className="bg-[#122b20] text-white rounded-2xl p-5 border border-[#1d3f30] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 font-bold text-sm text-white">
                <Sparkles className="w-4 h-4 text-[#d8fa57]" />
                <span>Smart Sync Active</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#1e4a36] text-[#a4efb3] text-[10px] font-bold">
                Live
              </span>
            </div>
            <p className="text-xs text-[#8ea79a] leading-relaxed">
              Registrations automatically check for timetable clashes against your department class lectures.
            </p>
            <div className="mt-3 pt-3 border-t border-[#27533f] flex items-center justify-between text-xs text-[#d8fa57]">
              <span>0 schedule conflicts detected</span>
              <Check className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: STATUS TABS & EVENT LIST ================= */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-5">
          {/* Status Tabs Navigation Bar (Together / Ongoing / Upcoming / Completed) */}
          <div className="bg-white rounded-2xl p-2 border border-[#e5e2d6] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'all'
                  ? 'bg-[#112b20] text-white shadow-xs'
                  : 'text-[#526359] hover:bg-[#fbf9f4]'
              }`}
            >
              <span>All / Together</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === 'all' ? 'bg-[#214a37] text-white' : 'bg-[#eeebe2] text-[#4a574f]'
                }`}
              >
                {stats.total}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('ongoing')}
              className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'ongoing'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-[#526359] hover:bg-[#fbf9f4]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Ongoing</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === 'ongoing' ? 'bg-emerald-900 text-white' : 'bg-[#eeebe2] text-[#4a574f]'
                }`}
              >
                {stats.ongoing}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('upcoming')}
              className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'upcoming'
                  ? 'bg-[#e65c36] text-white shadow-xs'
                  : 'text-[#526359] hover:bg-[#fbf9f4]'
              }`}
            >
              <span>Upcoming</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === 'upcoming' ? 'bg-[#b84221] text-white' : 'bg-[#eeebe2] text-[#4a574f]'
                }`}
              >
                {stats.upcoming}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('completed')}
              className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'completed'
                  ? 'bg-[#3b4b42] text-white shadow-xs'
                  : 'text-[#526359] hover:bg-[#fbf9f4]'
              }`}
            >
              <span>Completed</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === 'completed' ? 'bg-[#23312a] text-white' : 'bg-[#eeebe2] text-[#4a574f]'
                }`}
              >
                {stats.completed}
              </span>
            </button>
          </div>

          {/* Event Cards List */}
          {filteredEvents.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 border border-[#e5e2d6] text-center shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#f4f2ea] text-[#6b7870] flex items-center justify-center mx-auto">
                <CalendarIcon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-[#19231e]">No scheduled events found</h3>
              <p className="text-xs text-[#738278] max-w-sm mx-auto">
                There are no commitments matching the selected status or date. Explore the campus catalog to register for upcoming sessions.
              </p>
              <button
                onClick={() => {
                  setActiveTab('all');
                  setSelectedDate(null);
                }}
                className="px-4 py-2 bg-[#112b20] hover:bg-[#1a4030] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Show All Schedule
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map((ev) => {
                const isOngoing = ev.status === 'ongoing';
                const isUpcoming = ev.status === 'upcoming';
                const isCompleted = ev.status === 'completed';

                return (
                  <div
                    key={ev.id}
                    className={`bg-white rounded-2xl p-5 sm:p-6 border transition-all shadow-[0_1px_3px_rgba(0,0,0,0.02)] ${
                      isOngoing
                        ? 'border-emerald-500/50 ring-1 ring-emerald-500/20'
                        : isUpcoming
                        ? 'border-[#e5e2d6] hover:border-[#dedbd0]'
                        : 'border-[#e5e2d6] opacity-95'
                    }`}
                  >
                    {/* Top Status & Category Row */}
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isOngoing && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                            LIVE NOW
                          </span>
                        )}

                        {isUpcoming && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#fef3f0] text-[#e65c36] border border-[#fbd4c8]">
                            <Clock className="w-3 h-3" /> Confirmed Booking
                          </span>
                        )}

                        {isCompleted && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Attended & Verified
                          </span>
                        )}

                        <span className="px-2.5 py-0.5 rounded bg-[#f4f2ea] text-[#2c3b31] text-[11px] font-medium">
                          {ev.category}
                        </span>
                      </div>

                      {/* Seat or Ticket Badge */}
                      <span className="text-[11px] font-mono text-[#738278]">
                        Pass: <strong className="text-[#19231e]">{ev.registrationId}</strong>
                      </span>
                    </div>

                    {/* Event Title & Organizer */}
                    <h3 className="font-extrabold text-base sm:text-lg text-[#19231e] tracking-tight">
                      {ev.title}
                    </h3>
                    <p className="text-xs text-[#526359] mt-0.5">
                      Hosted by <span className="font-semibold text-[#19231e]">{ev.organizer}</span>
                    </p>

                    {/* Time & Venue Information */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3.5 pt-3 border-t border-[#eeebe2] text-xs text-[#4a574f]">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#8ea79a] shrink-0" />
                        <span>
                          {ev.startDate} · {ev.timeRange}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#8ea79a] shrink-0" />
                        <span className="truncate">
                          {ev.location} ({ev.room})
                        </span>
                      </div>
                    </div>

                    {/* Ongoing Session Progress Bar */}
                    {isOngoing && ev.progressPercent && (
                      <div className="mt-3.5 pt-3 border-t border-[#eeebe2]">
                        <div className="flex items-center justify-between text-xs text-[#1f6b45] font-semibold mb-1">
                          <span>Session Progress</span>
                          <span>{ev.progressPercent}% elapsed</span>
                        </div>
                        <div className="w-full bg-[#e8f3ec] rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${ev.progressPercent}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Notes if available */}
                    {ev.notes && (
                      <p className="text-xs text-[#6b7870] mt-3 bg-[#fbf9f4] p-2.5 rounded-xl border border-[#eeebe2] leading-relaxed">
                        <span className="font-bold text-[#19231e]">Notice:</span> {ev.notes}
                      </p>
                    )}

                    {/* Action Buttons Row */}
                    <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-[#eeebe2] flex-wrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setTicketModalEvent(ev)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#112b20] hover:bg-[#1b4333] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5 text-[#d8fa57]" />
                          <span>View Digital Pass</span>
                        </button>

                        {isUpcoming && (
                          <button
                            onClick={() => handleCancelBooking(ev.id, ev.title)}
                            className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            Cancel Seat
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isCompleted && (
                          <>
                            {ev.rating ? (
                              <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-bold">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                <span>Rated {ev.rating}/5</span>
                              </span>
                            ) : (
                              <button
                                onClick={() => {
                                  setFeedbackModalEvent(ev);
                                  setUserRating(5);
                                  setFeedbackComment('');
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#fbf9f4] hover:bg-[#f4f2ea] text-[#19231e] border border-[#dcd9ce] rounded-lg text-xs font-bold transition-colors cursor-pointer"
                              >
                                <Star className="w-3.5 h-3.5 text-amber-500" />
                                <span>Leave Rating</span>
                              </button>
                            )}

                            {ev.hasCertificate && (
                              <button
                                onClick={() =>
                                  toast.success(`Generated official Certificate of Attendance for ${ev.title}!`)
                                }
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#eaf6ed] hover:bg-[#d9eedf] text-[#1c6b45] border border-[#cbe9d4] rounded-lg text-xs font-bold transition-colors cursor-pointer"
                              >
                                <Award className="w-3.5 h-3.5" />
                                <span>Certificate</span>
                              </button>
                            )}
                          </>
                        )}

                        <button
                          onClick={() => navigate(`/events/${ev.id}`)}
                          className="text-xs font-semibold text-[#e65c36] hover:underline cursor-pointer inline-flex items-center gap-1"
                        >
                          <span>Event details</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ================= DIGITAL TICKET / PASS MODAL ================= */}
      {ticketModalEvent && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md border border-[#dedbd4] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Ticket Header */}
            <div className="bg-[#112b20] text-white p-6 text-center relative">
              <button
                onClick={() => setTicketModalEvent(null)}
                className="absolute right-4 top-4 w-8 h-8 rounded-full bg-[#1b3d2f] hover:bg-[#25523f] text-[#c4d6cb] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 rounded-full bg-[#204a36] text-[#d8fa57] text-[10px] font-mono font-bold uppercase tracking-wider">
                Official Campus Admission Pass
              </span>
              <h3 className="font-extrabold text-xl text-white mt-3 tracking-tight">
                {ticketModalEvent.title}
              </h3>
              <p className="text-xs text-[#a6c1b3] mt-1">{ticketModalEvent.organizer}</p>
            </div>

            {/* Ticket Body with Cutouts */}
            <div className="p-6 space-y-4 text-left relative">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#738278] block">Date</span>
                  <span className="font-bold text-[#19231e]">{ticketModalEvent.startDate}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#738278] block">Time</span>
                  <span className="font-bold text-[#19231e]">{ticketModalEvent.timeRange}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#738278] block">Venue</span>
                  <span className="font-bold text-[#19231e]">{ticketModalEvent.location}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#738278] block">Assigned Seat</span>
                  <span className="font-bold text-[#e65c36]">
                    {ticketModalEvent.seatNumber || 'General Admission'}
                  </span>
                </div>
              </div>

              {/* Student Identification */}
              <div className="p-3 bg-[#fbf9f4] border border-[#eeebe2] rounded-xl text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#738278]">Attendee:</span>
                  <span className="font-bold text-[#19231e]">{user?.full_name || 'Aarav Rao'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#738278]">Student ID:</span>
                  <span className="font-mono text-[#19231e]">
                    {(user as any)?.student_id || 'STU-2026-0814'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#738278]">Pass ID:</span>
                  <span className="font-mono font-bold text-[#112b20]">
                    {ticketModalEvent.registrationId}
                  </span>
                </div>
              </div>

              {/* Simulated QR Code for badge scanner */}
              <div className="text-center py-2 border-t border-dashed border-[#dcd9ce] pt-4">
                <div className="w-36 h-36 bg-[#f4f2ea] border-2 border-[#112b20] rounded-2xl mx-auto flex flex-col items-center justify-center p-3">
                  <QrCode className="w-24 h-24 text-[#112b20]" />
                  <span className="text-[9px] font-mono text-[#526359] mt-1">SCAN AT ENTRANCE</span>
                </div>
                <p className="text-[11px] text-[#8fa095] mt-2">
                  Scan at hall kiosk or show to student coordinator for instant admission.
                </p>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => {
                    toast.success('Ticket downloaded as offline image pass.');
                    setTicketModalEvent(null);
                  }}
                  className="flex-1 py-2.5 bg-[#e65c36] hover:bg-[#d8522d] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs text-center"
                >
                  Save to Apple / Google Wallet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= FEEDBACK & RATING MODAL ================= */}
      {feedbackModalEvent && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md border border-[#dedbd4] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#112b20] text-white px-6 py-4 flex items-center justify-between border-b border-[#1b3d2f]">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-white">Event Feedback</h3>
              </div>
              <button
                onClick={() => setFeedbackModalEvent(null)}
                className="w-8 h-8 rounded-lg bg-[#1b3d2f] hover:bg-[#25523f] text-[#c4d6cb] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFeedback} className="p-6 space-y-4 text-left">
              <div>
                <h4 className="font-bold text-sm text-[#19231e]">{feedbackModalEvent.title}</h4>
                <p className="text-xs text-[#738278]">{feedbackModalEvent.organizer}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#19231e] mb-2 uppercase tracking-wider">
                  How was your experience?
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setUserRating(star)}
                      className="p-1 text-2xl transition-transform hover:scale-110 cursor-pointer"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= userRating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-[#dcd9ce]'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-xs font-bold text-[#19231e]">{userRating} / 5 Stars</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#19231e] mb-1 uppercase tracking-wider">
                  Review & Comments (Anonymous to Organizers)
                </label>
                <textarea
                  rows={3}
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="Share what you liked, mentor quality, or suggestions for the next edition..."
                  className="w-full bg-[#fbf9f4] border border-[#dcd9ce] rounded-xl px-3.5 py-2.5 text-xs text-[#19231e] focus:outline-none focus:ring-2 focus:ring-[#112b20]"
                ></textarea>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setFeedbackModalEvent(null)}
                  className="px-4 py-2 rounded-xl border border-[#dcd9ce] text-xs font-bold text-[#4a574f] hover:bg-[#fbf9f4] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#e65c36] hover:bg-[#d8522d] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
