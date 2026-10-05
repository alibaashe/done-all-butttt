// Service Worker for Wadaage Taxi PWA
const CACHE_NAME = 'wadaage-taxi-v3';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Create the MAX-importance "new ride orders" channel on Android by posting a
// notification onto it once at startup. The channel keeps its loud alarm sound
// afterwards, so later order notifications ring even on a locked phone.
self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type !== 'ENSURE_ORDER_CHANNEL' || !data.channel) return;
  try {
    self.registration
      .showNotification('Ready for orders', {
        tag: 'wadaage-channel-bootstrap',
        body: 'Wadaage is ready to receive ride orders.',
        silent: true,
        channelId: data.channel.id,
      })
      .then(() => self.registration.getNotifications({ tag: 'wadaage-channel-bootstrap' }))
      .then((list) => list.forEach((n) => n.close()))
      .catch(() => {});
  } catch (_e) {}
});

// Background Push Notification Event
self.addEventListener('push', (event) => {
  let data = {
    title: '🚨 DALAB CUSUB! NEW RIDE ORDER',
    body: 'Dalab rakaab cusub ayaa soo gaadhay taleefankaaga.',
    icon: '/darwelllogo.png',
    badge: '/darwelllogo.png',
    vibrate: [800, 200, 800, 200, 1000, 200, 1000],
    data: { url: '/driver' }
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (_e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/darwelllogo.png',
    badge: data.badge || '/darwelllogo.png',
    image: data.image || '/darwelllogo.png',
    vibrate: data.vibrate || [800, 200, 800, 200, 1000, 200, 1000],
    tag: 'wadaage-order-' + Date.now(),
    renotify: true,
    requireInteraction: true,
    // Android-only: route to the loud alarm channel so it rings on a locked phone.
    channelId: data.channelId || 'wadaage-orders-urgent',
    data: data.data || { url: '/driver' },
    actions: [
      { action: 'open_order', title: '🚖 Fur Dalabka (Open)' },
      { action: 'dismiss', title: 'Xidh (Dismiss)' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification Click Handler - Focus or Open App Tab
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/driver';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          try {
            client.postMessage({ type: 'WAKE_AND_OPEN_ORDER', url: targetUrl });
          } catch (_e) {}
          if ('navigate' in client && targetUrl) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
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
