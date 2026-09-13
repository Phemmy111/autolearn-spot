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
    up: 'text-brand-primary',
    down: 'text-red-600',
    neutral: 'text-brand-text/70',
  };

  return (
    <div className="bg-[var(--card)] brightness-95 border border-brand-border rounded-lg p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-brand-text/70 mb-1">
            {label}
          </p>
          <p className="text-2xl font-bold text-brand-text">
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
