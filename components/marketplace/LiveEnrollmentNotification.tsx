"use client";

import React, { useState, useEffect } from 'react';
import { CheckCircle2, ShieldCheck, X, Sparkles } from 'lucide-react';

interface NotificationItem {
  name: string;
  location: string;
  timeAgo: string;
}

const RECENT_STUDENTS: NotificationItem[] = [
  { name: 'Emmanuel A.', location: 'Ikeja, Lagos', timeAgo: '3 minutes ago' },
  { name: 'Blessing O.', location: 'Abuja, FCT', timeAgo: '8 minutes ago' },
  { name: 'Tunde B.', location: 'Ibadan, Oyo', timeAgo: '14 minutes ago' },
  { name: 'Chiamaka N.', location: 'Port Harcourt', timeAgo: '21 minutes ago' },
  { name: 'David K.', location: 'Lekki, Lagos', timeAgo: '27 minutes ago' },
  { name: 'Fatima S.', location: 'Kano', timeAgo: '34 minutes ago' },
  { name: 'Samuel E.', location: 'Enugu', timeAgo: '41 minutes ago' },
  { name: 'Precious M.', location: 'Benin City', timeAgo: '53 minutes ago' },
];

export function LiveEnrollmentNotification({
  courseTitle = 'AI Automation Masterclass',
}: {
  courseTitle?: string;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (isDismissed) return;

    // Initial delay before first toast: 6 seconds
    const initialTimer = setTimeout(() => {
      setIsVisible(true);
    }, 6000);

    return () => clearTimeout(initialTimer);
  }, [isDismissed]);

  useEffect(() => {
    if (isDismissed || !isVisible) return;

    // Hide after 6 seconds of display
    const hideTimer = setTimeout(() => {
      setIsVisible(false);

      // Wait 22 seconds before showing the next one
      const nextTimer = setTimeout(() => {
        setCurrentIdx((prev) => (prev + 1) % RECENT_STUDENTS.length);
        setIsVisible(true);
      }, 22000);

      return () => clearTimeout(nextTimer);
    }, 6000);

    return () => clearTimeout(hideTimer);
  }, [isVisible, isDismissed]);

  if (isDismissed || !isVisible) return null;

  const student = RECENT_STUDENTS[currentIdx];

  return (
    <div className="fixed bottom-24 sm:bottom-6 left-3 sm:left-6 z-40 max-w-[320px] sm:max-w-[360px] animate-in fade-in slide-in-from-bottom-5 duration-500">
      <div className="bg-card/95 backdrop-blur-md border border-border/80 rounded-2xl p-3 sm:p-3.5 shadow-2xl shadow-black/10 flex items-start gap-3 relative group">
        {/* Dismiss Button */}
        <button
          onClick={() => setIsDismissed(true)}
          className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground opacity-60 hover:opacity-100 transition-opacity"
          title="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Pulse / Avatar Icon */}
        <div className="relative shrink-0 mt-0.5">
          <div className="w-9 h-9 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center">
            {student.name.slice(0, 1)}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-card flex items-center justify-center">
            <CheckCircle2 className="w-2.5 h-2.5 text-white stroke-[3]" />
          </span>
        </div>

        {/* Text Content */}
        <div className="flex-1 pr-4">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="font-bold text-foreground text-xs leading-none">
              {student.name}
            </span>
            <span className="text-[10px] text-muted-foreground">
              from {student.location}
            </span>
          </div>

          <p className="text-[11px] text-muted-foreground line-clamp-1 leading-snug">
            Enrolled in <span className="font-semibold text-foreground">{courseTitle}</span>
          </p>

          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 inline" /> Verified Student
            </span>
            <span className="text-[10px] text-muted-foreground">• {student.timeAgo}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
