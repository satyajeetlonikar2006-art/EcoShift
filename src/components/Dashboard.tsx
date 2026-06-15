import { useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useActivities } from '@/hooks/useActivities';
import { calculateTotalEmissions, getCategoryBreakdown } from '@/services/carbonCalculator';
import { trackPageView } from '@/services/googleAnalytics';
import { AVERAGE_MONTHLY_FOOTPRINT } from '@/constants/emissions';
import { ActivityForm } from './ActivityForm';
import { InsightsChart } from './InsightsChart';
import { SummaryCards } from './SummaryCards';
import { RecommendationsList } from './RecommendationsList';

// Constants to eliminate magic numbers
const DAYS_IN_MONTH = 30;
const PERCENTAGE_MULTIPLIER = 100;
const DEFAULT_DAILY_FOOTPRINT = '0.00';

/**
 * Dashboard Component
 * Renders the main dashboard containing summary cards, breakdown charts, recommendations, and activity logger
 * @returns React component
 */
export function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { activities, refetch } = useActivities({ userId: user?.uid, period: 'all' });

  useEffect(() => {
    trackPageView('dashboard');
  }, []);

  const totalEmissions = useMemo(() => {
    return calculateTotalEmissions(activities.map(a => a.co2Impact));
  }, [activities]);

  const categoryBreakdown = useMemo(() => {
    return getCategoryBreakdown(activities);
  }, [activities]);

  const percentageVsAverage = useMemo(() => {
    return Math.round(
      ((totalEmissions - AVERAGE_MONTHLY_FOOTPRINT) / AVERAGE_MONTHLY_FOOTPRINT) * PERCENTAGE_MULTIPLIER
    );
  }, [totalEmissions]);

  const dailyAverageStr = useMemo(() => {
    return activities.length > 0
      ? (totalEmissions / DAYS_IN_MONTH).toFixed(2)
      : DEFAULT_DAILY_FOOTPRINT;
  }, [activities.length, totalEmissions]);

  if (authLoading) {
    return (
      <div className="card" style={{ maxWidth: '400px', margin: '100px auto', textAlign: 'center' }}>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="card" style={{ maxWidth: '450px', margin: '100px auto', textAlign: 'center' }}>
        <h2>Access Restricted</h2>
        <p>Please sign in to access your carbon footprint tracker dashboard.</p>
      </div>
    );
  }

  return (
    <main role="main" aria-label="Dashboard">
      <header>
        <h1>EcoShift</h1>
        <p>Your personal Carbon Footprint Tracker</p>
      </header>

      <SummaryCards
        totalEmissions={totalEmissions}
        activitiesCount={activities.length}
        dailyAverage={dailyAverageStr}
        percentageVsAverage={percentageVsAverage}
      />

      <div className="dashboard-grid">
        <div className="left-panel" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {activities.length > 0 ? (
            <section aria-labelledby="breakdown-title">
              <h2 id="breakdown-title">Emission Breakdown</h2>
              <InsightsChart data={categoryBreakdown} />
            </section>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <h3>No activities logged yet!</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Log your first trip on the right to start tracking your footprint.</p>
            </div>
          )}

          <section aria-labelledby="recommendations-title">
            <h2 id="recommendations-title">Reduction Opportunities</h2>
            <RecommendationsList activities={activities} />
          </section>
        </div>

        <div className="right-panel">
          <section aria-labelledby="log-activity-title">
            <h2 id="log-activity-title">Log New Activity</h2>
            <ActivityForm onActivityLogged={refetch} />
          </section>
        </div>
      </div>
    </main>
  );
}
