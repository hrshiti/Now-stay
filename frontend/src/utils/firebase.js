import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { isWebView } from './deviceDetect';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBpo_CcO2CvlYrhbhqbKRbc8QnIF6RV6T4",
  authDomain: "nowstay-6b4fd.firebaseapp.com",
  projectId: "nowstay-6b4fd",
  storageBucket: "nowstay-6b4fd.firebasestorage.app",
  messagingSenderId: "52925285490",
  appId: "1:52925285490:web:f8e5669f1c3369d2436eeb",
  measurementId: "G-H1T6QB3JLF"
};

const VAPID_KEY = "BNQrbFvI5-rvrXdb_4uHWQcskIuCnTRRbXxtn57n0j9-tIPtgVd86o9IEseLIoZckBNukgxOwYnDoSo3Kffbbxw";

const app = initializeApp(firebaseConfig);

let messaging = null;

const getMessagingInstance = () => {
  // Firebase Web Messaging requires serviceWorker support.
  // Flutter WebViews do NOT support service workers, so skip in that context.
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && !isWebView()) {
    if (!messaging) {
      try {
        messaging = getMessaging(app);
      } catch (error) {
        console.error('[Firebase] Failed to initialize Firebase Messaging:', error);
      }
    }
    return messaging;
  }
  return null;
};

/**
 * Request notification permission and get the web FCM token.
 * ONLY works in a real browser — NOT in Flutter WebView (WebViews don't support
 * the Push API / service workers needed for web push).
 *
 * For Flutter WebView users, FCM tokens are registered directly by the Flutter
 * native code hitting /api/users/fcm-token or /api/partners/fcm-token with platform='app'.
 */
export const requestNotificationPermission = async () => {
  try {
    // Skip completely if running inside a Flutter WebView
    if (isWebView()) {
      console.log('[FCM] Running in Flutter WebView — skipping web push registration (handled natively by Flutter).');
      return null;
    }

    if (!('Notification' in window)) {
      console.warn('[FCM] This browser does not support notifications.');
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('[FCM] Notification permission denied.');
      return null;
    }

    const messagingInstance = getMessagingInstance();
    if (!messagingInstance) {
      console.warn('[FCM] Could not get messaging instance (possibly in WebView or incompatible browser).');
      return null;
    }

    try {
      const token = await getToken(messagingInstance, { vapidKey: VAPID_KEY });
      if (token) {
        console.log('[FCM] Web push token obtained.');
        return token;
      } else {
        console.warn('[FCM] No FCM token received — service worker may not be registered.');
        return null;
      }
    } catch (error) {
      console.error('[FCM] Error getting FCM token:', error);
      return null;
    }
  } catch (error) {
    console.error('[FCM] Error requesting permission:', error);
    return null;
  }
};

/**
 * Listen for foreground messages (browser tab is open and in focus).
 * Only active in real browser — not in Flutter WebView.
 * In Flutter WebView, the native Flutter code handles FCM messages.
 */
export const onMessageListener = (callback) => {
  // Skip in WebView — Flutter native handles foreground messages there
  if (isWebView()) return;

  const messagingInstance = getMessagingInstance();
  if (messagingInstance) {
    onMessage(messagingInstance, (payload) => {
      if (callback) callback(payload);
    });
  }
};

export default app;
