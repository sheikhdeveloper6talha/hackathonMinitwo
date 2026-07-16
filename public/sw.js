// sw.js (WhatsApp jaisa dynamic parsing background worker - Cleaned Version)
self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push Received.');

  let payload = {
    title: 'Naya Alert!',
    body: 'System mein kuch tabdeeli hui hai.',
    url: '/'
  };

  if (event.data) {
    try {
      payload = event.data.json();
    } catch (e) {
      payload.body = event.data.text();
    }
  }

  const options = {
    body: payload.body,
    // Note: Humne icon aur badge ki 404 error wali lines yahan se hata di hain.
    vibrate: [200, 100, 200, 100, 200], // Mobile vibration pattern (like WhatsApp call/alert)
    tag: 'asset-issue-alert',     // Duplicate alerts collapse karne ke liye
    renotify: true,               // Naye alert par dubara shake karega
    requireInteraction: true,     // Desktop par jab tak user close na kare, notification screen par tange rahegi
    data: {
      url: payload.url || '/'
    },
    actions: [                    // Action buttons (WhatsApp options ki tarah)
      { action: 'open', title: '🔗 View Details' },
      { action: 'close', title: '❌ Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, options)
  );
});

// Notification click options handler
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function(clientList) {
      // Agar browser tab pehle se khula hai toh us par scroll kare, nahi toh naya tab khole
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});