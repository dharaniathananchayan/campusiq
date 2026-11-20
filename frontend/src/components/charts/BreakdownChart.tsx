import React from 'react';

interface BreakdownItem {
  label: string;
  value: number;
  percentage?: number;
}

interface BreakdownChartProps {
  data: Record<string, number> | BreakdownItem[];
  title?: string;
  subtitle?: string;
}

export const BreakdownChart: React.FC<BreakdownChartProps> = ({
  data,
  title,
  subtitle,
}) => {
  const items: BreakdownItem[] = Array.isArray(data)
    ? data
    : Object.entries(data || {}).map(([label, value]) => ({ label, value }));

  const total = items.reduce((acc, curr) => acc + curr.value, 0);

  const sortedItems = [...items].sort((a, b) => b.value - a.value);

  return (
    <div className="w-full text-left space-y-4">
      {(title || subtitle) && (
        <div>
          {title && <h4 className="text-sm font-semibold text-slate-900 tracking-tight">{title}</h4>}
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      )}

      {sortedItems.length === 0 || total === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
          No breakdown data recorded
        </div>
      ) : (
        <div className="space-y-3">
          {sortedItems.map((item) => {
            const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
            return (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700 truncate max-w-[200px]">{item.label}</span>
                  <span className="text-slate-500 tabular-nums font-medium">
                    {item.value} <span className="text-slate-400">({pct}%)</span>
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
