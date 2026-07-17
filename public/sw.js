// AURA — service worker (installabilité PWA + notifications push)

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handler fetch (requis pour l'installabilité) — on laisse passer normalement.
self.addEventListener('fetch', () => {});

// Réception d'une notification push
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { body: event.data && event.data.text ? event.data.text() : '' };
  }
  const title = data.title || 'AURA';
  const options = {
    body: data.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [90, 40, 90],
    data: { url: data.url || '/notifications' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Clic sur la notification -> ouvre/rapatrie l'app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/notifications';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    }),
  );
});
