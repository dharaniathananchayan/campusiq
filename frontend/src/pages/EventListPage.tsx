import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { eventsApi } from '../api/events';
import { registrationsApi } from '../api/registrations';
import { mockEvents, mockCategories } from '../data/mockData';
import { PageLayout } from '../components/layout/PageLayout';
import { EventCard } from '../components/events/EventCard';
import { EventFilters } from '../components/events/EventFilters';
import { Skeleton } from '../components/ui/Skeleton';
import { Button } from '../components/ui/Button';
import { Compass, CalendarX } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const EventListPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedDateFilter, setSelectedDateFilter] = useState('');
  const [seatsAvailableOnly, setSeatsAvailableOnly] = useState(false);

  // Categories query with mock fallback
  const { data: categories = mockCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const res = await eventsApi.listCategories();
        return res.length > 0 ? res : mockCategories;
      } catch {
        return mockCategories;
      }
    },
  });

  // Events query with mock fallback
  const { data: rawEvents, isLoading, refetch } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      try {
        const res = await eventsApi.listEvents({ page: 1, page_size: 50 });
        return res.items && res.items.length > 0 ? res.items : mockEvents;
      } catch {
        return mockEvents;
      }
    },
    placeholderData: mockEvents,
  });

  const allEvents = rawEvents || mockEvents;

  // Filter pipeline
  const filteredEvents = useMemo(() => {
    return allEvents.filter((ev) => {
      // 1. Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = ev.title.toLowerCase().includes(q);
        const matchesDesc = (ev.short_description || ev.description).toLowerCase().includes(q);
        const matchesTags = ev.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesTags) return false;
      }

      // 2. Category filter
      if (selectedCategory && ev.category?.id !== selectedCategory && ev.category?.name !== selectedCategory) {
        return false;
      }

      // 3. Department filter
      if (selectedDepartment) {
        const depts = ev.eligibility_criteria?.departments || [];
        const matchesDept =
          depts.includes('All Departments') ||
          depts.includes('Open to All Campus') ||
          depts.some((d) => d.toLowerCase().includes(selectedDepartment.toLowerCase()));
        if (!matchesDept) return false;
      }

      // 4. Seats available only
      if (seatsAvailableOnly) {
        if ((ev.available_seats || 0) <= 0) return false;
      }

      // 5. Date filter
      if (selectedDateFilter) {
        const eventDate = new Date(ev.start_datetime);
        const now = new Date();
        if (selectedDateFilter === 'today') {
          if (eventDate.toDateString() !== now.toDateString()) return false;
        } else if (selectedDateFilter === 'this_week') {
          const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          if (eventDate < now || eventDate > sevenDays) return false;
        } else if (selectedDateFilter === 'this_month') {
          const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          if (eventDate < now || eventDate > thirtyDays) return false;
        }
      }

      return true;
    });
  }, [allEvents, searchQuery, selectedCategory, selectedDepartment, selectedDateFilter, seatsAvailableOnly]);

  const handleBookmarkToggle = async (eventId: string, isBookmarked: boolean) => {
    try {
      if (isBookmarked) {
        await registrationsApi.removeBookmark(eventId);
        toast.success('Removed from saved events');
      } else {
        await registrationsApi.addBookmark(eventId);
        toast.success('Event bookmarked to your student schedule');
      }
      refetch();
    } catch {
      // Demo fallback
      toast.success(isBookmarked ? 'Removed from saved events' : 'Event bookmarked to your schedule');
    }
  };

  const handleReset = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedDepartment('');
    setSelectedDateFilter('');
    setSeatsAvailableOnly(false);
  };

  return (
    <PageLayout>
      <div className="space-y-6 text-left max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200/80">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Campus Calendar & Directory
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Compass className="w-6 h-6 text-blue-600" />
              Discover Events
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Search symposia, guest lectures, hackathons, and departmental showcases with real-time seat availability.
            </p>
          </div>

          <div className="text-xs font-medium text-slate-500 tabular-nums bg-white px-3 py-1.5 rounded-lg border border-slate-200">
            Showing <strong className="text-slate-900">{filteredEvents.length}</strong> of {allEvents.length} events
          </div>
        </div>

        {/* Filter Bar */}
        <EventFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedDepartment={selectedDepartment}
          onDepartmentChange={setSelectedDepartment}
          selectedDateFilter={selectedDateFilter}
          onDateFilterChange={setSelectedDateFilter}
          seatsAvailableOnly={seatsAvailableOnly}
          onSeatsAvailableToggle={setSeatsAvailableOnly}
          categories={categories}
          onReset={handleReset}
        />

        {/* Event Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="p-5 bg-white border border-slate-200 rounded-xl space-y-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-12 w-full" />
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-slate-200 rounded-xl bg-white p-8 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <CalendarX className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">No matching campus events found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              We couldn't find any events matching your current filters. Try changing your search keywords or resetting filters.
            </p>
            <div className="pt-2">
              <Button variant="secondary" size="sm" onClick={handleReset}>
                Reset All Filters
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onBookmarkToggle={handleBookmarkToggle}
              />
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
};
