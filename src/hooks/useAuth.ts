import { useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth, isMockMode } from '@/services/firebase';

// Mock state management for offline preview mode
let mockUserListeners: Array<(user: any) => void> = [];
let currentMockUser: any = null;

try {
  const storedUser = localStorage.getItem('ecoshift_mock_user');
  if (storedUser) {
    currentMockUser = JSON.parse(storedUser);
  }
} catch (e) {
  // ignore
}

export const triggerMockAuthStateChange = (user: any) => {
  currentMockUser = user;
  if (user) {
    localStorage.setItem('ecoshift_mock_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('ecoshift_mock_user');
  }
  mockUserListeners.forEach(listener => listener(user));
};

export function useAuth() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isMockMode) {
      const listener = (u: any) => {
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
      user => {
        setUser(user);
        setLoading(false);
      },
      error => {
        console.error('Auth error:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  return { user, loading, error };
}
