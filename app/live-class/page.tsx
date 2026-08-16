// app/live-class/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import LiveJitsi from "@/components/LiveJitsi";
import Link from "next/link";
import { getPublicSettings } from "@/lib/public-settings";

export default function LiveClassPage() {
  const { isSignedIn, user } = useUser();
  const [settings, setSettings] = useState({
    title: 'Live n8n Workshop',
    date: '',
    time: '20:00',
    timezone: 'WAT',
    url: '',
    description: 'Join our live workshop to learn n8n automation',
    joinButtonText: 'Join Class',
    countdownEnabled: 'true',
    recordingUrl: '',
    replayEnabled: 'false',
    status: 'scheduled',
  });
  const [showJitsi, setShowJitsi] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [countdown, setCountdown] = useState<string>("");
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const loadedSettings = await getPublicSettings([
          'live_class_title',
          'live_class_date',
          'live_class_time',
          'live_class_timezone',
          'live_class_url',
          'live_class_description',
          'live_class_join_button_text',
          'live_class_countdown_enabled',
          'live_class_recording_url',
          'live_class_replay_enabled',
          'live_class_status',
        ]);
        setSettings(loadedSettings);
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
    loadSettings();
  }, []);

  // Compute countdown from settings
  useEffect(() => {
    if (!settings.date || !settings.time) return;

    const interval = setInterval(() => {
      const now = new Date();
      const [date, time] = [settings.date, settings.time];
      const target = new Date(`${date}T${time}`);
      const diff = target.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdown("Live now!");
        setIsLive(true);
        clearInterval(interval);
        return;
      }

      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${h}h ${m}m ${s}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, [settings.date, settings.time]);

  if (!isSignedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Please <Link href="/sign-in" className="text-blue-500 underline">sign in</Link> to join the live class.</p>
      </div>
    );
  }

  const handleJoin = () => {
    // Generate a room name based on date and time
    const roomName = `autolearn-${settings.date.replace(/-/g, '')}-${settings.time.replace(/:/g, '')}`;
    setRoomName(roomName);
    setShowJitsi(true);
  };

  const userName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : user?.firstName || user?.lastName || user?.username || 'Student';

  return (
    <section className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-center mb-6">{settings.title}</h1>
      <p className="text-center mb-8 text-lg">{settings.description}</p>

      {showJitsi ? (
        <div className="mt-8">
          <LiveJitsi
            roomName={roomName}
            userName={userName}
            onReady={() => console.log('Jitsi ready')}
          />
        </div>
      ) : (
        <>
          {settings.date && settings.time ? (
            <div className="text-center mb-8">
              <p className="text-lg">{settings.date} at {settings.time} ({settings.timezone})</p>
              {settings.countdownEnabled === 'true' && (
                <p className="text-xl font-mono mt-2">Starts in: {countdown}</p>
              )}
              <button
                className="mt-6 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg shadow hover:scale-105 transform transition"
                onClick={handleJoin}
                disabled={!isLive}
              >
                {isLive ? 'Join Live Class' : settings.joinButtonText}
              </button>
              {!isLive && (
                <p className="text-sm text-gray-400 mt-2">Class is not live yet. Please wait for the scheduled time.</p>
              )}
            </div>
          ) : (
            <p className="text-center">Loading schedule...</p>
          )}
          {settings.status === 'replay' && settings.recordingUrl && settings.replayEnabled === 'true' && (
            <div className="text-center mt-8">
              <p className="text-lg mb-4">Recording Available</p>
              <a
                href={settings.recordingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg shadow hover:scale-105 transform transition"
              >
                Watch Recording
              </a>
            </div>
          )}
        </>
      )}
    </section>
  );
}
