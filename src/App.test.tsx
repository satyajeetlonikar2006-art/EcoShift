import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock useAuth hook
const mockUseAuth = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
  triggerMockAuthStateChange: vi.fn(),
}));

// Mock Dashboard component to isolate App logic
vi.mock('@/components/Dashboard', () => ({
  Dashboard: () => <div data-testid="dashboard">Dashboard Content</div>,
}));

// Mock LoginForm to isolate App routing logic
vi.mock('@/components/LoginForm', () => ({
  LoginForm: ({ authError }: { authError: string | null }) => (
    <div data-testid="login-form">
      {authError && <p role="alert">{authError}</p>}
      Login Form
    </div>
  ),
}));

// Mock firebase service
vi.mock('@/services/firebase', () => ({
  auth: {
    currentUser: null,
    signOut: vi.fn(),
  },
  db: {},
  analytics: {},
  app: {},
  isMockMode: false,
}));

const mockUser = { uid: 'user-123', email: 'test@ecoshift.org' };

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading state', () => {
    it('shows loading state initially', () => {
      mockUseAuth.mockReturnValue({ user: null, loading: true, error: null });
      render(<App />);
      expect(screen.getByText('Connecting to secure services...')).toBeInTheDocument();
    });

    it('does not show login form when loading', () => {
      mockUseAuth.mockReturnValue({ user: null, loading: true, error: null });
      render(<App />);
      expect(screen.queryByTestId('login-form')).not.toBeInTheDocument();
    });

    it('does not show Dashboard when loading', () => {
      mockUseAuth.mockReturnValue({ user: null, loading: true, error: null });
      render(<App />);
      expect(screen.queryByTestId('dashboard')).not.toBeInTheDocument();
    });
  });

  describe('Unauthenticated state', () => {
    it('shows LoginForm when not authenticated', () => {
      mockUseAuth.mockReturnValue({ user: null, loading: false, error: null });
      render(<App />);
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });

    it('passes authError to LoginForm', () => {
      mockUseAuth.mockReturnValue({ user: null, loading: false, error: 'Auth service unavailable' });
      render(<App />);
      expect(screen.getByRole('alert')).toHaveTextContent('Auth service unavailable');
    });
  });

  describe('Authenticated state', () => {
    it('shows Dashboard when user is authenticated', () => {
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false, error: null });
      render(<App />);
      expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    });

    it('shows Sign Out button when authenticated', () => {
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false, error: null });
      render(<App />);
      expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
    });

    it('does not show login form when authenticated', () => {
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false, error: null });
      render(<App />);
      expect(screen.queryByTestId('login-form')).not.toBeInTheDocument();
    });

    it('calls signOut on sign out button click', async () => {
      const { auth } = await import('@/services/firebase');
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false, error: null });
      const user = userEvent.setup();
      render(<App />);

      await user.click(screen.getByRole('button', { name: /sign out/i }));
      expect(auth.signOut).toHaveBeenCalled();
    });
  });
});
