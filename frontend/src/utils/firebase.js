import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBpo_CcO2CvlYrhbhqbKRbc8QnIF6RV6T4",
  authDomain: "nowstay-6b4fd.firebaseapp.com",
  projectId: "nowstay-6b4fd",
  storageBucket: "nowstay-6b4fd.firebasestorage.app",
  messagingSenderId: "52925285490",
  appId: "1:52925285490:web:f8e5669f1c3369d2436eeb",
  measurementId: "G-H1T6QB3JLF"
};

// VAPID KEY - Replace with yours from Firebase Console -> Cloud Messaging -> Web Configuration
const vapidKey = "BNQrbFvI5-rvrXdb_4uHWQcskIuCnTRRbXxtn57n0j9-tIPtgVd86o9IEseLIoZckBNukgxOwYnDoSo3Kffbbxw";

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
