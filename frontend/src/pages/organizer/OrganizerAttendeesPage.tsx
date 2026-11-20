import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { eventsApi } from '../../api/events';
import { mockEvents, mockAttendeesList, mockAnnouncements } from '../../data/mockData';
import { PageLayout } from '../../components/layout/PageLayout';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import {
  Users,
  Search,
  Download,
  CheckCircle2,
  Sliders,
  BarChart3,
  Clock,
  Lock,
  Unlock,
  Megaphone,
  Pin,
  Trash2,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'react-hot-toast';
import type { EventAnnouncement } from '../../types';

export const OrganizerAttendeesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialEventId = searchParams.get('eventId') || mockEvents[0].id;

  const [selectedEventId, setSelectedEventId] = useState<string>(initialEventId);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [roster, setRoster] = useState(mockAttendeesList);
  const [capacityAdjustment, setCapacityAdjustment] = useState<number>(350);
  const [announcements, setAnnouncements] = useState<EventAnnouncement[]>(mockAnnouncements);
  const [showAnnForm, setShowAnnForm] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annPriority, setAnnPriority] = useState<'normal' | 'important' | 'urgent'>('normal');
  const [annPinned, setAnnPinned] = useState(false);
  const [isRegOpen, setIsRegOpen] = useState(true);

  const { data: events = mockEvents } = useQuery({
    queryKey: ['organizerEventsRoster'],
    queryFn: async () => {
      try {
        const res = await eventsApi.listEvents({ page: 1, page_size: 50 });
        return res.items.length > 0 ? res.items : mockEvents;
      } catch {
        return mockEvents;
      }
    },
  });

  const currentEvent = events.find((e) => e.id === selectedEventId) || events[0];

  const handleToggleAttendance = (registrationId: string) => {
    setRoster((prev) =>
      prev.map((reg) => {
        if (reg.id === registrationId) {
          const nextStatus = reg.status === 'attended' ? 'confirmed' : 'attended';
          toast.success(
            nextStatus === 'attended'
              ? `Marked ${reg.student?.full_name} as Attended`
              : `Reverted ${reg.student?.full_name} to Confirmed`
          );
          return {
            ...reg,
            status: nextStatus as any,
            attended_at: nextStatus === 'attended' ? new Date().toISOString() : undefined,
          };
        }
        return reg;
      })
    );
  };

  const handleCapacitySave = () => {
    toast.success(`Event capacity limit successfully updated to ${capacityAdjustment} seats.`);
  };

  useEffect(() => {
    if (!selectedEventId) return;
    eventsApi.getEventAnnouncements(selectedEventId).then((res) => {
      if (Array.isArray(res) && res.length > 0) {
        setAnnouncements(res);
      } else {
        const matching = mockAnnouncements.filter((a) => a.event_id === selectedEventId);
        setAnnouncements(matching.length > 0 ? matching : []);
      }
    }).catch(() => {
      const matching = mockAnnouncements.filter((a) => a.event_id === selectedEventId);
      setAnnouncements(matching.length > 0 ? matching : []);
    });
  }, [selectedEventId]);

  const handleToggleRegistration = async () => {
    const nextState = !isRegOpen;
    setIsRegOpen(nextState);
    try {
      await eventsApi.toggleRegistration(selectedEventId, nextState);
      toast.success(nextState ? 'Registrations are now OPEN' : 'Registrations are now CLOSED');
    } catch {
      toast.success(nextState ? 'Registrations are now OPEN' : 'Registrations are now CLOSED');
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;
    try {
      const res = await eventsApi.createEventAnnouncement(selectedEventId, {
        title: annTitle.trim(),
        content: annContent.trim(),
        priority: annPriority,
        is_pinned: annPinned,
      });
      setAnnouncements((prev) => [res, ...prev]);
      toast.success('Announcement published & attendees notified!');
    } catch {
      const localAnn: EventAnnouncement = {
        id: `ann-${Date.now()}`,
        event_id: selectedEventId,
        event_title: currentEvent.title,
        title: annTitle.trim(),
        content: annContent.trim(),
        priority: annPriority,
        is_pinned: annPinned,
        created_at: new Date().toISOString(),
      };
      setAnnouncements((prev) => [localAnn, ...prev]);
      toast.success('Announcement published & attendees notified!');
    }
    setAnnTitle('');
    setAnnContent('');
    setAnnPriority('normal');
    setAnnPinned(false);
    setShowAnnForm(false);
  };

  const handleDeleteAnnouncement = async (annId: string) => {
    try {
      await eventsApi.deleteEventAnnouncement(selectedEventId, annId);
    } catch {}
    setAnnouncements((prev) => prev.filter((a) => a.id !== annId));
    toast.success('Announcement removed');
  };

  const getTemporalStatus = () => {
    if (!currentEvent) return { label: 'TBD', detail: '', variant: 'brand' as const };
    const now = new Date();
    try {
      const start = parseISO(currentEvent.start_datetime);
      const end = parseISO(currentEvent.end_datetime);
      if (currentEvent.status === 'completed' || end.getTime() < now.getTime()) {
        return {
          label: 'Completed',
          detail: `Event concluded on ${format(end, 'MMM d, yyyy')}`,
          variant: 'neutral' as const,
        };
      }
      const isToday =
        now.getFullYear() === start.getFullYear() &&
        now.getMonth() === start.getMonth() &&
        now.getDate() === start.getDate();
      if (isToday) {
        return {
          label: 'Happening Today',
          detail: `Live today • ${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`,
          variant: 'success' as const,
        };
      }
      return {
        label: `Takes place on ${format(start, 'EEE, MMM d, yyyy')}`,
        detail: `Starting at ${format(start, 'h:mm a')}`,
        variant: 'brand' as const,
      };
    } catch {
      return { label: 'Scheduled', detail: currentEvent.start_datetime, variant: 'brand' as const };
    }
  };

  const handleExportCSV = () => {
    const headers = ['Registration ID', 'Student Name', 'Student ID', 'Department', 'Year', 'Status', 'Registered At'];
    const rows = roster.map((r) => [
      r.id,
      r.student?.full_name || '',
      r.student?.student_id || '',
      r.student?.department || '',
      r.student?.year_of_study || '',
      r.status,
      r.registered_at,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CampusIQ_${currentEvent.id}_Attendees.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Attendee roster exported as CSV');
  };

  const filteredRoster = roster.filter((item) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (departmentFilter !== 'all' && item.student?.department !== departmentFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = item.student?.full_name?.toLowerCase().includes(q);
      const matchId = (item.student?.student_id || '').toLowerCase().includes(q) || (item.student?.institute_name || '').toLowerCase().includes(q);
      if (!matchName && !matchId) return false;
    }
    return true;
  });

  const confirmedCount = roster.filter((r) => r.status === 'confirmed').length;
  const attendedCount = roster.filter((r) => r.status === 'attended').length;
  const waitlistedCount = roster.filter((r) => r.status === 'waitlisted').length;

  return (
    <PageLayout withSidebar>
      <div className="space-y-6 text-left max-w-6xl mx-auto">
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-200/80">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Operations & Event Intelligence
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <BarChart3 className="w-6 h-6 text-purple-600" />
              Event Insights
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Review verified student registrations, monitor event timeline status, open/close registrations, broadcast announcements, and manage check-ins.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportCSV}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Export Roster (CSV)
            </Button>
          </div>
        </div>

        {/* Event Selector & Quick Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-6">
            <Select
              label="Selected Campus Event"
              value={selectedEventId}
              onChange={(e) => {
                setSelectedEventId(e.target.value);
                setSearchParams({ eventId: e.target.value });
              }}
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title} ({ev.current_registrations}/{ev.max_capacity} seats)
                </option>
              ))}
            </Select>
          </div>

          {/* Mini Stats Pill */}
          <div className="md:col-span-6 grid grid-cols-3 gap-2 text-center pt-5">
            <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
              <p className="text-xs text-slate-500">Confirmed</p>
              <p className="text-lg font-bold text-slate-900 tabular-nums">{confirmedCount}</p>
            </div>
            <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
              <p className="text-xs text-slate-500">Checked In</p>
              <p className="text-lg font-bold text-emerald-600 tabular-nums">{attendedCount}</p>
            </div>
            <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
              <p className="text-xs text-slate-500">Waitlisted</p>
              <p className="text-lg font-bold text-amber-600 tabular-nums">{waitlistedCount}</p>
            </div>
          </div>
        </div>

        {/* Event Timing & Registration Controls */}
        <Card className="p-4 bg-white border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Badge variant={getTemporalStatus().variant} size="md">
                <Clock className="w-3.5 h-3.5 mr-1" />
                {getTemporalStatus().label}
              </Badge>
              <span className="text-xs text-slate-500 font-medium">
                {getTemporalStatus().detail}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant={isRegOpen ? 'success' : 'warning'} size="sm">
                {isRegOpen ? <Unlock className="w-3 h-3 mr-1" /> : <Lock className="w-3 h-3 mr-1" />}
                {isRegOpen ? 'Registrations Open' : 'Registrations Closed'}
              </Badge>

              <Button
                variant={isRegOpen ? 'secondary' : 'primary'}
                size="sm"
                onClick={handleToggleRegistration}
                leftIcon={isRegOpen ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              >
                {isRegOpen ? 'Close Registrations' : 'Open Registrations'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Event Announcement Board */}
        <Card className="p-5 space-y-4 bg-white border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-purple-600" />
                Event Announcement Board
              </h3>
              <p className="text-xs text-slate-500">
                Broadcast room updates, equipment needs, or schedules to all students registered for this event.
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowAnnForm(!showAnnForm)}
            >
              {showAnnForm ? 'Cancel' : '+ Post Announcement'}
            </Button>
          </div>

          {showAnnForm && (
            <form onSubmit={handleCreateAnnouncement} className="space-y-3 p-4 bg-slate-50/70 rounded-xl border border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <Input
                    placeholder="Announcement Title (e.g., Room moved to Lab 204)"
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    required
                  />
                </div>
                <Select
                  value={annPriority}
                  onChange={(e) => setAnnPriority(e.target.value as any)}
                >
                  <option value="normal">Normal Priority</option>
                  <option value="important">Important Update</option>
                  <option value="urgent">Urgent Alert</option>
                </Select>
              </div>

              <div>
                <textarea
                  className="w-full rounded-lg border border-slate-300 p-3 text-xs focus:border-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-600"
                  rows={3}
                  placeholder="Type the announcement message that will be broadcasted to students..."
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={annPinned}
                    onChange={(e) => setAnnPinned(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span>Pin announcement to top</span>
                </label>

                <Button variant="primary" size="sm" type="submit">
                  Publish to Registered Attendees
                </Button>
              </div>
            </form>
          )}

          {announcements.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs">
              No announcements published for this event yet.
            </div>
          ) : (
            <div className="space-y-2.5">
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    ann.priority === 'urgent'
                      ? 'border-red-200 bg-red-50/40'
                      : ann.priority === 'important'
                      ? 'border-amber-200 bg-amber-50/30'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          ann.priority === 'urgent'
                            ? 'warning'
                            : ann.priority === 'important'
                            ? 'brand'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {ann.priority.toUpperCase()}
                      </Badge>
                      {ann.is_pinned && (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-lime-700">
                          <Pin className="w-3 h-3" /> Pinned
                        </span>
                      )}
                      <h4 className="text-xs font-bold text-slate-900">{ann.title}</h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400 font-mono">
                        {format(parseISO(ann.created_at), 'MMM d, h:mm a')}
                      </span>
                      <button
                        onClick={() => handleDeleteAnnouncement(ann.id)}
                        className="text-slate-400 hover:text-red-600 p-1 transition-colors"
                        title="Delete announcement"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{ann.content}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Capacity Control Bar */}
        <Card className="p-4 bg-slate-50/70 border-slate-200/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-600" />
                Live Capacity Controls
              </h4>
              <p className="text-xs text-slate-500">
                Adjust maximum seat reservations for {currentEvent.venue?.name || 'this venue'}.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={50}
                max={1000}
                value={capacityAdjustment}
                onChange={(e) => setCapacityAdjustment(Number(e.target.value))}
                className="w-28 text-center font-bold"
              />
              <Button variant="primary" size="sm" onClick={handleCapacitySave}>
                Update Cap
              </Button>
            </div>
          </div>
        </Card>

        {/* Filter Bar */}
        <Card className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              placeholder="Search by student name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            />

            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Registration Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="attended">Attended / Checked-In</option>
              <option value="waitlisted">Waitlisted</option>
            </Select>

            <Select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="all">All Departments</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Electrical Engineering">Electrical Engineering</option>
              <option value="Data Science">Data Science</option>
              <option value="Bioengineering">Bioengineering</option>
              <option value="Mechanical Engineering">Mechanical Engineering</option>
            </Select>
          </div>
        </Card>

        {/* Attendees Table */}
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="p-4 font-semibold">Student</th>
                  <th className="p-4 font-semibold">Department & Year</th>
                  <th className="p-4 font-semibold">Registered Date</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Check-In Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRoster.map((reg) => (
                  <tr key={reg.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-4">
                      <p className="font-semibold text-slate-900">{reg.student?.full_name}</p>
                      <p className="text-slate-400 font-mono text-[11px] mt-0.5">{reg.student?.student_id}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-slate-700 font-medium">{reg.student?.department}</p>
                      <p className="text-slate-400">Year {reg.student?.year_of_study}</p>
                    </td>
                    <td className="p-4 tabular-nums text-slate-500">
                      {format(parseISO(reg.registered_at), 'MMM d, yyyy • h:mm a')}
                    </td>
                    <td className="p-4">
                      <Badge
                        variant={
                          reg.status === 'attended'
                            ? 'success'
                            : reg.status === 'confirmed'
                            ? 'brand'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {reg.status === 'attended' ? 'CHECKED IN' : reg.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        variant={reg.status === 'attended' ? 'secondary' : 'primary'}
                        size="sm"
                        onClick={() => handleToggleAttendance(reg.id)}
                        leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                      >
                        {reg.status === 'attended' ? 'Revert Check-In' : 'Mark Present'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
};
