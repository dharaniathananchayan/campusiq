import React from 'react';
import { LiveAnalytics } from '../../types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { Users, TrendingUp, Zap, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface LiveAnalyticsCardProps {
  analytics: LiveAnalytics;
}

export const LiveAnalyticsCard: React.FC<LiveAnalyticsCardProps> = ({ analytics }) => {
  const chartData = analytics.hourly_trend.map((pt) => ({
    time: format(new Date(pt.timestamp), 'HH:mm'),
    registrations: pt.value,
  }));

  return (
    <Card className="space-y-6 p-6 border-[#DFE0E2] bg-white">
      {/* Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#DFE0E2]">
        <div className="space-y-0.5">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#75AABB] flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[#21B3D2] stroke-[2.5]" />
            LIVE TELEMETRY & VELOCITY
          </span>
          <h3 className="text-xl font-bold text-[#071013] tracking-tight">
            {analytics.event_title}
          </h3>
        </div>
        <Badge variant={analytics.status === 'open' ? 'success' : 'warning'}>
          {analytics.status.toUpperCase()}
        </Badge>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#FAFAFB] border border-[#DFE0E2]">
          <div className="flex items-center gap-2 text-[#A2ADBB] text-xs font-bold uppercase tracking-wider">
            <Users className="w-4 h-4 text-[#21B3D2] stroke-[2]" />
            Registrations
          </div>
          <p className="text-2xl font-black text-[#071013] mt-1.5 tabular-nums">
            {analytics.current_registrations}
            <span className="text-xs font-normal text-[#071013]/50 ml-1">/ {analytics.max_capacity}</span>
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#FAFAFB] border border-[#DFE0E2]">
          <div className="flex items-center gap-2 text-[#A2ADBB] text-xs font-bold uppercase tracking-wider">
            <TrendingUp className="w-4 h-4 text-emerald-600 stroke-[2]" />
            Utilization
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-1.5 tabular-nums">
            {Math.round(analytics.capacity_utilization)}%
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#FAFAFB] border border-[#DFE0E2]">
          <div className="flex items-center gap-2 text-[#A2ADBB] text-xs font-bold uppercase tracking-wider">
            <Clock className="w-4 h-4 text-[#75AABB] stroke-[2]" />
            Available Seats
          </div>
          <p className="text-2xl font-black text-[#071013] mt-1.5 tabular-nums">
            {analytics.available_seats}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#FAFAFB] border border-[#DFE0E2]">
          <div className="flex items-center gap-2 text-[#A2ADBB] text-xs font-bold uppercase tracking-wider">
            <Zap className="w-4 h-4 text-[#21B3D2] stroke-[2]" />
            Registration Rate
          </div>
          <p className="text-2xl font-black text-[#21B3D2] mt-1.5 tabular-nums">
            {analytics.registration_rate} <span className="text-xs font-medium text-[#071013]/60">/ hr</span>
          </p>
        </div>
      </div>

      {/* Hourly Trend Area Chart */}
      <div className="pt-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#75AABB] mb-3">
          24-Hour Registration Velocity
        </h4>
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="liveVelocityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#21B3D2" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#21B3D2" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="#A2ADBB" fontSize={10} tickLine={false} axisLine={{ stroke: '#DFE0E2' }} />
              <YAxis stroke="#A2ADBB" fontSize={10} tickLine={false} axisLine={{ stroke: '#DFE0E2' }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#DFE0E2',
                  borderRadius: '12px',
                  color: '#071013',
                  fontSize: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <Area
                type="monotone"
                dataKey="registrations"
                stroke="#21B3D2"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#liveVelocityGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
};
