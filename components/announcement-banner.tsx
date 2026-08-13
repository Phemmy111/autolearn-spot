"use client";

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface Announcement {
  id: string;
  text: string;
  cta_text: string;
  cta_link: string;
  display_position: string;
  display_type: string;
}

export function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Load dismissed from localStorage
    const saved = localStorage.getItem('dismissed-announcements');
    if (saved) {
      setDismissed(JSON.parse(saved));
    }

    async function fetchAnnouncements() {
      try {
        const res = await fetch('/api/content/announcements?enabled=true&position=top');
        if (res.ok) {
          const data = await res.json();
          setAnnouncements(data.announcements || []);
          setVisible((data.announcements || []).length > 0);
        }
      } catch (error) {
        console.error('Failed to fetch announcements:', error);
      }
    }
    fetchAnnouncements();
  }, []);

  const activeAnnouncement = announcements.find(a => !dismissed.includes(a.id));

  if (!activeAnnouncement || !visible) return null;

  const handleDismiss = () => {
    setDismissed([...dismissed, activeAnnouncement.id]);
    localStorage.setItem('dismissed-announcements', JSON.stringify([...dismissed, activeAnnouncement.id]));
    setVisible(false);
  };

  return (
    <div className="relative z-50 bg-gradient-to-r from-[#00f0ff]/20 to-[#8b5cf6]/20 border-b border-[#00f0ff]/30">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <p className="text-sm text-[#e2e2e8] font-medium flex-1">
            {activeAnnouncement.text}
          </p>
          {activeAnnouncement.cta_text && activeAnnouncement.cta_link && (
            <a
              href={activeAnnouncement.cta_link}
              className="text-sm text-[#00f0ff] font-semibold hover:underline whitespace-nowrap"
            >
              {activeAnnouncement.cta_text}
            </a>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className="ml-4 text-[#b9cacb] hover:text-white transition-colors"
          aria-label="Dismiss announcement"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}