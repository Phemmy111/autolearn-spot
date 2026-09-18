"use client";

import { useState, useEffect } from 'react';
import { Video, Calendar, Clock, ExternalLink, Loader2 } from 'lucide-react';

interface LiveClass {
  id: string;
  title: string;
  description: string | null;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  meeting_url: string;
  learning_products: {
    id: string;
    title: string;
    thumbnail: string | null;
  };
}

export default function StudentLiveClassesPage() {
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLiveClasses();
  }, []);

  const fetchLiveClasses = async () => {
    try {
      const response = await fetch('/api/student/live-classes');
      const data = await response.json();
      if (data.success) {
        setLiveClasses(data.liveClasses);
      }
    } catch (error) {
      console.error('Error fetching live classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const upcomingClasses = liveClasses.filter(c => 
    c.status === 'SCHEDULED' && new Date(c.scheduled_start) > new Date()
  );
  const currentClasses = liveClasses.filter(c => c.status === 'LIVE');
  const pastClasses = liveClasses.filter(c => 
    c.status === 'ENDED' || new Date(c.scheduled_start) < new Date()
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-text mb-2">
          Live Classes
        </h1>
        <p className="text-brand-text/70">
          Join live sessions from your enrolled courses
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-brand-text/50 animate-spin" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Currently Live */}
          {currentClasses.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-brand-text mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                Live Now
              </h2>
              <div className="space-y-3">
                {currentClasses.map((liveClass) => (
                  <LiveClassCard key={liveClass.id} liveClass={liveClass} isLive />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Classes */}
          <div>
            <h2 className="text-lg font-semibold text-brand-text mb-4">
              Upcoming Classes
            </h2>
            {upcomingClasses.length === 0 ? (
              <div className="text-center py-8 text-brand-text/50">
                No upcoming live classes scheduled
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingClasses.map((liveClass) => (
                  <LiveClassCard key={liveClass.id} liveClass={liveClass} />
                ))}
              </div>
            )}
          </div>

          {/* Past Classes */}
          {pastClasses.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-brand-text mb-4">
                Past Classes
              </h2>
              <div className="space-y-3">
                {pastClasses.map((liveClass) => (
                  <LiveClassCard key={liveClass.id} liveClass={liveClass} isPast />
                ))}
              </div>
            </div>
          )}

          {liveClasses.length === 0 && (
            <div className="text-center py-12 text-brand-text/50">
              <Video className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">
                No live classes available for your enrolled courses
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LiveClassCard({ liveClass, isLive, isPast }: { liveClass: LiveClass; isLive?: boolean; isPast?: boolean }) {
  const startDate = new Date(liveClass.scheduled_start);
  const endDate = new Date(liveClass.scheduled_end);

  return (
    <div className="p-4 bg-[var(--card)] brightness-95 border border-brand-border rounded-lg">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-brand-text">{liveClass.title}</h3>
            {isLive && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700">
                LIVE
              </span>
            )}
            {isPast && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                ENDED
              </span>
            )}
          </div>
          <p className="text-sm text-brand-text/70 mb-2">
            {liveClass.learning_products.title}
          </p>
          {liveClass.description && (
            <p className="text-sm text-brand-text/60 mb-2">{liveClass.description}</p>
          )}
          <div className="flex items-center gap-4 text-xs text-brand-text/50">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {startDate.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              })}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {startDate.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
              })}
              {' - '}
              {endDate.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
              })}
            </div>
          </div>
        </div>
        {!isPast && (
          <a
            href={liveClass.meeting_url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
              isLive 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-sky-600 text-white hover:bg-sky-700'
            }`}
          >
            <Video className="w-3 h-3" />
            {isLive ? 'Join Now' : 'Join'}
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}