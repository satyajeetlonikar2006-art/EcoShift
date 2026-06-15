import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

// Mock useAuth hook
const mockUseAuth = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock Dashboard component to isolate App logic
vi.mock('@/components/Dashboard', () => ({
  Dashboard: () => <div data-testid="dashboard">Dashboard Content</div>,
}));

// Mock firebase/auth functions
const mockSignInAnonymously = vi.fn();
const mockSignInWithEmailAndPassword = vi.fn();
vi.mock('firebase/auth', () => ({
  signInAnonymously: (...args: any[]) => mockSignInAnonymously(...args),
  signInWithEmailAndPassword: (...args: any[]) => mockSignInWithEmailAndPassword(...args),
  onAuthStateChanged: vi.fn(),
}));

// Mock firebase service (auth object)
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

function setup() {
  const user = userEvent.setup();
  const utils = render(<App />);
  return { user, ...utils };
}

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignInAnonymously.mockResolvedValue({});
    mockSignInWithEmailAndPassword.mockResolvedValue({});
  });

  describe('Loading state', () => {
    it('shows loading state initially', () => {
      mockUseAuth.mockReturnValue({ user: null, loading: true, error: null });

      setup();

      expect(screen.getByText('EcoShift')).toBeInTheDocument();
      expect(screen.getByText('Connecting to secure services...')).toBeInTheDocument();
    });

    it('does not show login form when loading', () => {
      mockUseAuth.mockReturnValue({ user: null, loading: true, error: null });

      setup();

      expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();
    });

    it('does not show Dashboard when loading', () => {
      mockUseAuth.mockReturnValue({ user: null, loading: true, error: null });

      setup();

      expect(screen.queryByTestId('dashboard')).not.toBeInTheDocument();
    });
  });

  describe('Login form (unauthenticated)', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ user: null, loading: false, error: null });
    });

    it('shows login form when not authenticated', () => {
      setup();

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('shows EcoShift branding on login page', () => {
      setup();

      expect(screen.getByText('EcoShift')).toBeInTheDocument();
      expect(screen.getByText(/track and offset your carbon footprint/i)).toBeInTheDocument();
    });

    it('email input has required attribute', () => {
      setup();

      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toBeRequired();
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('password input has required attribute', () => {
      setup();

      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toBeRequired();
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('has a Sign In submit button', () => {
      setup();

      expect(screen.getByRole('button', { name: /sign in$/i })).toBeInTheDocument();
    });

    it('has a Guest login button', () => {
      setup();

      expect(screen.getByRole('button', { name: /sign in as guest/i })).toBeInTheDocument();
    });
  });

  describe('Email login', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ user: null, loading: false, error: null });
    });

    it('calls signInWithEmailAndPassword on form submit', async () => {
      const { user } = setup();

      await user.type(screen.getByLabelText(/email/i), 'test@ecoshift.org');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in$/i }));

      await waitFor(() => {
        expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
          expect.anything(), // auth object
          'test@ecoshift.org',
          'password123'
        );
      });
    });

    it('shows error on failed email login', async () => {
      mockSignInWithEmailAndPassword.mockRejectedValueOnce(new Error('Invalid credentials'));
      const { user } = setup();

      await user.type(screen.getByLabelText(/email/i), 'bad@email.com');
      await user.type(screen.getByLabelText(/password/i), 'wrongpass');
      await user.click(screen.getByRole('button', { name: /sign in$/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/authentication failed/i)
        ).toBeInTheDocument();
      });
    });

    it('displays login error with role="alert"', async () => {
      mockSignInWithEmailAndPassword.mockRejectedValueOnce(new Error('fail'));
      const { user } = setup();

      await user.type(screen.getByLabelText(/email/i), 'bad@email.com');
      await user.type(screen.getByLabelText(/password/i), 'wrong');
      await user.click(screen.getByRole('button', { name: /sign in$/i }));

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toHaveTextContent(/authentication failed/i);
      });
    });

    it('shows "Signing In..." on submit button during login', async () => {
      let resolveLogin: (value: any) => void;
      mockSignInWithEmailAndPassword.mockReturnValueOnce(
        new Promise(resolve => {
          resolveLogin = resolve;
        })
      );

      const { user } = setup();

      await user.type(screen.getByLabelText(/email/i), 'test@test.com');
      await user.type(screen.getByLabelText(/password/i), 'pass');
      await user.click(screen.getByRole('button', { name: /sign in$/i }));

      await waitFor(() => {
        expect(screen.getByText('Signing In...')).toBeInTheDocument();
      });

      resolveLogin!({});
    });
  });

  describe('Guest login', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ user: null, loading: false, error: null });
    });

    it('calls signInAnonymously on guest login click', async () => {
      const { user } = setup();

      await user.click(screen.getByRole('button', { name: /sign in as guest/i }));

      await waitFor(() => {
        expect(mockSignInAnonymously).toHaveBeenCalled();
      });
    });

    it('shows error on failed guest login', async () => {
      mockSignInAnonymously.mockRejectedValueOnce(new Error('Firebase down'));
      const { user } = setup();

      await user.click(screen.getByRole('button', { name: /sign in as guest/i }));

      await waitFor(() => {
        expect(screen.getByText(/guest login failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Authenticated state', () => {
    it('shows Dashboard when user is authenticated', () => {
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false, error: null });

      setup();

      expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    });

    it('does not show login form when authenticated', () => {
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false, error: null });

      setup();

      expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();
    });

    it('shows a Sign Out button when authenticated', () => {
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false, error: null });

      setup();

      expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
    });

    it('calls auth.signOut when Sign Out button is clicked', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false, error: null });
      const { user } = setup();

      const signOutButton = screen.getByRole('button', { name: /sign out/i });
      await user.click(signOutButton);

      const { auth } = await import('@/services/firebase');
      expect(auth.signOut).toHaveBeenCalled();
    });
  });

  describe('Auth error display', () => {
    it('displays authError from useAuth hook', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        error: 'Auth service unavailable',
      });

      setup();

      expect(screen.getByText('Auth service unavailable')).toBeInTheDocument();
    });

    it('displays authError with role="alert"', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        error: 'Connection failed',
      });

      setup();

      const alerts = screen.getAllByRole('alert');
      const authAlert = alerts.find(a => a.textContent === 'Connection failed');
      expect(authAlert).toBeDefined();
    });
  });
});
