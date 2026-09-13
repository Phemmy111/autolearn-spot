"use client";

import { useState, useRef, useEffect } from 'react';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: 'left' | 'right';
}

export function Dropdown({ trigger, children, align = 'right' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const alignStyles = {
    left: 'left-0',
    right: 'right-0',
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors"
      >
        {trigger}
        <ChevronDown className="ml-2 w-4 h-4" />
      </button>
      {isOpen && (
        <div className={cn(
          'absolute right-0 mt-2 w-56 bg-gray-100 border border-neutral-200 rounded-lg shadow-lg z-50',
          alignStyles[align]
        )}>
          {children}
        </div>
      )}
    </div>
  );
}

export interface DropdownItemProps {
  children: ReactNode;
  onClick?: () => void;
  divider?: boolean;
}

export function DropdownItem({ children, onClick, divider }: DropdownItemProps) {
  return (
    <>
      <div
        onClick={onClick}
        className="px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 cursor-pointer"
      >
        {children}
      </div>
      {divider && <div className="border-t border-neutral-200 my-1" />}
    </>
  );
}
