/* eslint-env serviceworker, webworker */
/* global firebase, importScripts */
// Import and configure the Firebase SDK
// These scripts are made available when the app is served or deployed on Firebase Hosting
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

// Initialize Firebase
firebase.initializeApp({
  apiKey: "AIzaSyDvZuIOlJce5MFqM7UdaPnMxnHggOVwUnA",
  authDomain: "rukkooin-39480.firebaseapp.com",
  projectId: "rukkooin-39480",
  storageBucket: "rukkooin-39480.firebasestorage.app",
  messagingSenderId: "463389493822",
  appId: "1:463389493822:web:79fa9aabcb1d88f6965f6f"
});

// Retrieve an instance of Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.notification?.title || 'Rukkoin';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    data: payload.data || {},
    tag: payload.data?.tag || 'default',
    requireInteraction: false,
    silent: false,
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received.');

  event.notification.close();

  // Get the URL from notification data or default to root
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
