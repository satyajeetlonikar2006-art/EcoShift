import { useCallback } from 'react';
import { useAuth, triggerMockAuthStateChange } from '@/hooks/useAuth';
import { Dashboard } from '@/components/Dashboard';
import { LoginForm } from '@/components/LoginForm';
import { auth, isMockMode } from '@/services/firebase';

/**
 * Root Application Component
 * Handles global loading state, authentication routing, and sign-out navigation.
 * Provides a skip-to-content link for keyboard accessibility.
 * @returns React component
 */
function App() {
  const { user, loading, error: authError } = useAuth();

  const handleSignOut = useCallback(async (): Promise<void> => {
    if (isMockMode) {
      triggerMockAuthStateChange(null);
    } else {
      await auth.signOut();
    }
  }, []);

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
      <>
        {/* Skip navigation link for screen readers and keyboard users */}
        <a
          href="#main-content"
          className="sr-only"
          style={{ position: 'absolute', top: '-999px' }}
          onFocus={e => { (e.currentTarget as HTMLAnchorElement).style.top = '8px'; }}
          onBlur={e => { (e.currentTarget as HTMLAnchorElement).style.top = '-999px'; }}
        >
          Skip to main content
        </a>

        <nav
          aria-label="Application navigation"
          style={{
            padding: '16px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--bg-surface)',
          }}
        >
          <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '1.1rem' }}>
            🌿 EcoShift
          </span>
          <button
            style={{ width: 'auto', padding: '8px 16px' }}
            onClick={handleSignOut}
            aria-label="Sign out of EcoShift"
          >
            Sign Out
          </button>
        </nav>

        <div id="main-content">
          <Dashboard />
        </div>
      </>
    );
  }

  return <LoginForm authError={authError} />;
}

export default App;
