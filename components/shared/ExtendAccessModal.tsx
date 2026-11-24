"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, 
  Calendar, 
  Sparkles, 
  Infinity as InfinityIcon, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRight,
  ShieldCheck,
  CalendarPlus
} from 'lucide-react';

export interface ExtendAccessStudent {
  id: string; // enrollmentId
  name: string;
  email: string;
  course: string;
  status: string;
  expires_at?: string | null;
  days_left?: number | null;
  is_lifetime?: boolean;
}

interface ExtendAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: ExtendAccessStudent | null;
  apiEndpoint: string; // e.g. '/api/admin/students' or '/api/author/students'
  onSuccess: (result: {
    days_left: number | null;
    is_lifetime: boolean;
    expires_at: string | null;
    status: string;
    message: string;
  }) => void;
}

const PRESET_DAYS = [7, 14, 30, 60, 90, 365];

export default function ExtendAccessModal({
  isOpen,
  onClose,
  student,
  apiEndpoint,
  onSuccess,
}: ExtendAccessModalProps) {
  const [selectedDays, setSelectedDays] = useState<number>(30);
  const [customDays, setCustomDays] = useState<string>('30');
  const [isLifetime, setIsLifetime] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && student) {
      setError(null);
      setLoading(false);
      if (student.is_lifetime) {
        setIsLifetime(true);
        setSelectedDays(30);
        setCustomDays('30');
      } else {
        setIsLifetime(false);
        setSelectedDays(30);
        setCustomDays('30');
      }
    }
  }, [isOpen, student]);

  const isElapsed = useMemo(() => {
    if (!student) return false;
    if (student.is_lifetime) return false;
    if (student.status === 'expired' || student.status === 'inactive') return true;
    if (typeof student.days_left === 'number' && student.days_left <= 0) return true;
    if (student.expires_at) {
      return new Date(student.expires_at).getTime() <= Date.now();
    }
    return false;
  }, [student]);

  const previewNewExpiry = useMemo(() => {
    if (isLifetime) {
      return {
        formattedDate: 'Permanent Lifetime Access',
        description: 'Never expires. Student retains full access indefinitely.',
        isLifetime: true,
      };
    }

    const days = Number(customDays) || selectedDays || 30;
    const now = Date.now();
    const msPerDay = 24 * 60 * 60 * 1000;

    let baseTime = now;
    if (!isElapsed && student?.expires_at) {
      const exp = new Date(student.expires_at).getTime();
      if (exp > now) {
        baseTime = exp;
      }
    } else if (!isElapsed && typeof student?.days_left === 'number' && student.days_left > 0) {
      baseTime = now + (student.days_left * msPerDay);
    }

    const targetDate = new Date(baseTime + (days * msPerDay));
    const formatted = targetDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const totalDaysFromNow = Math.ceil((targetDate.getTime() - now) / msPerDay);

    return {
      formattedDate: formatted,
      description: isElapsed 
        ? `Reactivates today and grants ${days} days of active access (${totalDaysFromNow} days from now)`
        : `Adds ${days} days onto existing time (${totalDaysFromNow} days remaining from now)`,
      isLifetime: false,
    };
  }, [isLifetime, customDays, selectedDays, isElapsed, student]);

  if (!isOpen || !student) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const days = Number(customDays) || selectedDays;
    if (!isLifetime && (!days || days <= 0)) {
      setError('Please choose or enter a valid number of days (at least 1 day).');
      setLoading(false);
      return;
    }

    try {
      const payload: any = {
        id: student.id,
        enrollmentId: student.id,
        action: 'extend_access',
        isLifetime,
        daysToAdd: isLifetime ? undefined : days,
      };

      const res = await fetch(apiEndpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || 'Failed to extend course access');
      }

      onSuccess({
        days_left: data.data?.days_left ?? (isLifetime ? null : days),
        is_lifetime: data.data?.is_lifetime ?? isLifetime,
        expires_at: data.data?.expires_at ?? null,
        status: data.data?.status || 'active',
        message: data.message || 'Access successfully extended',
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error extending student access');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-border bg-gradient-to-r from-emerald-500/10 via-brand-primary/5 to-transparent flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shadow-sm">
              <CalendarPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-foreground text-lg sm:text-xl leading-tight">
                Extend Course Access
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Add days or grant lifetime access to student
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Student Profile Card */}
          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/80 flex items-center justify-between gap-3 text-xs">
            <div className="min-w-0">
              <p className="font-bold text-foreground truncate text-sm">{student.name}</p>
              <p className="text-muted-foreground truncate">{student.email}</p>
              <p className="text-muted-foreground/80 truncate text-[11px] mt-0.5 font-medium">
                Course: <strong className="text-foreground">{student.course}</strong>
              </p>
            </div>
            <div className="shrink-0 text-right">
              {student.is_lifetime ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  <InfinityIcon className="w-3.5 h-3.5" /> Lifetime
                </span>
              ) : isElapsed ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  <Clock className="w-3.5 h-3.5" /> Time Elapsed
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {student.days_left ?? 0}d left
                </span>
              )}
            </div>
          </div>

          {/* Special notice if time has elapsed */}
          {isElapsed && !student.is_lifetime && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold block">Student's access has elapsed:</strong>
                Adding days will immediately reactivate this student's course access starting from today.
              </div>
            </div>
          )}

          {/* Access Mode Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                Choose Extension Option
              </label>
              <button
                type="button"
                onClick={() => setIsLifetime(!isLifetime)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  isLifetime
                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/30'
                    : 'bg-muted hover:bg-muted/80 text-foreground border border-border'
                }`}
              >
                <InfinityIcon className="w-3.5 h-3.5" />
                <span>{isLifetime ? 'Lifetime Selected' : 'Make Lifetime Access'}</span>
              </button>
            </div>

            {!isLifetime && (
              <>
                {/* Preset Days Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {PRESET_DAYS.map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => {
                        setSelectedDays(days);
                        setCustomDays(String(days));
                      }}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                        selectedDays === days && customDays === String(days)
                          ? 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-emerald-500'
                          : 'bg-card border-border hover:border-emerald-500/50 text-foreground hover:bg-muted/50'
                      }`}
                    >
                      +{days}d
                    </button>
                  ))}
                </div>

                {/* Custom Days Input */}
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                    Or custom days:
                  </span>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="1"
                      max="3650"
                      value={customDays}
                      onChange={(e) => {
                        setCustomDays(e.target.value);
                        setSelectedDays(Number(e.target.value) || 0);
                      }}
                      placeholder="e.g. 45"
                      className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-foreground text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium pointer-events-none">
                      days
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Live Preview Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">New Expiration Result:</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500 text-white">
                Active Access
              </span>
            </div>
            <div className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
              {previewNewExpiry.isLifetime ? (
                <>
                  <InfinityIcon className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {previewNewExpiry.formattedDate}
                  </span>
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4 text-emerald-500" />
                  <span>{previewNewExpiry.formattedDate}</span>
                </>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {previewNewExpiry.description}
            </p>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground font-bold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 flex items-center gap-2 transition-all hover:-translate-y-0.5 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Updating Access...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirm & Extend Access</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
