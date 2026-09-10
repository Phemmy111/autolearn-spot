import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}

export function StatCard({ 
  label, 
  value, 
  change, 
  changeLabel = 'from last month',
  icon,
  trend = 'neutral' 
}: StatCardProps) {
  const trendColors = {
    up: 'text-emerald-600',
    down: 'text-red-600',
    neutral: 'text-neutral-600',
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-600 mb-1">
            {label}
          </p>
          <p className="text-2xl font-bold text-neutral-900">
            {value}
          </p>
        </div>
        {icon && (
          <div className="text-neutral-400">
            {icon}
          </div>
        )}
      </div>
      {change !== undefined && (
        <div className="mt-2">
          <p className={cn(
            'text-sm font-medium',
            trendColors[trend]
          )}>
            {trend === 'up' && '+'}
            {change}% {changeLabel}
          </p>
        </div>
      )}
    </div>
  );
}