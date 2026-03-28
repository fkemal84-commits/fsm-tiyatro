self.addEventListener('push', (event) => {
  console.log('[SW] Push olayı alındı.');
  
  let data = { title: 'FSM Tiyatro', body: 'Yeni bir bildirim var.' };
  
  if (event.data) {
    try {
      data = event.data.json();
      console.log('[SW] Push verisi (JSON):', data);
    } catch (e) {
      console.log('[SW] Push verisi (Text):', event.data.text());
      data = { title: 'FSM Tiyatro', body: event.data.text() };
    }
  }

  // Eğer Firebase'den geliyorsa 'notification' objesi içinde olabilir
  const title = data.title || (data.notification && data.notification.title) || 'FSM Tiyatro';
  const body = data.body || (data.notification && data.notification.body) || 'Yeni duyuru yayında.';
  const url = data.url || (data.data && data.data.url) || '/';

  const options = {
    body: body,
    icon: '/logo.jpg',
    badge: '/logo.jpg',
    vibrate: [100, 50, 100],
    data: { url }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.openWindow(url)
  );
});

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});
