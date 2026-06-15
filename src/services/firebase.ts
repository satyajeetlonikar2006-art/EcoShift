import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, Firestore } from 'firebase/firestore';
import { getAnalytics, Analytics } from 'firebase/analytics';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
export const isMockMode = !apiKey || apiKey.startsWith('mock');

let appInstance: FirebaseApp;
let authInstance: Auth;
let dbInstance: Firestore;
let analyticsInstance: Analytics | null = null;

if (isMockMode) {
  appInstance = null as unknown as FirebaseApp;
  authInstance = null as unknown as Auth;
  dbInstance = null as unknown as Firestore;
} else {
  const firebaseConfig = {
    apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  // Initialize Firebase
  appInstance = initializeApp(firebaseConfig);

  // Initialize services
  authInstance = getAuth(appInstance);
  dbInstance = getFirestore(appInstance);

  // Initialize analytics conditionally, since it errors in node environments/emulators sometimes
  try {
    if (typeof window !== 'undefined') {
      analyticsInstance = getAnalytics(appInstance);
    }
  } catch (e) {
    console.warn("Analytics failed to initialize:", e);
  }

  // Connect to emulators in development if explicitly configured
  if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATOR === 'true') {
    try {
      if (!authInstance.emulatorConfig) {
        connectAuthEmulator(authInstance, 'http://localhost:9099', {
          disableWarnings: true,
        });
      }
    } catch (error) {
      // Emulator already connected
    }

    try {
      // Check settings before connecting
      connectFirestoreEmulator(dbInstance, 'localhost', 8080);
    } catch (error) {
      // Emulator already connected
    }
  }
}

export { appInstance as app, authInstance as auth, dbInstance as db, analyticsInstance as analytics };
export default appInstance;

