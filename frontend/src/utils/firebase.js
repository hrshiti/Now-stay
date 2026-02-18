import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDvZuIOlJce5MFqM7UdaPnMxnHggOVwUnA",
  authDomain: "rukkooin-39480.firebaseapp.com",
  projectId: "rukkooin-39480",
  storageBucket: "rukkooin-39480.firebasestorage.app",
  messagingSenderId: "463389493822",
  appId: "1:463389493822:web:79fa9aabcb1d88f6965f6f"
};

// VAPID KEY - Replace with yours from Firebase Console -> Cloud Messaging -> Web Configuration
const vapidKey = "BOF0yWdjH2UD1rGca-rOpwA2zrKW0Xy3ZmPmwH8KFTJcbXNJ5AHE8v4rM_xXUqW0fvd3SaZl_Qbnuazzc6lFdRM";

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
