/* eslint-env serviceworker, webworker */
/* global firebase, importScripts */

// Firebase SDKs for the service worker
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBpo_CcO2CvlYrhbhqbKRbc8QnIF6RV6T4",
  authDomain: "nowstay-6b4fd.firebaseapp.com",
  projectId: "nowstay-6b4fd",
  storageBucket: "nowstay-6b4fd.firebasestorage.app",
  messagingSenderId: "52925285490",
  appId: "1:52925285490:web:f8e5669f1c3369d2436eeb"
});

const messaging = firebase.messaging();

/**
 * BACKGROUND MESSAGES
 * Fires when the browser tab is closed/hidden (service worker context).
 * This is ONLY for web browser users — Flutter app users receive notifications
 * natively through the Flutter FCM plugin, not through this service worker.
 *
 * We use a `tag` derived from the notification title to prevent OS-level
 * duplicate notifications if FCM delivers the same message twice.
 */
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Received background message:', payload);

  const title = payload.notification?.title || 'NowStayIn';
  const body = payload.notification?.body || '';
  const data = payload.data || {};

  // Tag deduplication: prevents duplicate system notifications for the same event.
  // If a notification with the same tag is already shown, it gets replaced (not doubled).
  const tag = data.notificationId || data.tag || `${title}-${Date.now()}`;

  const options = {
    body,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag,                       // Deduplication key at OS level
    renotify: false,           // Don't re-vibrate if replacing same tag
    requireInteraction: false,
    silent: false,
    data: {
      url: data.url || '/',    // URL to open on click
      ...data
    }
  };

  return self.registration.showNotification(title, options);
});

/**
 * NOTIFICATION CLICK HANDLER
 * When the user taps a background notification, open/focus the app.
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification);

  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';
  // Make the URL absolute — service workers need full URLs for openWindow
  const absoluteUrl = urlToOpen.startsWith('http')
    ? urlToOpen
    : (self.location.origin + urlToOpen);

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus an existing tab if one is already on the target URL
      for (const client of clientList) {
        if (client.url === absoluteUrl && 'focus' in client) {
          return client.focus();
        }
      }
      // Focus any existing tab on the origin (navigate it)
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          client.navigate(absoluteUrl);
          return client.focus();
        }
      }
      // No existing tab — open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(absoluteUrl);
      }
    })
  );
});
