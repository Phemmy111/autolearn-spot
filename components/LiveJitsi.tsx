// components/LiveJitsi.tsx
'use client';

import { useEffect, useRef } from 'react';

interface LiveJitsiProps {
  roomName: string;
  userName: string;
  onReady?: () => void;
}

export default function LiveJitsi({ roomName, userName, onReady }: LiveJitsiProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<any>(null);

  useEffect(() => {
    // Load Jitsi script only once
    const loadScript = () => {
      return new Promise<void>((resolve, reject) => {
        if ((window as any).JitsiMeetExternalAPI) {
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://meet.jit.si/external_api.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Jitsi script'));
        document.body.appendChild(script);
      });
    };

    if (!containerRef.current) return;

    loadScript()
      .then(() => {
        const domain = 'meet.jit.si';
        const options = {
          roomName,
          parentNode: containerRef.current,
          interfaceConfigOverwrite: {
            // Enable screen sharing for all participants
            TOOLBAR_BUTTONS: [
              'microphone',
              'camera',
              'desktop', // screen share
              'chat',
              'raisehand',
              'hangup',
            ],
            SETTINGS_SECTIONS: ['devices', 'language', 'profile'],
          },
          userInfo: {
            displayName: userName,
          },
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            // Enable recording (Jitsi can record if the server supports it)
            // For the public meet.jit.si server, recordings are stored externally via Jibri.
            // We'll just enable the button; actual recording storage is handled by Jitsi.
            enableRecording: true,
          },
        };
        // @ts-ignore – JitsiMeetExternalAPI is added dynamically
        jitsiApiRef.current = new (window as any).JitsiMeetExternalAPI(domain, options);
        jitsiApiRef.current.addEventListener('videoConferenceJoined', () => {
          if (onReady) onReady();
        });
      })
      .catch((err) => {
        console.error(err);
      });

    return () => {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
      }
    };
  }, [roomName, userName]);

  return <div ref={containerRef} className="w-full h-[70vh] rounded-lg overflow-hidden" />;
}
