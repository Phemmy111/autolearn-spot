"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, ExternalLink, Calendar, Users, ArrowLeft } from 'lucide-react';

// Modal fixes: reduced size, scrollable, click-outside-to-close

interface Assignment {
  id: string;
  week_number: number;
  title: string;
  description: string;
  instructions: string;
  due_date: string | null;
  max_score: number;
  is_required: boolean;
  cohort: { id: string; name: string; slug: string };
  submissions: { count: number };
}

export default function AdminAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [formData, setFormData] = useState({
    cohort_id: 'a1111111-1111-1111-1111-111111111111',
    week_number: 1,
    title: '',
    description: '',
    instructions: '',
    due_date: '',
    max_score: 100,
    is_required: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const res = await fetch('/api/admin/assignments');
      if (!res.ok) throw new Error('Failed to fetch assignments');
      const data = await res.json();
      setAssignments(data.assignments || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to create assignment');

      setShowCreateModal(false);
      setFormData({
        cohort_id: 'a1111111-1111-1111-1111-111111111111',
        week_number: 1,
        title: '',
        description: '',
        instructions: '',
        due_date: '',
        max_score: 100,
        is_required: true,
      });
      fetchAssignments();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAssignment) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/assignments/${editingAssignment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to update assignment');

      setEditingAssignment(null);
      setFormData({
        cohort_id: 'a1111111-1111-1111-1111-111111111111',
        week_number: 1,
        title: '',
        description: '',
        instructions: '',
        due_date: '',
        max_score: 100,
        is_required: true,
      });
      fetchAssignments();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assignment? This will also delete all submissions.')) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/assignments/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete assignment');
      fetchAssignments();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const openEditModal = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      cohort_id: assignment.cohort.id,
      week_number: assignment.week_number,
      title: assignment.title,
      description: assignment.description || '',
      instructions: assignment.instructions || '',
      due_date: assignment.due_date ? assignment.due_date.slice(0, 16) : '',
      max_score: assignment.max_score,
      is_required: assignment.is_required,
    });
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'No due date';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111317] text-[#e2e8e2] flex items-center justify-center">
        <div className="font-mono text-sm text-[#b9cacb]">Loading assignments...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#111317] text-[#e2e8e2] flex items-center justify-center">
        <div className="font-mono text-sm text-[#ff6b6b]">Error: {error}</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#111317] text-[#e2e8e2]">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-[#3b494b] bg-[#111317]/95 px-4 backdrop-blur sm:px-6">
        <Link className="flex items-center gap-2 font-mono text-sm font-bold uppercase text-white" href="/admin">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-[#00f0ff]">//</span>
          <span className="underline decoration-[#b9cacb] decoration-2 underline-offset-2">Admin</span>
        </Link>
        <div className="font-mono text-xs uppercase text-[#b9cacb]">
          Assignments
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6"
>
        <div className="mb-8 flex items-center justify-between">
          <h1 className="font-heading text-3xl font-bold uppercase text-white">Manage Assignments</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 border border-[#00f0ff] bg-[#00f0ff] px-4 py-2 font-mono text-xs uppercase font-bold text-black transition hover:bg-white"
          >
            <Plus className="h-4 w-4" />
            Create Assignment
          </button>
        </div>

        {assignments.length === 0 ? (
          <div className="border border-[#3b494b] bg-[#1a1d24] p-8 text-center">
            <p className="font-mono text-sm text-[#b9cacb]">No assignments created yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="border border-[#3b494b] bg-[#1a1d24] p-6"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <span className="font-mono text-xs uppercase text-[#00f0ff]">
                        Week {assignment.week_number}
                      </span>
                      <span className="font-mono text-xs text-[#b9cacb]">
                        {assignment.cohort.name}
                      </span>
                    </div>
                    <h2 className="mb-2 font-heading text-xl font-bold text-white">
                      {assignment.title}
                    </h2>
                    {assignment.description && (
                      <p className="mb-4 font-mono text-sm text-[#b9cacb]">
                        {assignment.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-4 text-xs font-mono text-[#b9cacb]">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Due: {formatDate(assignment.due_date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{assignment.submissions.count} submissions</span>
                      </div>
                      <div>
                        <span>Max Score: {assignment.max_score}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/admin/assignments/${assignment.id}/submissions`}
                      className="flex items-center gap-2 border border-[#3b494b] bg-[#0c0e12] px-4 py-2 font-mono text-xs uppercase text-[#b9cacb] transition hover:border-[#00f0ff] hover:text-[#00f0ff]"
                    >
                      <Users className="h-4 w-4" />
                      Review
                    </Link>
                    <button
                      onClick={() => openEditModal(assignment)}
                      className="flex items-center gap-2 border border-[#3b494b] bg-[#0c0e12] px-4 py-2 font-mono text-xs uppercase text-[#b9cacb] transition hover:border-[#00f0ff] hover:text-[#00f0ff]"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(assignment.id)}
                      disabled={deletingId === assignment.id}
                      className="flex items-center gap-2 border border-[#ff6b6b] bg-[#0c0e12] px-4 py-2 font-mono text-xs uppercase text-[#ff6b6b] transition hover:bg-[#ff6b6b] hover:text-black disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      {deletingId === assignment.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingAssignment) && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCreateModal(false);
              setEditingAssignment(null);
              setFormData({
                cohort_id: 'a1111111-1111-1111-1111-111111111111',
                week_number: 1,
                title: '',
                description: '',
                instructions: '',
                due_date: '',
                max_score: 100,
                is_required: true,
              });
            }
          }}
        >
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl border border-[#1f2229] bg-[#0c0e12] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-xl font-bold text-white">
                {editingAssignment ? 'Edit Assignment' : 'Create Assignment'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingAssignment(null);
                  setFormData({
                    cohort_id: 'a1111111-1111-1111-1111-111111111111',
                    week_number: 1,
                    title: '',
                    description: '',
                    instructions: '',
                    due_date: '',
                    max_score: 100,
                    is_required: true,
                  });
                }}
                className="text-[#b9cacb] hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={editingAssignment ? handleUpdate : handleCreate} className="space-y-4">
              <div>
                <label className="mb-2 block font-mono text-xs uppercase text-[#b9cacb]">
                  Week Number *
                </label>
                <input
                  type="number"
                  value={formData.week_number}
                  onChange={(e) => setFormData({ ...formData, week_number: parseInt(e.target.value) })}
                  min="1"
                  required
                  className="w-full border border-[#3b494b] bg-[#1a1d24] px-4 py-3 font-mono text-sm text-[#e2e8e2] focus:border-[#00f0ff] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block font-mono text-xs uppercase text-[#b9cacb]">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full border border-[#3b494b] bg-[#1a1d24] px-4 py-3 font-mono text-sm text-[#e2e8e2] focus:border-[#00f0ff] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block font-mono text-xs uppercase text-[#b9cacb]">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full border border-[#3b494b] bg-[#1a1d24] px-4 py-3 font-mono text-sm text-[#e2e8e2] focus:border-[#00f0ff] focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="mb-2 block font-mono text-xs uppercase text-[#b9cacb]">
                  Instructions
                </label>
                <textarea
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  rows={4}
                  className="w-full border border-[#3b494b] bg-[#1a1d24] px-4 py-3 font-mono text-sm text-[#e2e8e2] focus:border-[#00f0ff] focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="mb-2 block font-mono text-xs uppercase text-[#b9cacb]">
                  Due Date
                </label>
                <input
                  type="datetime-local"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full border border-[#3b494b] bg-[#1a1d24] px-4 py-3 font-mono text-sm text-[#e2e8e2] focus:border-[#00f0ff] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block font-mono text-xs uppercase text-[#b9cacb]">
                  Max Score
                </label>
                <input
                  type="number"
                  value={formData.max_score}
                  onChange={(e) => setFormData({ ...formData, max_score: parseInt(e.target.value) })}
                  min="0"
                  className="w-full border border-[#3b494b] bg-[#1a1d24] px-4 py-3 font-mono text-sm text-[#e2e8e2] focus:border-[#00f0ff] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_required"
                  checked={formData.is_required}
                  onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                  className="h-4 w-4 accent-[#00f0ff]"
                />
                <label htmlFor="is_required" className="font-mono text-xs text-[#b9cacb]">
                  Required for certificate
                </label>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingAssignment(null);
                    setFormData({
                      cohort_id: 'a1111111-1111-1111-1111-111111111111',
                      week_number: 1,
                      title: '',
                      description: '',
                      instructions: '',
                      due_date: '',
                      max_score: 100,
                      is_required: true,
                    });
                  }}
                  className="font-mono text-sm text-[#b9cacb] hover:text-white px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#00f0ff] text-black font-bold uppercase tracking-wider font-mono px-4 py-2 rounded hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Saving...' : editingAssignment ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
