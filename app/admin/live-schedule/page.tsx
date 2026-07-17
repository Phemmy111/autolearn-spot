// app/admin/live-schedule/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Schedule {
  day: string;
  startTime: string;
  durationMinutes: number;
  roomPrefix: string;
}

export default function LiveScheduleAdmin() {
  const { isSignedIn, user } = useUser();
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [status, setStatus] = useState<string>("");

  // Simple admin check – you can replace with proper role handling
  const isAdmin = user?.publicMetadata?.role === "admin";

  useEffect(() => {
    if (!isSignedIn) return;
    fetch("/api/live-schedule")
      .then((r) => r.json())
      .then(setSchedule)
      .catch(() => setStatus("Failed to load schedule"));
  }, [isSignedIn]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!schedule) return;
    const { name, value } = e.target;
    setSchedule({ ...schedule, [name]: name === "durationMinutes" ? Number(value) : value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedule) return;
    setStatus("Saving...");
    const res = await fetch("/api/live-schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(schedule),
    });
    if (res.ok) setStatus("Saved successfully");
    else setStatus("Error saving");
  };

  if (!isSignedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Please <Link href="/sign-in" className="text-blue-500 underline">sign in</Link> as an admin.</p>
      </div>
    );
  }

  if (!isAdmin) {
    return <p className="text-center mt-8">You do not have permission to access this page.</p>;
  }

  return (
    <section className="min-h-screen bg-[#0a0c10]">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-[#b9cacb] hover:text-white font-mono text-sm mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admin
          </Link>
          <h1 className="font-heading text-4xl font-bold text-white mb-4">Live Class Schedule</h1>
          <p className="font-mono text-sm text-[#b9cacb]">Configure live class schedule settings</p>
        </div>
        
        {schedule ? (
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <label className="block">
              <span className="text-gray-300">Day of week</span>
              <input
                type="text"
                name="day"
                value={schedule.day}
                onChange={handleChange}
                className="mt-1 block w-full rounded bg-gray-800 border-gray-700 text-white"
              />
            </label>
            <label className="block">
              <span className="text-gray-300">Start time (HH:mm)</span>
              <input
                type="time"
                name="startTime"
                value={schedule.startTime}
                onChange={handleChange}
                className="mt-1 block w-full rounded bg-gray-800 border-gray-700 text-white"
              />
            </label>
            <label className="block">
              <span className="text-gray-300">Duration (minutes)</span>
              <input
                type="number"
                name="durationMinutes"
                value={schedule.durationMinutes}
                onChange={handleChange}
                className="mt-1 block w-full rounded bg-gray-800 border-gray-700 text-white"
              />
            </label>
            <label className="block">
              <span className="text-gray-300">Room prefix</span>
              <input
                type="text"
                name="roomPrefix"
                value={schedule.roomPrefix}
                onChange={handleChange}
                className="mt-1 block w-full rounded bg-gray-800 border-gray-700 text-white"
              />
            </label>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
              Save Schedule
            </button>
            {status && <p className="mt-2 text-sm text-gray-400">{status}</p>}
          </form>
        ) : (
          <p>Loading schedule...</p>
        )}
      </div>
    </section>
  );
}
