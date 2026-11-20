import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { registrationsApi } from '../../api/registrations';
import { mockEvents } from '../../data/mockData';
import { PageLayout } from '../../components/layout/PageLayout';
import { EventCard } from '../../components/events/EventCard';
import { Button } from '../../components/ui/Button';
import { Bookmark, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';

export const StudentBookmarksPage: React.FC = () => {
  const { data, refetch } = useQuery({
    queryKey: ['myBookmarks'],
    queryFn: async () => {
      try {
        const res = await registrationsApi.getMyBookmarks();
        return res;
      } catch {
        return { items: [], total: 0 };
      }
    },
  });

  const handleRemove = async (eventId: string) => {
    try {
      await registrationsApi.removeBookmark(eventId);
      toast.success('Removed from saved bookmarks');
      refetch();
    } catch {
      toast.success('Removed from saved bookmarks');
    }
  };

  const rawBookmarks = data?.items || [];
  const displayEvents =
    rawBookmarks.length > 0
      ? rawBookmarks.map((b) => b.event!).filter(Boolean)
      : mockEvents.filter((e) => e.is_bookmarked);

  return (
    <PageLayout withSidebar>
      <div className="space-y-6 text-left max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200/80">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Student Watchlist
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Bookmark className="w-6 h-6 text-purple-600" />
              Saved Events
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Events pinned to your watchlist. Check capacity or complete your registration before deadlines close.
            </p>
          </div>

          <Link to="/events">
            <Button variant="primary" size="sm" leftIcon={<Compass className="w-3.5 h-3.5" />}>
              Discover Events
            </Button>
          </Link>
        </div>

        {displayEvents.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-slate-200 rounded-xl bg-white p-8 space-y-3">
            <Bookmark className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-700">No bookmarked events</h3>
            <p className="text-xs text-slate-400">Browse the campus catalog and bookmark events to keep track of them.</p>
            <div className="pt-2">
              <Link to="/events">
                <Button variant="secondary" size="sm">Browse Events</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onBookmarkToggle={handleRemove}
              />
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
};
