// components/LiveJitsi.tsx
'use client';

import { useEffect } from 'react';

interface LiveJitsiProps {
  roomName: string;
  userName: string;
  onReady?: () => void;
}

export default function LiveJitsi({ roomName, userName, onReady }: LiveJitsiProps) {
  useEffect(() => {
    // Open Jitsi in a new tab automatically
    const jitsiUrl = `https://meet.jit.si/${roomName}?config.startWithAudioMuted=false&config.startWithVideoMuted=false&userInfo.displayName=${encodeURIComponent(userName)}`;
    window.open(jitsiUrl, '_blank');

    if (onReady) {
      onReady();
    }
  }, [roomName, userName, onReady]);

  return (
    <div className="w-full h-[70vh] rounded-lg overflow-hidden flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <p className="text-gray-600 mb-4">Live class has been opened in a new tab</p>
        <button
          onClick={() => {
            const jitsiUrl = `https://meet.jit.si/${roomName}?config.startWithAudioMuted=false&config.startWithVideoMuted=false&userInfo.displayName=${encodeURIComponent(userName)}`;
            window.open(jitsiUrl, '_blank');
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Open Live Class Again
        </button>
      </div>
    </div>
  );
}
