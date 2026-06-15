import { useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth, isMockMode } from '@/services/firebase';

/** Minimal mock user shape matching the subset of FirebaseUser we use */
interface MockUser {
  uid: string;
  email: string | null;
  isAnonymous?: boolean;
  displayName?: string;
}

// Mock state management for offline preview mode
let mockUserListeners: Array<(user: FirebaseUser | null) => void> = [];
let currentMockUser: FirebaseUser | null = null;

try {
  const storedUser = localStorage.getItem('ecoshift_mock_user');
  if (storedUser) {
    currentMockUser = JSON.parse(storedUser) as FirebaseUser;
  }
} catch {
  // ignore corrupted stored data
}

/**
 * Triggers a mock auth state change for offline/demo mode
 * @param user - The mock user object or null for sign-out
 */
export const triggerMockAuthStateChange = (user: MockUser | null): void => {
  currentMockUser = user as FirebaseUser | null;
  if (user) {
    localStorage.setItem('ecoshift_mock_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('ecoshift_mock_user');
  }
  mockUserListeners.forEach(listener => listener(currentMockUser));
};

/**
 * Custom hook for authentication state management.
 * Supports both Firebase Auth and a local mock mode for offline preview.
 * @returns Object containing user, loading state, and error message
 */
export function useAuth(): { user: FirebaseUser | null; loading: boolean; error: string | null } {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isMockMode) {
      const listener = (u: FirebaseUser | null): void => {
        setUser(u);
        setLoading(false);
      };
      mockUserListeners.push(listener);
      // Immediately call with the current user state
      listener(currentMockUser);
      return () => {
        mockUserListeners = mockUserListeners.filter(l => l !== listener);
      };
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      firebaseUser => {
        setUser(firebaseUser);
        setLoading(false);
      },
      authError => {
        console.error('Auth error:', authError);
        setError(authError.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  return { user, loading, error };
}
