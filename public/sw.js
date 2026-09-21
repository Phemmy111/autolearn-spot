const CACHE_NAME = 'autolearn-spot-v1';
const urlsToCache = ['/', '/author/messages', '/student/messages'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Handle push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data?.text(),
    icon: '/autolearn-brandmark.png',
    badge: '/autolearn-brandmark.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
  },
  };

  event.waitUntil(
    self.registration.showNotification('AutoLearn Spot', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/', '_blank')
  );
});
