import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { onAuthStateChanged } from 'firebase/auth';
import { useAuth } from '../useAuth';

// Mock firebase/auth — the global setup.ts mocks @/services/firebase,
// but we still need to mock the firebase/auth SDK module for onAuthStateChanged.
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn(),
}));

const mockOnAuthStateChanged = onAuthStateChanged as Mock;

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should start with loading=true, user=null, error=null', () => {
    // onAuthStateChanged registers the listener but doesn't invoke the callback yet
    mockOnAuthStateChanged.mockReturnValue(vi.fn());

    const { result } = renderHook(() => useAuth());

    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should set user and loading=false when auth state resolves with a user', async () => {
    const mockUser = { uid: 'abc-123', email: 'test@example.com' };

    mockOnAuthStateChanged.mockImplementation((_auth, onNext) => {
      // Simulate Firebase calling back with an authenticated user
      onNext(mockUser);
      return vi.fn(); // unsubscribe
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should set user=null and loading=false when no user is signed in', () => {
    mockOnAuthStateChanged.mockImplementation((_auth, onNext) => {
      onNext(null);
      return vi.fn();
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should set error and loading=false when auth encounters an error', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    mockOnAuthStateChanged.mockImplementation((_auth, _onNext, onError) => {
      onError(new Error('Network error'));
      return vi.fn();
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.error).toBe('Network error');
    expect(result.current.loading).toBe(false);
    expect(result.current.user).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith('Auth error:', expect.any(Error));

    consoleSpy.mockRestore();
  });

  it('should call unsubscribe when the hook unmounts', () => {
    const mockUnsubscribe = vi.fn();
    mockOnAuthStateChanged.mockReturnValue(mockUnsubscribe);

    const { unmount } = renderHook(() => useAuth());

    expect(mockUnsubscribe).not.toHaveBeenCalled();

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it('should pass auth instance to onAuthStateChanged', () => {
    mockOnAuthStateChanged.mockReturnValue(vi.fn());

    renderHook(() => useAuth());

    expect(mockOnAuthStateChanged).toHaveBeenCalledTimes(1);
    // The first argument should be the mocked auth object from @/services/firebase
    expect(mockOnAuthStateChanged.mock.calls[0][0]).toEqual({ currentUser: { uid: 'test-user' } });
  });

  it('should only subscribe once (empty dependency array)', () => {
    mockOnAuthStateChanged.mockReturnValue(vi.fn());

    const { rerender } = renderHook(() => useAuth());

    rerender();
    rerender();

    // onAuthStateChanged should only be called once despite re-renders
    expect(mockOnAuthStateChanged).toHaveBeenCalledTimes(1);
  });

  it('should handle auth state changes after initial load', () => {
    let capturedCallback: (user: unknown) => void;

    mockOnAuthStateChanged.mockImplementation((_auth, onNext) => {
      capturedCallback = onNext;
      // Initially signed out
      onNext(null);
      return vi.fn();
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);

    // Simulate a subsequent auth state change (user signs in)
    const mockUser = { uid: 'user-456', email: 'new@test.com' };
    act(() => {
      capturedCallback(mockUser);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.loading).toBe(false);
  });
});
