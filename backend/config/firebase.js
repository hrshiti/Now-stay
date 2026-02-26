import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let firebaseAdmin = null;

/**
 * Resolve path to Firebase service account JSON.
 * Priority: FIREBASE_SERVICE_ACCOUNT_PATH > GOOGLE_APPLICATION_CREDENTIALS > legacy backend/serviceAccountKey.json
 * - Use FIREBASE_SERVICE_ACCOUNT_PATH in .env (dev: ./secrets/firebase-service-account.json, prod: /var/run/secrets/...)
 */
function getServiceAccountPath() {
  const envPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (envPath) {
    return path.isAbsolute(envPath) ? envPath : path.resolve(process.cwd(), envPath);
  }
  return path.join(__dirname, '../serviceAccountKey.json');
}

export const initializeFirebase = () => {
  try {
    const serviceAccountPath = getServiceAccountPath();

    if (!fs.existsSync(serviceAccountPath)) {
      throw new Error(
        `Firebase service account file not found at ${serviceAccountPath}. ` +
        'Set FIREBASE_SERVICE_ACCOUNT_PATH in .env (e.g. ./secrets/firebase-service-account.json or absolute path in production).'
      );
    }

    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

    // Initialize Firebase Admin
    if (!admin.apps.length) {
      firebaseAdmin = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
      });
      console.log('✓ Firebase Admin initialized successfully');
    } else {
      firebaseAdmin = admin.app();
    }

    return firebaseAdmin;
  } catch (error) {
    console.error('Firebase Admin initialization error:', error.message);
    // Don't throw error, allow server to continue without Firebase
    return null;
  }
};

// Get Firebase Admin instance
export const getFirebaseAdmin = () => {
  if (!firebaseAdmin) {
    initializeFirebase();
  }
  return firebaseAdmin;
};

export { admin };
