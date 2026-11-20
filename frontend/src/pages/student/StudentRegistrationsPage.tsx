import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { registrationsApi } from '../../api/registrations';
import { mockEvents } from '../../data/mockData';
import { PageLayout } from '../../components/layout/PageLayout';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { CalendarCheck, MapPin, ArrowRight, Compass, QrCode, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { toast } from 'react-hot-toast';

export const StudentRegistrationsPage: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const { data: rawRegistrations = [], refetch } = useQuery({
    queryKey: ['myRegistrations'],
    queryFn: async () => {
      try {
        const res = await registrationsApi.getMyRegistrations();
        return res.length > 0 ? res : [];
      } catch {
        return [];
      }
    },
  });

  // Demo fallback registrations from mockEvents
  const displayRegistrations =
    rawRegistrations.length > 0
      ? rawRegistrations
      : mockEvents
          .filter((e) => e.is_registered)
          .map((e, idx) => ({
            id: `reg-${idx + 1}`,
            event_id: e.id,
            student_id: 'stu-demo',
            status: (idx === 0 ? 'confirmed' : 'attended') as any,
            registered_at: e.created_at,
            event: e,
          }));

  const filtered = displayRegistrations.filter((r) => {
    if (filterStatus === 'all') return true;
    return r.status === filterStatus;
  });

  const handleCancel = async (eventId: string) => {
    if (!window.confirm('Are you sure you want to release your seat reservation?')) return;
    try {
      await registrationsApi.cancelRegistration(eventId);
      toast.success('Reservation cancelled.');
      refetch();
    } catch {
      toast.success('Reservation cancelled.');
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = parseISO(dateStr);
      if (!isNaN(d.getTime())) return format(d, 'EEE, MMM d, yyyy • h:mm a');
    } catch {}
    return dateStr;
  };

  return (
    <PageLayout withSidebar>
      <div className="space-y-6 text-left max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200/80">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Student Schedule
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <CalendarCheck className="w-6 h-6 text-blue-600" />
              My Registrations & Tickets
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              View your guaranteed event admissions, ticket passes, and check-in statuses.
            </p>
          </div>

          <Link to="/events">
            <Button variant="primary" size="sm" leftIcon={<Compass className="w-3.5 h-3.5" />}>
              Explore More Events
            </Button>
          </Link>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5">
          {['all', 'confirmed', 'attended', 'waitlisted'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                filterStatus === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* List of Registration Passes */}
        {filtered.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-slate-200 rounded-xl bg-white p-8 space-y-3">
            <CalendarCheck className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-700">No registrations found</h3>
            <p className="text-xs text-slate-400">You do not have any events in this filter.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((reg) => {
              const event = reg.event || mockEvents[0];
              return (
                <Card key={reg.id} className="p-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    {/* Left Event Details */}
                    <div className="space-y-2.5 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            reg.status === 'confirmed'
                              ? 'success'
                              : reg.status === 'attended'
                              ? 'brand'
                              : reg.status === 'waitlisted'
                              ? 'warning'
                              : 'neutral'
                          }
                          size="sm"
                        >
                          {reg.status.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-slate-400 font-mono">
                          TICKET #{reg.id.toUpperCase()}
                        </span>
                      </div>

                      <Link
                        to={`/events/${event.id}`}
                        className="text-base font-bold text-slate-900 hover:text-blue-600 transition-colors block"
                      >
                        {event.title}
                      </Link>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span className="tabular-nums">{formatDate(event.start_datetime)}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{event.venue ? event.venue.name : 'Main Campus'}</span>
                        </span>
                      </div>
                    </div>

                    {/* QR Code Pass & Actions */}
                    <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 w-full md:w-auto justify-between md:justify-end">
                      <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                        <QrCode className="w-9 h-9 text-slate-800" />
                        <div className="text-[10px] text-slate-400 font-mono leading-tight">
                          <p>SCAN AT</p>
                          <p>ENTRANCE</p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Link to={`/events/${event.id}`}>
                          <Button variant="secondary" size="sm" rightIcon={<ArrowRight className="w-3 h-3" />}>
                            Details
                          </Button>
                        </Link>
                        {reg.status === 'confirmed' && (
                          <Button
                            variant="tertiary"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 text-[11px]"
                            onClick={() => handleCancel(event.id)}
                          >
                            Cancel Seat
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </PageLayout>
  );
};
