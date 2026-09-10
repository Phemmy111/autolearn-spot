import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'avatar' | 'button' | 'card';
}

const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ 
    className, 
    variant = 'text',
    ...props 
  }, ref) => {
    const variants = {
      text: 'h-4 w-full',
      avatar: 'h-10 w-10 rounded-full',
      button: 'h-10 w-20 rounded',
      card: 'h-32 w-full',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'animate-pulse bg-neutral-200 rounded',
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

export { Skeleton };