import { useAuth, triggerMockAuthStateChange } from '@/hooks/useAuth';
import { Dashboard } from '@/components/Dashboard';
import { LoginForm } from '@/components/LoginForm';
import { auth, isMockMode } from '@/services/firebase';

/**
 * Root Application Component
 * Handles global loading state, authentication routing, and the global sign-out header
 * @returns React component
 */
function App() {
  const { user, loading, error: authError } = useAuth();

  const handleSignOut = async () => {
    if (isMockMode) {
      triggerMockAuthStateChange(null);
    } else {
      await auth.signOut();
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
        <nav
          style={{
            padding: '16px 24px',
            display: 'flex',
            justifyContent: 'flex-end',
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--bg-surface)',
          }}
        >
          <button
            style={{ width: 'auto', padding: '8px 16px' }}
            onClick={handleSignOut}
          >
            Sign Out
          </button>
        </nav>
        <Dashboard />
      </div>
    );
  }

  return <LoginForm authError={authError} />;
}

export default App;
