import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize analytics conditionally, since it errors in node environments/emulators sometimes
let analyticsInstance: ReturnType<typeof getAnalytics> | null = null;
try {
  if (typeof window !== 'undefined') {
    analyticsInstance = getAnalytics(app);
  }
} catch (e) {
  console.warn("Analytics failed to initialize:", e);
}
export const analytics = analyticsInstance;

// Connect to emulators in development if explicitly configured
if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATOR === 'true') {
  try {
    if (!auth.emulatorConfig) {
      connectAuthEmulator(auth, 'http://localhost:9099', {
        disableWarnings: true,
      });
    }
  } catch (error) {
    // Emulator already connected
  }

  try {
    // Check settings before connecting
    connectFirestoreEmulator(db, 'localhost', 8080);
  } catch (error) {
    // Emulator already connected
  }
}

export default app;
