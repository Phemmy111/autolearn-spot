"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Check, X } from 'lucide-react';

const DEFAULT_COURSES = [
  { slug: 'ai-automation-bootcamp', title: 'AI Automation Bootcamp' }
];

// Client component for Super Admin course completion settings
export function CourseCompletionCard() {
  const [courses, setCourses] = useState<Array<{ slug: string; title: string }>>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>('');
  const [finalLessonId, setFinalLessonId] = useState<string>('');
  const [certificateEnabled, setCertificateEnabled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');

  // Fetch available courses on mount
  useEffect(() => {
    async function fetchCourses() {
      const { data, error } = await supabase.from('courses').select('slug,title');
      if (error || !data || data.length === 0) {
        setCourses(DEFAULT_COURSES);
      } else {
        setCourses(data as any);
      }
    }
    fetchCourses();
  }, []);

  // Fetch settings when a course is selected
  useEffect(() => {
    if (!selectedSlug) return;
    async function fetchSettings() {
      setLoading(true);
      try {
        const res = await fetch(`/api/course-settings/${selectedSlug}`);
        if (!res.ok) throw new Error('Failed to fetch settings');
        const json = await res.json();
        setFinalLessonId(json.finalLessonId ?? '');
        setCertificateEnabled(!!json.certificateEnabled);
        setMessage('');
      } catch (e) {
        console.error(e);
        setMessage('Could not load settings');
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, [selectedSlug]);

  const handleSave = async () => {
    if (!selectedSlug) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/course-settings/${selectedSlug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ finalLessonId, certificateEnabled }),
      });
      if (!res.ok) throw new Error('Save failed');
      setMessage('Settings saved');
    } catch (e) {
      console.error(e);
      setMessage('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl hover:border-[#00f0ff]/50 transition-all">
      <h2 className="font-heading text-xl font-bold text-white mb-4">Course Completion Settings</h2>
      <div className="flex flex-col gap-4">
        <select
          className="bg-[#111317] text-[#b9cacb] p-2 rounded"
          value={selectedSlug}
          onChange={(e) => setSelectedSlug(e.target.value)}
        >
          <option value="">Select a course</option>
          {courses.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.title}
            </option>
          ))}
        </select>
        {selectedSlug && (
          <>
            <label className="font-mono text-sm text-[#b9cacb]">Final Lesson ID</label>
            <input
              className="bg-[#111317] text-[#e2e8e2] p-2 rounded"
              type="text"
              value={finalLessonId}
              onChange={(e) => setFinalLessonId(e.target.value)}
            />
            <label className="flex items-center gap-2 font-mono text-sm text-[#b9cacb]">
              <input
                type="checkbox"
                checked={certificateEnabled}
                onChange={(e) => setCertificateEnabled(e.target.checked)}
              />
              Certificate Enabled
            </label>
            <button
              className="mt-2 flex items-center gap-2 bg-[#00f0ff] text-black font-bold uppercase px-4 py-2 rounded hover:bg-white transition-colors disabled:opacity-50"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </>
        )}
        {loading && <p className="font-mono text-sm text-[#b9cacb]">Loading…</p>}
        {message && <p className="font-mono text-sm text-[#b9cacb]">{message}</p>}
      </div>
    </div>
  );
}
