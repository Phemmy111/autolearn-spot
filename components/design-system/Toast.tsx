"use client";

import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ToastProps {
  id: string;
  variant?: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  onClose?: (id: string) => void;
  duration?: number;
}

export function Toast({ 
  id, 
  variant = 'info', 
  title, 
  description, 
  onClose,
  duration = 5000 
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose?.(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const variants = {
    success: 'border-l-4 border-emerald-500',
    error: 'border-l-4 border-red-500',
    warning: 'border-l-4 border-amber-500',
    info: 'border-l-4 border-sky-500',
  };

  return (
    <div className={cn(
      'bg-gray-100 border border-neutral-200 rounded-lg shadow-lg p-4 mb-2',
      variants[variant]
    )}>
      <div className="flex-1">
        <h4 className="font-medium text-neutral-900">{title}</h4>
        {description && (
          <p className="text-sm text-neutral-600 mt-1">{description}</p>
        )}
      </div>
      {onClose && (
        <button
          onClick={() => onClose(id)}
          className="ml-4 text-neutral-400 hover:text-neutral-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export function ToastContainer({ children }: { children: ReactNode }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      {children}
    </div>
  );
}