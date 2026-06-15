import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Firebase
vi.mock('@/services/firebase', () => ({
  auth: {
    currentUser: { uid: 'test-user' },
  },
  db: {},
  analytics: {},
  app: {},
  isMockMode: false,
}));


// Mock environment variables
import.meta.env.VITE_FIREBASE_API_KEY = 'test-key';
import.meta.env.VITE_FIREBASE_PROJECT_ID = 'test-project';
