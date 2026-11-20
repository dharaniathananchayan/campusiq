import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { eventsApi } from '../../api/events';
import { mockEvents } from '../../data/mockData';
import { PageLayout } from '../../components/layout/PageLayout';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Calendar, PlusCircle, Search, Users, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';

export const OrganizerEventsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: rawEvents = [] } = useQuery({
    queryKey: ['organizerEventsCatalog'],
    queryFn: async () => {
      try {
        const res = await eventsApi.listEvents({ page_size: 50 });
        return res.items.length > 0 ? res.items : mockEvents;
      } catch {
        return mockEvents;
      }
    },
    placeholderData: mockEvents,
  });

  const events = rawEvents.length > 0 ? rawEvents : mockEvents;

  const filteredEvents = events.filter((ev) => {
    if (statusFilter !== 'all' && ev.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = ev.title.toLowerCase().includes(q);
      const matchDesc = (ev.short_description || ev.description).toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }
    return true;
  });

  const formatDate = (dateStr: string) => {
    try {
      const d = parseISO(dateStr);
      if (!isNaN(d.getTime())) return format(d, 'EEE, MMM d, yyyy • h:mm a');
    } catch {}
    return dateStr;
  };

  return (
    <PageLayout withSidebar>
      <div className="space-y-6 text-left max-w-6xl mx-auto">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200/80">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Event Management
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Calendar className="w-6 h-6 text-purple-600" />
              Managed Event Directory
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Overview of your hosted campus sessions, registration counts, venue allocations, and attendee rosters.
            </p>
          </div>

          <Link to="/organizer/events/new">
            <Button variant="primary" size="sm" leftIcon={<PlusCircle className="w-3.5 h-3.5" />}>
              Create New Event
            </Button>
          </Link>
        </div>

        {/* Filter and Search Bar */}
        <Card className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="w-full sm:w-80">
              <Input
                placeholder="Filter events by title or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4 text-slate-400" />}
              />
            </div>

            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              {['all', 'published', 'draft'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                    statusFilter === st
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Event List */}
        {filteredEvents.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-slate-200 rounded-xl bg-white p-8 space-y-3">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-700">No events found</h3>
            <p className="text-xs text-slate-400">Try modifying your search or create a new event draft.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map((evt) => {
              const current = evt.current_registrations || 0;
              const max = evt.max_capacity || 100;
              const fillRate = Math.min(100, Math.round((current / max) * 100));

              return (
                <Card key={evt.id} className="p-5 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            evt.status === 'published'
                              ? 'success'
                              : evt.status === 'draft'
                              ? 'warning'
                              : 'neutral'
                          }
                          size="sm"
                        >
                          {evt.status.toUpperCase()}
                        </Badge>
                        {evt.category && (
                          <span className="text-xs text-slate-400">• {evt.category.name}</span>
                        )}
                      </div>

                      <Link
                        to={`/organizer/events/${evt.id}`}
                        className="text-base font-bold text-slate-900 hover:text-blue-600 transition-colors block"
                      >
                        {evt.title}
                      </Link>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1 text-slate-700 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span className="tabular-nums">{formatDate(evt.start_datetime)}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{evt.venue ? `${evt.venue.name} (${evt.venue.building})` : 'TBA'}</span>
                        </span>
                      </div>
                    </div>

                    {/* Capacity and Actions */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-5">
                      <div className="space-y-1 w-36">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Capacity</span>
                          <span className="font-semibold text-slate-800 tabular-nums">
                            {current}/{max} ({fillRate}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              fillRate >= 95 ? 'bg-emerald-600' : 'bg-blue-600'
                            }`}
                            style={{ width: `${fillRate}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link to={`/organizer/attendees?eventId=${evt.id}`}>
                          <Button variant="secondary" size="sm" leftIcon={<Users className="w-3 h-3" />}>
                            Roster
                          </Button>
                        </Link>
                        <Link to={`/organizer/events/${evt.id}`}>
                          <Button variant="primary" size="sm">
                            Manage
                          </Button>
                        </Link>
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
