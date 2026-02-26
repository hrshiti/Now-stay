import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Firebase web config from env (VITE_FIREBASE_*) with fallback for same behaviour without .env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "AIzaSyBpo_CcO2CvlYrhbhqbKRbc8QnIF6RV6T4",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "nowstay-6b4fd.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "nowstay-6b4fd",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "nowstay-6b4fd.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "52925285490",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "1:52925285490:web:f8e5669f1c3369d2436eeb",
  measurementId: "G-H1T6QB3JLF"
};

const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY ?? "BNQrbFvI5-rvrXdb_4uHWQcskIuCnTRRbXxtn57n0j9-tIPtgVd86o9IEseLIoZckBNukgxOwYnDoSo3Kffbbxw";

const app = initializeApp(firebaseConfig);

let messaging = null;

const getMessagingInstance = () => {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    if (!messaging) {
      try {
        messaging = getMessaging(app);
      } catch (error) {
        console.error('Failed to initialize Firebase Messaging:', error);
      }
    }
    return messaging;
  }
  return null;
};

export const requestNotificationPermission = async () => {
  try {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const messagingInstance = getMessagingInstance();
      if (!messagingInstance) return null;

      try {
        const token = await getToken(messagingInstance, { vapidKey });
        if (token) {
          return token;
        } else {
          console.warn('No FCM token received');
        }
      } catch (error) {
        console.error('Error getting FCM token:', error);
      }
    } else {
      console.warn('Notification permission denied');
    }
    return null;
  } catch (error) {
    console.error('Error requesting permission:', error);
    return null;
  }
};

export const onMessageListener = (callback) => {
  const messagingInstance = getMessagingInstance();
  if (messagingInstance) {
    onMessage(messagingInstance, (payload) => {
      if (callback) callback(payload);
    });
  }
};

export default app;
