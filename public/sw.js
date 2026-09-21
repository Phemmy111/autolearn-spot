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
  let notificationData = {
    title: 'AutoLearn Spot',
    body: 'You have a new message',
    icon: '/autolearn-brandmark.png',
    badge: '/autolearn-brandmark.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
  };

  // Parse the notification data
  if (event.data) {
    try {
      const data = JSON.parse(event.data.text());
      notificationData = {
        ...notificationData,
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        data: {
          ...notificationData.data,
          ...data.data,
        },
      };
    } catch (e) {
      // If parsing fails, use the text as body
      notificationData.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/', '_blank')
  );
});
