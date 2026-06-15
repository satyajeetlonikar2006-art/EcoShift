import { useEffect, useState } from 'react';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = () => setRefreshKey(prev => prev + 1);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
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
