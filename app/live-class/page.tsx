// app/live-class/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import LiveJitsi from "@/components/LiveJitsi";
import Link from "next/link";
import path from "path";
import fs from "fs";

interface Schedule {
  day: string;
  startTime: string; // "HH:mm" 24h
  durationMinutes: number;
  roomPrefix: string;
}

export default function LiveClassPage() {
  const { isSignedIn, user } = useUser();
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [showJitsi, setShowJitsi] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [countdown, setCountdown] = useState<string>("");

  // Load schedule JSON (client‑side fetch of static file)
  useEffect(() => {
    fetch("/data/live-schedule.json")
      .then((res) => res.json())
      .then((data) => setSchedule(data))
      .catch(() => console.error("Failed to load schedule"));
  }, []);

  // Compute next occurrence and countdown
  useEffect(() => {
    if (!schedule) return;
    const interval = setInterval(() => {
      const now = new Date();
      const target = getNextOccurrence(schedule);
      const diff = target.getTime() - now.getTime();
      if (diff <= 0) {
        setCountdown("Live now!");
        clearInterval(interval);
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${h}h ${m}m ${s}s`);
    }, 1000);
    return () => clearInterval(interval);
  }, [schedule]);

  function getNextOccurrence({ day, startTime }: Schedule): Date {
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const targetDayIndex = daysOfWeek.indexOf(day);
    const now = new Date();
    const todayIndex = now.getDay();
    let daysAhead = (targetDayIndex + 7 - todayIndex) % 7;
    const [hh, mm] = startTime.split(":").map(Number);
    const target = new Date(now);
    target.setHours(hh, mm, 0, 0);
    if (daysAhead === 0 && target <= now) daysAhead = 7; // next week if today already passed
    target.setDate(now.getDate() + daysAhead);
    return target;
  }

  if (!isSignedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Please <Link href="/sign-in" className="text-blue-500 underline">sign in</Link> to join the live class.</p>
      </div>
    );
  }

  const handleJoin = () => {
    if (!schedule) return;
    const date = new Date();
    const suffix = date.toISOString().split("T")[0];
    const name = `${schedule.roomPrefix}-${suffix}`;
    setRoomName(name);
    setShowJitsi(true);
  };

  return (
    <section className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-center mb-6">Live Class</h1>
      {schedule ? (
        <div className="text-center mb-8">
          <p className="text-lg">Every {schedule.day} at {schedule.startTime} (UTC)</p>
          <p className="text-xl font-mono mt-2">Starts in: {countdown}</p>
          <button
            className="mt-6 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg shadow hover:scale-105 transform transition"
            onClick={handleJoin}
          >
            Join Live Session
          </button>
        </div>
      ) : (
        <p className="text-center">Loading schedule...</p>
      )}
      {showJitsi && roomName && (
        <div className="mt-8 rounded-xl overflow-hidden shadow-lg border border-gray-700 bg-gray-900/80 backdrop-blur-md">
          <LiveJitsi 
            roomName={roomName} 
            userName={
              user?.publicMetadata?.role === "admin" || user?.primaryEmailAddress?.emailAddress === "femiadeleke2019@gmail.com"
                ? `${user?.fullName || "Guest"} (Anchor)`
                : (user?.fullName || "Guest")
            } 
          />
        </div>
      )}
    </section>
  );
}
