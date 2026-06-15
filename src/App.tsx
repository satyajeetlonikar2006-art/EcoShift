import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Dashboard } from '@/components/Dashboard';
import { signInAnonymously, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/services/firebase';

function App() {
  const { user, loading, error: authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const handleGuestLogin = async () => {
    setLoggingIn(true);
    setError(null);
    const isMock = import.meta.env.VITE_FIREBASE_API_KEY?.startsWith('mock');
    try {
      if (isMock) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const { triggerMockAuthStateChange } = await import('@/hooks/useAuth');
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
    const isMock = import.meta.env.VITE_FIREBASE_API_KEY?.startsWith('mock');
    try {
      if (isMock) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const { triggerMockAuthStateChange } = await import('@/hooks/useAuth');
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

  if (loading) {
    return (
      <div className="auth-container">
        <div className="card auth-card" style={{ textAlign: 'center' }}>
          <h2>EcoShift</h2>
          <p>Connecting to secure services...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div>
        <nav style={{ padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-surface)' }}>
          <button
            style={{ width: 'auto', padding: '8px 16px' }}
            onClick={async () => {
              const isMock = import.meta.env.VITE_FIREBASE_API_KEY?.startsWith('mock');
              if (isMock) {
                const { triggerMockAuthStateChange } = await import('@/hooks/useAuth');
                triggerMockAuthStateChange(null);
              } else {
                await auth.signOut();
              }
            }}
          >
            Sign Out
          </button>
        </nav>
        <Dashboard />
      </div>
    );
  }

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

export default App;
