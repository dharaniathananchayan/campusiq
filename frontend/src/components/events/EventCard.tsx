import React from 'react';
import { Link } from 'react-router-dom';
import { Event } from '../../types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Calendar, MapPin, Bookmark, ArrowRight, Users } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface EventCardProps {
  event: Event;
  onBookmarkToggle?: (eventId: string, isBookmarked: boolean) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onBookmarkToggle }) => {
  const current = event.current_registrations || 0;
  const max = event.max_capacity || 100;
  const isFull = current >= max;
  const percentage = Math.min(100, Math.round((current / max) * 100));

  const formatEventDate = (dateStr: string) => {
    try {
      const d = parseISO(dateStr);
      if (!isNaN(d.getTime())) {
        return format(d, 'EEE, MMM d • h:mm a');
      }
    } catch {
      // fallback
    }
    return dateStr;
  };

  return (
    <Card hoverable className="flex flex-col justify-between h-full p-5 space-y-4">
      <div className="space-y-3">
        {/* Header row: category + seat status */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {event.category && (
              <Badge variant="neutral" size="sm">
                {event.category.name}
              </Badge>
            )}
            {event.is_featured && (
              <Badge variant="brand" size="sm">
                Featured
              </Badge>
            )}
          </div>
          <span
            className={`text-[11px] font-medium tabular-nums ${
              isFull ? 'text-red-600 font-semibold' : event.available_seats <= 10 ? 'text-amber-700 font-semibold' : 'text-slate-500'
            }`}
          >
            {isFull ? 'At Capacity' : `${event.available_seats} seats left`}
          </span>
        </div>

        {/* Title & Bookmark */}
        <div className="flex items-start justify-between gap-3">
          <Link
            to={`/events/${event.id}`}
            className="text-sm sm:text-base font-semibold text-slate-900 hover:text-blue-600 transition-colors line-clamp-2 leading-snug"
          >
            {event.title}
          </Link>
          {onBookmarkToggle && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onBookmarkToggle(event.id, !!event.is_bookmarked);
              }}
              className={`p-1.5 rounded-md transition-colors shrink-0 ${
                event.is_bookmarked
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              }`}
              title={event.is_bookmarked ? 'Remove Bookmark' : 'Save Event'}
            >
              <Bookmark className={`w-4 h-4 ${event.is_bookmarked ? 'fill-blue-600' : ''}`} />
            </button>
          )}
        </div>

        {/* Short description */}
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
          {event.short_description || event.description}
        </p>
      </div>

      {/* Date, Location, and Capacity */}
      <div className="space-y-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-slate-700 font-medium">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="tabular-nums">{formatEventDate(event.start_datetime)}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              {event.venue ? `${event.venue.name} • ${event.venue.building}` : 'Campus Venue TBA'}
            </span>
          </div>
        </div>

        {/* Capacity Progress Bar */}
        <div className="space-y-1 pt-1">
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-500 flex items-center gap-1">
              <Users className="w-3 h-3 text-slate-400" />
              Utilization
            </span>
            <span className="tabular-nums text-slate-700 font-medium">
              {current} / {max} <span className="text-slate-400">({percentage}%)</span>
            </span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isFull ? 'bg-red-500' : percentage >= 85 ? 'bg-amber-500' : 'bg-slate-900'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Footer info & action */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <span className="text-[11px] text-slate-400 truncate max-w-[150px]">
            {event.organizer?.organization_name || 'Academic Committee'}
          </span>
          <Link to={`/events/${event.id}`}>
            <Button variant="secondary" size="sm" rightIcon={<ArrowRight className="w-3 h-3" />}>
              Details
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
};
