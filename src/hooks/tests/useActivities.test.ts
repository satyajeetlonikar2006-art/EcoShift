import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useActivities } from '../useActivities';
import { getActivities, getWeeklyActivities } from '@/services/firebaseDB';
import { Activity } from '@/types';

vi.mock('@/services/firebaseDB', () => ({
  getActivities: vi.fn(),
  getWeeklyActivities: vi.fn(),
}));

const mockGetActivities = getActivities as Mock;
const mockGetWeeklyActivities = getWeeklyActivities as Mock;

const mockActivities: Activity[] = [
  {
    id: 'act-1',
    userId: 'user-1',
    category: 'transport',
    activityType: 'car',
    co2Impact: 2.5,
    description: 'Drove to work',
    distance: 10,
    date: new Date('2026-06-10'),
    createdAt: new Date('2026-06-10'),
    updatedAt: new Date('2026-06-10'),
  },
  {
    id: 'act-2',
    userId: 'user-1',
    category: 'food',
    activityType: 'beef',
    co2Impact: 5.0,
    description: 'Ate beef burger',
    amount: 200,
    date: new Date('2026-06-11'),
    createdAt: new Date('2026-06-11'),
    updatedAt: new Date('2026-06-11'),
  },
];

describe('useActivities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should start with loading=true when userId is provided', () => {
    // Return a pending promise so the hook stays in loading state
    mockGetActivities.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useActivities({ userId: 'user-1' }));

    expect(result.current.loading).toBe(true);
    expect(result.current.activities).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should set loading=false immediately when userId is undefined', async () => {
    const { result } = renderHook(() => useActivities({ userId: undefined }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.activities).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(mockGetActivities).not.toHaveBeenCalled();
    expect(mockGetWeeklyActivities).not.toHaveBeenCalled();
  });

  it('should set loading=false and return empty activities when called with no options', async () => {
    const { result } = renderHook(() => useActivities());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.activities).toEqual([]);
    expect(mockGetActivities).not.toHaveBeenCalled();
  });

  it('should fetch activities successfully with default period (all)', async () => {
    mockGetActivities.mockResolvedValue(mockActivities);

    const { result } = renderHook(() => useActivities({ userId: 'user-1' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.activities).toEqual(mockActivities);
    expect(result.current.error).toBeNull();
    expect(mockGetActivities).toHaveBeenCalledWith('user-1');
    expect(mockGetWeeklyActivities).not.toHaveBeenCalled();
  });

  it('should fetch activities with period="all" explicitly', async () => {
    mockGetActivities.mockResolvedValue(mockActivities);

    const { result } = renderHook(() =>
      useActivities({ userId: 'user-1', period: 'all' })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.activities).toEqual(mockActivities);
    expect(mockGetActivities).toHaveBeenCalledWith('user-1');
    expect(mockGetWeeklyActivities).not.toHaveBeenCalled();
  });

  it('should call getWeeklyActivities when period is "week"', async () => {
    const weeklyActivities = [mockActivities[0]];
    mockGetWeeklyActivities.mockResolvedValue(weeklyActivities);

    const { result } = renderHook(() =>
      useActivities({ userId: 'user-1', period: 'week' })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.activities).toEqual(weeklyActivities);
    expect(result.current.error).toBeNull();
    expect(mockGetWeeklyActivities).toHaveBeenCalledWith('user-1');
    expect(mockGetActivities).not.toHaveBeenCalled();
  });

  it('should handle errors from getActivities', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockGetActivities.mockRejectedValue(new Error('Firestore unavailable'));

    const { result } = renderHook(() =>
      useActivities({ userId: 'user-1' })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Firestore unavailable');
    expect(result.current.activities).toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to fetch activities:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it('should handle non-Error exceptions with fallback message', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockGetActivities.mockRejectedValue('some string error');

    const { result } = renderHook(() =>
      useActivities({ userId: 'user-1' })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch activities');

    consoleSpy.mockRestore();
  });

  it('should handle errors from getWeeklyActivities', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockGetWeeklyActivities.mockRejectedValue(new Error('Weekly query failed'));

    const { result } = renderHook(() =>
      useActivities({ userId: 'user-1', period: 'week' })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Weekly query failed');

    consoleSpy.mockRestore();
  });

  it('should re-fetch when userId changes', async () => {
    mockGetActivities.mockResolvedValue(mockActivities);

    const { result, rerender } = renderHook(
      ({ userId }: { userId?: string }) => useActivities({ userId }),
      { initialProps: { userId: 'user-1' } }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockGetActivities).toHaveBeenCalledWith('user-1');

    const newActivities = [mockActivities[1]];
    mockGetActivities.mockResolvedValue(newActivities);

    rerender({ userId: 'user-2' });

    await waitFor(() => {
      expect(result.current.activities).toEqual(newActivities);
    });

    expect(mockGetActivities).toHaveBeenCalledWith('user-2');
  });

  it('should re-fetch when period changes', async () => {
    mockGetActivities.mockResolvedValue(mockActivities);
    mockGetWeeklyActivities.mockResolvedValue([mockActivities[0]]);

    const { result, rerender } = renderHook(
      ({ userId, period }: { userId?: string; period?: 'all' | 'week' }) =>
        useActivities({ userId, period }),
      { initialProps: { userId: 'user-1', period: 'all' as const } }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockGetActivities).toHaveBeenCalledTimes(1);

    rerender({ userId: 'user-1', period: 'week' });

    await waitFor(() => {
      expect(result.current.activities).toEqual([mockActivities[0]]);
    });

    expect(mockGetWeeklyActivities).toHaveBeenCalledWith('user-1');
  });

  it('should clear error on successful re-fetch', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockGetActivities.mockRejectedValueOnce(new Error('Temporary failure'));

    const { result, rerender } = renderHook(
      ({ userId }: { userId: string }) => useActivities({ userId }),
      { initialProps: { userId: 'user-1' } }
    );

    await waitFor(() => {
      expect(result.current.error).toBe('Temporary failure');
    });

    mockGetActivities.mockResolvedValue(mockActivities);
    rerender({ userId: 'user-2' });

    await waitFor(() => {
      expect(result.current.error).toBeNull();
      expect(result.current.activities).toEqual(mockActivities);
    });

    consoleSpy.mockRestore();
  });

  it('should return empty activities for empty Firestore result', async () => {
    mockGetActivities.mockResolvedValue([]);

    const { result } = renderHook(() =>
      useActivities({ userId: 'user-with-no-data' })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.activities).toEqual([]);
    expect(result.current.error).toBeNull();
  });
});
