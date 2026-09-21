"use client";

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
      navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      }).then((registration) => {
        console.log('Service Worker registered with scope:', registration.scope);
      }).catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
    }
  }, []);

  return null;
}
