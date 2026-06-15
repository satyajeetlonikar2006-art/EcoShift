import React, { useState } from 'react';
import { signInAnonymously, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, isMockMode } from '@/services/firebase';
import { triggerMockAuthStateChange } from '@/hooks/useAuth';

interface LoginFormProps {
  authError: string | null;
}

/**
 * LoginForm component handling user login (email or guest session)
 * @param props - Component props containing external auth error message
 * @returns React component
 */
export function LoginForm({ authError }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const handleGuestLogin = async () => {
    setLoggingIn(true);
    setError(null);
    try {
      if (isMockMode) {
        await new Promise(resolve => setTimeout(resolve, 500));
        triggerMockAuthStateChange({
          uid: 'mock-guest-uid-123',
          email: 'guest@ecoshift.mock',
          isAnonymous: true,
          displayName: 'Guest User',
        });
      } else {
        await signInAnonymously(auth);
      }
    } catch (err) {
      console.error(err);
      setError('Guest login failed. Please ensure Firebase is running.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setError(null);
    try {
      if (isMockMode) {
        await new Promise(resolve => setTimeout(resolve, 500));
        triggerMockAuthStateChange({
          uid: 'mock-email-uid-123',
          email: email || 'demo@ecoshift.org',
          isAnonymous: false,
          displayName: 'Demo User',
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      console.error(err);
      setError('Authentication failed. Check your credentials or try Guest Login.');
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="card auth-card">
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '8px', fontFamily: 'Outfit, sans-serif' }}>EcoShift</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Track and offset your carbon footprint</p>
        </div>

        <form onSubmit={handleEmailLogin}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="demo@ecoshift.org"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p className="error" role="alert">{error}</p>}
          {authError && <p className="error" role="alert">{authError}</p>}

          <button type="submit" disabled={loggingIn}>
            {loggingIn ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div style={{ margin: '20px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          <span>or</span>
        </div>

        <button 
          onClick={handleGuestLogin} 
          disabled={loggingIn}
          style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
        >
          Sign In as Guest
        </button>
      </div>
    </div>
  );
}
