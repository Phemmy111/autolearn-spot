import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  size?: 'sm' | 'base' | 'lg';
  error?: boolean;
  success?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    size = 'base',
    error = false,
    success = false,
    type = 'text',
    ...props 
  }, ref) => {
    const sizes = {
      sm: 'px-2 py-1 text-xs',
      base: 'px-3 py-2 text-sm',
      lg: 'px-4 py-3 text-base',
    };

    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          'flex w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
          sizes[size],
          error && 'border-red-500 focus:ring-red-500',
          success && 'border-emerald-500 focus:ring-emerald-500',
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export { Input };