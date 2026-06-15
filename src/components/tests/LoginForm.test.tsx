import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '../LoginForm';
import { describe, it, expect, vi, beforeEach } from 'vitest';

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

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignInAnonymously.mockResolvedValue({});
    mockSignInWithEmailAndPassword.mockResolvedValue({});
  });

  it('shows login form inputs and submit buttons', () => {
    render(<LoginForm authError={null} />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in as guest/i })).toBeInTheDocument();
  });

  it('displays authError when passed as a prop', () => {
    render(<LoginForm authError="Invalid API Key" />);
    expect(screen.getByText('Invalid API Key')).toBeInTheDocument();
  });

  it('calls signInWithEmailAndPassword on form submit', async () => {
    const user = userEvent.setup();
    render(<LoginForm authError={null} />);

    await user.type(screen.getByLabelText(/email/i), 'test@ecoshift.org');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in$/i }));

    await waitFor(() => {
      expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@ecoshift.org',
        'password123'
      );
    });
  });

  it('calls signInAnonymously on guest login click', async () => {
    const user = userEvent.setup();
    render(<LoginForm authError={null} />);

    await user.click(screen.getByRole('button', { name: /sign in as guest/i }));

    await waitFor(() => {
      expect(mockSignInAnonymously).toHaveBeenCalled();
    });
  });
});
