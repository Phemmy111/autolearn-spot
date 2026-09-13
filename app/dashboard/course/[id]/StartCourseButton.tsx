"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Loader2 } from 'lucide-react';

export default function StartCourseButton({ enrollmentId }: { enrollmentId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleStart = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/dashboard/courses/${enrollmentId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to start course');
        setLoading(false);
        return;
      }

      // Refresh the page to show the countdown and unlocked lessons
      router.refresh();
    } catch (err) {
      console.error('Error starting course:', err);
      alert('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleStart}
      disabled={loading}
      className="inline-flex items-center gap-2 bg-[#10b981] text-white font-bold px-6 py-2.5 rounded-xl hover:bg-[#0d9668] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Starting...
        </>
      ) : (
        <>
          <Play className="w-4 h-4 fill-current" />
          Start Course Now
        </>
      )}
    </button>
  );
}
