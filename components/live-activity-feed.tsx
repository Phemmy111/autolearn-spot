'use client';

import { useState, useEffect } from 'react';
import { Sparkles, UserPlus, DollarSign, Award, CheckCircle } from 'lucide-react';

interface Activity {
  id: string;
  type: 'enrollment' | 'scholarship' | 'commission' | 'partner' | 'withdrawal';
  message: string;
  time: string;
}

const demoActivities: Activity[] = [
  {
    id: '1',
    type: 'enrollment',
    message: 'Naheemot from Ibadan just enrolled',
    time: '2 minutes ago'
  },
  {
    id: '2',
    type: 'scholarship',
    message: 'Ruth from Imo applied for scholarship',
    time: '5 minutes ago'
  },
  {
    id: '3',
    type: 'commission',
    message: 'Emmanuel received ₦2,500 partner commission',
    time: '8 minutes ago'
  },
  {
    id: '4',
    type: 'partner',
    message: 'David became a Community Partner',
    time: '12 minutes ago'
  },
  {
    id: '5',
    type: 'withdrawal',
    message: 'A withdrawal request was approved',
    time: '15 minutes ago'
  }
];

const getActivityIcon = (type: Activity['type']) => {
  switch (type) {
    case 'enrollment':
      return <UserPlus className="h-4 w-4 text-[#00f0ff]" />;
    case 'scholarship':
      return <Award className="h-4 w-4 text-purple-400" />;
    case 'commission':
      return <DollarSign className="h-4 w-4 text-green-400" />;
    case 'partner':
      return <Sparkles className="h-4 w-4 text-yellow-400" />;
    case 'withdrawal':
      return <CheckCircle className="h-4 w-4 text-blue-400" />;
    default:
      return <Sparkles className="h-4 w-4 text-[#00f0ff]" />;
  }
};

export function LiveActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>(demoActivities);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activities.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [activities.length]);

  const currentActivity = activities[currentIndex];

  return (
    <div className="border border-[#1f2229] bg-[#0c0e12]/80 backdrop-blur-xl rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-2 w-2 rounded-full bg-[#00f0ff] animate-pulse" />
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#00f0ff]">
          Live Activity
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center border border-[#1f2229] bg-[#111317] rounded-lg">
          {getActivityIcon(currentActivity.type)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[#e2e2e8] truncate">{currentActivity.message}</p>
          <p className="text-xs text-[#5d5f63] mt-1">{currentActivity.time}</p>
        </div>
      </div>
    </div>
  );
}