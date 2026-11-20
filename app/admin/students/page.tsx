"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Search, 
  RefreshCw, 
  Activity, 
  Trash2, 
  Power, 
  BookOpen, 
  Calendar, 
  CreditCard, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  Plus, 
  ChevronRight,
  Filter,
  X
} from 'lucide-react';
import { ManualEnrollmentForm } from './ManualEnrollmentForm';

interface Student {
  id: string;
  name: string;
  email: string;
  clerk_user_id?: string | null;
  course_id?: string;
  course: string;
  amount: number;
  status: 'active' | 'deactivated' | 'not_started' | 'expired' | 'inactive';
  date: string;
  days_left?: number | null;
}

interface Metrics {
  total: number;
  active: number;
  deactivated: number;
  not_started: number;
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    total: 0,
    active: 0,
    deactivated: 0,
    not_started: 0,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'deactivated' | 'not_started'>('all');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showManualEnroll, setShowManualEnroll] = useState(false);

  // Delete confirmation modal state
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/students');
      if (res.ok) {
        const json = await res.json();
        setStudents(json.data || []);
        if (json.metrics) {
          setMetrics(json.metrics);
        }
      } else {
        setFeedback({ type: 'error', message: 'Failed to load students' });
      }
    } catch (err: any) {
      console.error('Error fetching students:', err);
      setFeedback({ type: 'error', message: err.message || 'Error fetching students' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Handle Deactivation / Reactivation
  const handleToggleStatus = async (student: Student) => {
    const isCurrentlyActive = student.status === 'active';
    const nextAction = isCurrentlyActive ? 'deactivate' : 'activate';
    const nextStatus = isCurrentlyActive ? 'deactivated' : 'active';

    setActionLoading(student.id);
    setFeedback(null);

    try {
      const res = await fetch('/api/admin/students', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: student.id,
          action: nextAction,
          status: nextStatus,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update student status');
      }

      // Optimistically update local state
      setStudents(prev =>
        prev.map(s => (s.id === student.id ? { ...s, status: nextStatus as any } : s))
      );

      setMetrics(prev => ({
        ...prev,
        active: isCurrentlyActive ? Math.max(0, prev.active - 1) : prev.active + 1,
        deactivated: isCurrentlyActive ? prev.deactivated + 1 : Math.max(0, prev.deactivated - 1),
      }));

      setFeedback({
        type: 'success',
        message: `${student.name || student.email} has been ${isCurrentlyActive ? 'deactivated' : 'reactivated'} successfully.`,
      });

      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to change student status',
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Deletion / Removal of Student Enrollment
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    const targetId = deleteTarget.id;
    setActionLoading(targetId);
    setFeedback(null);

    try {
      const res = await fetch(`/api/admin/students?id=${encodeURIComponent(targetId)}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to remove student');
      }

      // Remove from list
      setStudents(prev => prev.filter(s => s.id !== targetId));

      setMetrics(prev => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
        active: deleteTarget.status === 'active' ? Math.max(0, prev.active - 1) : prev.active,
        deactivated: deleteTarget.status === 'deactivated' ? Math.max(0, prev.deactivated - 1) : prev.deactivated,
        not_started: deleteTarget.status === 'not_started' ? Math.max(0, prev.not_started - 1) : prev.not_started,
      }));

      setFeedback({
        type: 'success',
        message: `Student enrollment for ${deleteTarget.name || deleteTarget.email} removed permanently.`,
      });

      setDeleteTarget(null);
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to delete student enrollment',
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // Status filter
      if (statusFilter !== 'all' && student.status !== statusFilter) {
        return false;
      }

      // Search filter
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesName = student.name?.toLowerCase().includes(query);
        const matchesEmail = student.email?.toLowerCase().includes(query);
        const matchesCourse = student.course?.toLowerCase().includes(query);
        return matchesName || matchesEmail || matchesCourse;
      }

      return true;
    });
  }, [students, statusFilter, search]);

  return (
    <div className="min-h-screen p-6 sm:p-8 text-brand-text bg-brand-bg">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-brand-text">
            Student Management
          </h1>
          <p className="text-xs sm:text-sm text-brand-text/60 mt-1">
            Manage course enrollments, activate or deactivate access, and monitor student privileges.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowManualEnroll(!showManualEnroll)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 border border-slate-700/80 hover:border-emerald-500/50 text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>{showManualEnroll ? 'Hide Enrollment Form' : 'Manual Enroll'}</span>
          </button>

          <Link
            href="/admin/students/activities"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
          >
            <Activity className="w-4 h-4" />
            <span>Activities &amp; Progress Dashboard</span>
          </Link>

          <button
            onClick={fetchStudents}
            disabled={loading}
            className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl transition-colors"
            title="Refresh list"
            aria-label="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`mb-6 p-4 rounded-xl border flex items-center justify-between text-xs font-medium animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="p-1 hover:opacity-75 transition-opacity"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Collapsible Manual Enrollment */}
      {showManualEnroll && (
        <div className="mb-6 animate-in slide-in-from-top-4 duration-300">
          <ManualEnrollmentForm />
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-[var(--card)] brightness-95 border border-brand-border/60 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-text/60 uppercase tracking-wider">Total Enrolled</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black mt-2 text-brand-text">{metrics.total}</div>
          <p className="text-[11px] text-brand-text/50 mt-0.5">All registered student seats</p>
        </div>

        <div className="bg-[var(--card)] brightness-95 border border-brand-border/60 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-text/60 uppercase tracking-wider">Active Access</span>
            <UserCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black mt-2 text-emerald-400">{metrics.active}</div>
          <p className="text-[11px] text-brand-text/50 mt-0.5">Students with active course access</p>
        </div>

        <div className="bg-[var(--card)] brightness-95 border border-brand-border/60 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-text/60 uppercase tracking-wider">Deactivated</span>
            <UserX className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black mt-2 text-rose-400">{metrics.deactivated}</div>
          <p className="text-[11px] text-brand-text/50 mt-0.5">Access disabled by admin</p>
        </div>

        <div className="bg-[var(--card)] brightness-95 border border-brand-border/60 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-text/60 uppercase tracking-wider">Pending Start</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black mt-2 text-amber-400">{metrics.not_started}</div>
          <p className="text-[11px] text-brand-text/50 mt-0.5">Enrolled but not yet activated</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[var(--card)] brightness-95 border border-brand-border/60 rounded-2xl p-4 mb-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-brand-text/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, email, or course..."
            className="w-full pl-10 pr-4 py-2 bg-brand-bg border border-brand-border/80 rounded-xl text-xs text-brand-text placeholder-brand-text/40 focus:outline-none focus:border-emerald-500"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text/40 hover:text-brand-text"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(['all', 'active', 'deactivated', 'not_started'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all ${
                statusFilter === tab
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-brand-bg text-brand-text/60 hover:text-brand-text hover:bg-[var(--card)]'
              }`}
            >
              {tab === 'all' ? `All (${students.length})` : tab.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-[var(--card)] brightness-95 rounded-2xl shadow-sm border border-brand-border/60 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-brand-text/60">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
            <p className="text-xs">Loading student records...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 text-brand-text/30 mx-auto mb-3" />
            <p className="text-sm font-semibold text-brand-text">No students match your criteria.</p>
            <p className="text-xs text-brand-text/50 mt-1">
              Try adjusting your search query or status filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-brand-border/60 text-brand-text/60 bg-brand-bg/50">
                  <th className="p-4 font-bold uppercase tracking-wider text-[11px]">Student</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-[11px]">Course</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-[11px]">Amount</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-[11px]">Enrolled Date</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-[11px]">Status</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-[11px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/40">
                {filteredStudents.map(student => {
                  const isDeactivated = student.status === 'deactivated';
                  const isActive = student.status === 'active';
                  const isPending = actionLoading === student.id;

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-brand-bg/40 transition-colors"
                    >
                      {/* Student Info */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs uppercase shrink-0 ${
                            isDeactivated
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          }`}>
                            {student.name ? student.name.slice(0, 2) : 'ST'}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-brand-text truncate max-w-[200px]">
                              {student.name}
                            </div>
                            <div className="text-[11px] text-brand-text/60 truncate max-w-[200px]">
                              {student.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Course */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-3.5 h-3.5 text-brand-text/50 shrink-0" />
                          <span className="font-medium text-brand-text truncate max-w-[220px]">
                            {student.course}
                          </span>
                        </div>
                      </td>

                      {/* Amount Paid */}
                      <td className="p-4">
                        <span className="font-semibold text-brand-text">
                          ₦{Number(student.amount || 0).toLocaleString()}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="p-4 text-brand-text/70">
                        {student.date !== 'N/A'
                          ? new Date(student.date).toLocaleDateString()
                          : 'N/A'}
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        {isDeactivated ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                            <UserX className="w-3 h-3" />
                            Deactivated
                          </span>
                        ) : isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 capitalize">
                            <Clock className="w-3 h-3" />
                            {student.status.replace('_', ' ')}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Deactivate / Reactivate Toggle Button */}
                          <button
                            onClick={() => handleToggleStatus(student)}
                            disabled={isPending}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all disabled:opacity-50 ${
                              isDeactivated
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                                : 'bg-slate-800 hover:bg-amber-600 text-slate-200 hover:text-white border border-slate-700'
                            }`}
                            title={isDeactivated ? 'Reactivate student access' : 'Deactivate student course access'}
                          >
                            <Power className="w-3 h-3" />
                            <span>
                              {isPending
                                ? 'Processing...'
                                : isDeactivated
                                ? 'Reactivate'
                                : 'Deactivate'}
                            </span>
                          </button>

                          {/* Delete / Remove Student Button */}
                          <button
                            onClick={() => setDeleteTarget(student)}
                            disabled={isPending}
                            className="p-1.5 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 border border-transparent hover:border-rose-500/30 transition-all disabled:opacity-50"
                            title="Permanently remove student enrollment"
                            aria-label="Remove Student"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Permanent Deletion Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Remove Student Enrollment?</h3>
                <p className="text-xs text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Student:</span>
                <span className="text-white font-bold">{deleteTarget.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Email:</span>
                <span className="text-slate-300">{deleteTarget.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Course:</span>
                <span className="text-emerald-400 font-bold">{deleteTarget.course}</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to completely delete this student enrollment from the database? All course access permissions for this record will be permanently revoked.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={actionLoading === deleteTarget.id}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={actionLoading === deleteTarget.id}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-lg shadow-rose-950/60"
              >
                {actionLoading === deleteTarget.id ? 'Deleting...' : 'Yes, Remove Student'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
