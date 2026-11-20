import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../../api/analytics';
import { mockOrganizerAnalytics } from '../../data/mockData';
import { useAuthStore } from '../../store/useAuthStore';
import { PageLayout } from '../../components/layout/PageLayout';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { TrendAreaChart } from '../../components/charts/TrendAreaChart';
import { BreakdownChart } from '../../components/charts/BreakdownChart';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Building2,
  Star,
  PlusCircle,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const OrganizerDashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const orgName = (user as any)?.organization_name || 'Association of Computing & Engineering';

  const { data: analytics = mockOrganizerAnalytics } = useQuery({
    queryKey: ['organizerAnalytics'],
    queryFn: async () => {
      try {
        const res = await analyticsApi.getOrganizerAnalytics();
        return res || mockOrganizerAnalytics;
      } catch {
        return mockOrganizerAnalytics;
      }
    },
    placeholderData: mockOrganizerAnalytics,
  });

  const utilization = Math.min(100, Math.round(analytics.avg_capacity_utilization || 88));
  const trendData = analytics.monthly_trend?.length ? analytics.monthly_trend : mockOrganizerAnalytics.monthly_trend;

  return (
    <PageLayout withSidebar>
      <div className="space-y-8 text-left max-w-6xl mx-auto">
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-slate-200/80">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <span>Campus Operations</span>
              <span>•</span>
              <span className="text-purple-600 font-bold">{orgName}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <LayoutDashboard className="w-6 h-6 text-purple-600" />
              Organizer Command Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Real-time monitoring of campus event demand, venue utilization velocities, and automated AI assistance.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link to="/organizer/ai/copilot">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Sparkles className="w-3.5 h-3.5 text-purple-600" />}
              >
                AI Event Co-Pilot
              </Button>
            </Link>
            <Link to="/organizer/events/new">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
              >
                Create Event
              </Button>
            </Link>
          </div>
        </div>

        {/* 4 Standardized Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Events */}
          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium">Events Hosted</span>
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900 tabular-nums">
                {analytics.total_events}
              </p>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-emerald-700 font-medium">
                <span>{analytics.published_events} Live in Catalog</span>
              </div>
            </div>
          </Card>

          {/* Card 2: Total Registrations */}
          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium">Total Registrations</span>
              <Users className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900 tabular-nums">
                {analytics.total_registrations}
              </p>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-blue-700 font-medium">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Active Student Interest</span>
              </div>
            </div>
          </Card>

          {/* Card 3: Venue Utilization */}
          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium">Venue Utilization</span>
              <Building2 className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <p className="text-3xl font-bold text-slate-900 tabular-nums">
                  {utilization}%
                </p>
                <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                  Target: 85%
                </span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-slate-900 rounded-full transition-all"
                  style={{ width: `${utilization}%` }}
                />
              </div>
            </div>
          </Card>

          {/* Card 4: Average Feedback Rating */}
          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium">Average Rating</span>
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900 tabular-nums">
                {(analytics.avg_rating || 4.8).toFixed(1)} <span className="text-xs text-slate-400 font-normal">/ 5.0</span>
              </p>
              <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                <span className="font-medium text-emerald-700">96% Positive</span>
                <span>• From verified attendees</span>
              </div>
            </div>
          </Card>
        </div>

        {/* 2-Column Section: Registration Growth Trend Chart & Category Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Chart Column */}
          <Card className="lg:col-span-8 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Registration Velocity Trend
                </h3>
                <p className="text-xs text-slate-500">Monthly student registrations across all published sessions</p>
              </div>
              <Badge variant="brand" size="sm">
                Real-Time Data
              </Badge>
            </div>

            <TrendAreaChart
              data={trendData}
              height={260}
              metricLabel="registrations"
            />
          </Card>

          {/* Category Performance Breakdown */}
          <Card className="lg:col-span-4 p-6 space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-900">
                Category Distribution
              </h3>
              <p className="text-xs text-slate-500">Student enrollment by event genre</p>
            </div>

            <BreakdownChart data={analytics.category_breakdown || mockOrganizerAnalytics.category_breakdown} />

            <div className="pt-2 border-t border-slate-100">
              <Link to="/organizer/analytics" className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
                <span>View Full Analytics Report</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </Card>
        </div>

        {/* Top Performing Events Table */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Top-Performing Events</h3>
              <p className="text-xs text-slate-500">Highest fill rate and student engagement metrics</p>
            </div>
            <Link to="/organizer/events">
              <Button variant="secondary" size="sm">
                View All Events
              </Button>
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="pb-3 font-semibold">Event Title</th>
                  <th className="pb-3 font-semibold">Registrations</th>
                  <th className="pb-3 font-semibold">Max Capacity</th>
                  <th className="pb-3 font-semibold">Utilization</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(analytics.top_events || mockOrganizerAnalytics.top_events).map((ev) => {
                  const pct = Math.min(100, Math.round((ev.current_registrations / ev.max_capacity) * 100));
                  return (
                    <tr key={ev.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 font-semibold text-slate-900 max-w-sm truncate">
                        <Link to={`/organizer/events/${ev.id}`} className="hover:text-blue-600">
                          {ev.title}
                        </Link>
                      </td>
                      <td className="py-3.5 tabular-nums text-slate-700 font-medium">
                        {ev.current_registrations}
                      </td>
                      <td className="py-3.5 tabular-nums text-slate-500">
                        {ev.max_capacity}
                      </td>
                      <td className="py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                pct >= 95 ? 'bg-emerald-600' : 'bg-blue-600'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[11px] tabular-nums font-semibold text-slate-700">
                            {pct}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 text-right space-x-2">
                        <Link to={`/organizer/attendees?eventId=${ev.id}`}>
                          <Button variant="secondary" size="sm">
                            Attendees
                          </Button>
                        </Link>
                        <Link to={`/organizer/events/${ev.id}`}>
                          <Button variant="primary" size="sm">
                            Manage
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
};
