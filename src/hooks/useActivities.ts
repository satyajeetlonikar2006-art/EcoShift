import { useEffect, useState, useCallback } from 'react';
import { Activity } from '@/types';
import { getActivities, getWeeklyActivities } from '@/services/firebaseDB';

interface UseActivitiesOptions {
  userId?: string;
  period?: 'all' | 'week';
}

/**
 * Hook to fetch activities from Firestore
 */
export function useActivities(
  { userId, period = 'all' }: UseActivitiesOptions = {}
) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(!!userId);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [prevUserId, setPrevUserId] = useState(userId);
  const [prevPeriod, setPrevPeriod] = useState(period);
  const [prevRefreshKey, setPrevRefreshKey] = useState(refreshKey);

  // Sync state during render when inputs change
  if (userId !== prevUserId || period !== prevPeriod || refreshKey !== prevRefreshKey) {
    setPrevUserId(userId);
    setPrevPeriod(period);
    setPrevRefreshKey(refreshKey);
    setLoading(!!userId);
    if (!userId) {
      setActivities([]);
      setError(null);
    }
  }

  const refetch = useCallback(() => setRefreshKey(prev => prev + 1), []);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const fetchActivities = async () => {
      try {
        const data =
          period === 'week' ? await getWeeklyActivities(userId) : await getActivities(userId);
        setActivities(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch activities:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch activities');
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [userId, period, refreshKey]);

  return { activities, loading, error, refetch };
}
