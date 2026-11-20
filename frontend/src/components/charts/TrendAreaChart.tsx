import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, BarChart2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export interface TrendDataPoint {
  timestamp: string;
  value: number;
  label?: string;
}

interface TrendAreaChartProps {
  data: TrendDataPoint[];
  title?: string;
  subtitle?: string;
  height?: number;
  emptyMessage?: string;
  metricLabel?: string;
}

export const TrendAreaChart: React.FC<TrendAreaChartProps> = ({
  data = [],
  title,
  subtitle,
  height = 260,
  emptyMessage = 'Not enough historical data to render trends yet.',
  metricLabel = 'Registrations',
}) => {
  const formattedData = data.map((item) => {
    let dateStr = item.label || item.timestamp;
    try {
      if (item.timestamp && !item.label) {
        const d = parseISO(item.timestamp);
        if (!isNaN(d.getTime())) {
          dateStr = format(d, 'MMM d');
        }
      }
    } catch {
      dateStr = item.label || item.timestamp;
    }
    return {
      name: dateStr,
      value: item.value,
    };
  });

  const isEmpty = formattedData.length === 0 || formattedData.every((d) => d.value === 0);

  return (
    <div className="w-full text-left">
      {(title || subtitle) && (
        <div className="mb-4">
          {title && (
            <h4 className="text-sm font-semibold text-slate-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              {title}
            </h4>
          )}
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      )}

      {isEmpty ? (
        <div
          style={{ height }}
          className="w-full flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-lg bg-slate-50/50 p-6 text-center"
        >
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
            <BarChart2 className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-700">No trend data available</p>
          <p className="text-xs text-slate-400 mt-0.5 max-w-xs">{emptyMessage}</p>
        </div>
      ) : (
        <div style={{ height, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedData} margin={{ top: 10, right: 12, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tick={{ fontSize: 11, fill: '#64748b' }}
                dy={6}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#64748b' }}
                allowDecimals={false}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-900 text-white text-xs px-3 py-2 rounded-lg shadow-md border border-slate-800">
                        <p className="text-slate-400 font-medium">{label}</p>
                        <p className="text-white font-semibold mt-0.5 tabular-nums">
                          {payload[0].value} {metricLabel}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#2563eb"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#trendGradient)"
                activeDot={{ r: 5, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
