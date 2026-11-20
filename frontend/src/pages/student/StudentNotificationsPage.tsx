import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { registrationsApi } from '../../api/registrations';
import { PageLayout } from '../../components/layout/PageLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Bell, CheckCheck } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

export const StudentNotificationsPage: React.FC = () => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['myNotifications'],
    queryFn: () => registrationsApi.getNotifications(),
  });

  const handleMarkAllRead = async () => {
    try {
      await registrationsApi.markAllNotificationsRead();
      toast.success('All notifications marked as read.');
      refetch();
    } catch {
      toast.error('Failed to mark notifications read.');
    }
  };

  const notifications = data?.items || [];

  return (
    <PageLayout withSidebar>
      <div className="space-y-8 text-left">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#DFE0E2]">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-[10px] font-extrabold uppercase tracking-widest text-[#75AABB]">
              <span>STUDENT COMMUNICATIONS</span>
              <span>•</span>
              <span className="text-[#071013] font-bold">ACTIVITY LOG</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#071013] flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#21B3D2]/10 text-[#21B3D2] flex items-center justify-center border border-[#21B3D2]/20 shrink-0">
                <Bell className="w-6 h-6 stroke-[2]" />
              </div>
              Notifications & Alerts
            </h1>
            <p className="text-sm font-medium text-[#071013]/60 max-w-2xl leading-relaxed">
              Real-time updates on registration confirmations, schedule modifications, venue allocations, and invitations.
            </p>
          </div>

          {notifications.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              leftIcon={<CheckCheck className="w-4 h-4 text-[#21B3D2]" />}
            >
              Mark All As Read
            </Button>
          )}
        </div>

        {isLoading ? (
          <LoadingSpinner text="Fetching notifications..." />
        ) : notifications.length === 0 ? (
          <Card className="py-16 text-center border-dashed border-[#DFE0E2] bg-white">
            <Bell className="w-8 h-8 text-[#A2ADBB] mx-auto mb-3 opacity-60" />
            <h3 className="text-sm font-bold text-[#071013]">Your inbox is clear</h3>
            <p className="text-xs text-[#071013]/60 mt-1 max-w-sm mx-auto leading-relaxed">
              No new notifications right now. Any schedule changes or RSVP confirmations will appear here immediately.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <Card
                key={n.id}
                className={`p-5 transition-all ${
                  !n.is_read
                    ? 'border-l-4 border-l-[#21B3D2] bg-[#21B3D2]/5 border-[#DFE0E2]'
                    : 'bg-white border-[#DFE0E2]'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-[#071013] tracking-tight">{n.title}</h4>
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-[#21B3D2] inline-block" />
                      )}
                    </div>
                    <p className="text-xs text-[#071013]/70 leading-relaxed font-medium">{n.message}</p>
                    <span className="text-[10px] text-[#A2ADBB] pt-1 block tabular-nums font-semibold">
                      {format(new Date(n.created_at), 'EEEE, MMMM d, yyyy • h:mm a')}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
};
