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
        console.log('Initializing Firebase Messaging...');
        messaging = getMessaging(app);
      } catch (error) {
        console.error('Failed to initialize Firebase Messaging:', error);
      }
    }
    return messaging;
  }
  console.warn('Service Worker or window object not available for Messaging');
  return null;
};

export const requestNotificationPermission = async () => {
  try {
    console.log('FCM: Starting token request process...');

    if (!('Notification' in window)) {
      console.warn('FCM: Browser does not support notifications');
      return null;
    }

    console.log('FCM: Current permission status:', Notification.permission);
    const permission = await Notification.requestPermission();
    console.log('FCM: Permission result:', permission);

    if (permission === 'granted') {
      const messagingInstance = getMessagingInstance();
      if (!messagingInstance) {
        console.warn('FCM: Messaging instance is null');
        return null;
      }

      try {
        console.log('FCM: Registering Service Worker...');
        let swRegistration = null;

        try {
          swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          console.log('FCM: Service Worker registered:', swRegistration.scope);
        } catch (swError) {
          console.error('FCM: Service Worker registration failed:', swError);
        }

        console.log('FCM: Fetching token with VAPID key...');
        const tokenOptions = { vapidKey };
        if (swRegistration) {
          tokenOptions.serviceWorkerRegistration = swRegistration;
        }

        const token = await getToken(messagingInstance, tokenOptions);
        if (token) {
          console.log('FCM: Token successfully retrieved:', token);
          return token;
        } else {
          console.warn('FCM: No token received from Firebase. Check VAPID key and SW registration.');
        }
      } catch (error) {
        console.error('FCM: Error getting token:', error);
      }
    } else {
      console.warn('FCM: Permission was not granted by the user');
    }
    return null;
  } catch (error) {
    console.error('FCM: Error in requestNotificationPermission:', error);
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
