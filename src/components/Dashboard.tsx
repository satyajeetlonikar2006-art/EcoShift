import { useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useActivities } from '@/hooks/useActivities';
import { calculateTotalEmissions, getCategoryBreakdown } from '@/services/carbonCalculator';
import { trackPageView } from '@/services/googleAnalytics';
import { AVERAGE_MONTHLY_FOOTPRINT } from '@/constants/emissions';
import { ActivityForm } from './ActivityForm';
import { InsightsChart } from './InsightsChart';
import { Activity } from '@/types';

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
      ((totalEmissions - AVERAGE_MONTHLY_FOOTPRINT) / AVERAGE_MONTHLY_FOOTPRINT) * 100
    );
  }, [totalEmissions]);

  // Generate personalized recommendations based on logged activities
  const recommendations = useMemo(() => {
    const list = [];
    const carActivities = activities.filter(a => a.activityType === 'car');
    const totalCarDistance = carActivities.reduce((sum, a) => sum + (a.distance || 0), 0);
    const carCO2 = carActivities.reduce((sum, a) => sum + a.co2Impact, 0);

    if (totalCarDistance > 50) {
      list.push({
        title: 'Switch some car trips to public transit',
        description: `You drove ${totalCarDistance.toFixed(1)} km this week. Switching 20% of these trips to a bus or train could save up to ${(carCO2 * 0.2).toFixed(1)} kg CO₂.`,
        savings: `${(carCO2 * 0.2).toFixed(1)} kg CO₂`,
        actionText: 'Find local transit routes'
      });
    }

    if (activities.length > 5) {
      list.push({
        title: 'Adopt active transit options',
        description: 'Consider walking or cycling for trips under 3 km. You will reduce your carbon footprint to zero for those trips while staying fit!',
        savings: '1.5 - 3.0 kg CO₂ per trip',
        actionText: 'Explore bike paths'
      });
    }

    // Default recommendation
    list.push({
      title: 'Track consistently to build habits',
      description: 'Logging your daily travel habits helps you identify major sources of emissions and make data-driven decisions.',
      savings: 'Awareness is key',
      actionText: 'Learn more'
    });

    return list.slice(0, 3);
  }, [activities]);

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

      <div className="summary-cards">
        <div className="card">
          <p className="label">Total CO₂ Emitted</p>
          <p className="value">{totalEmissions.toFixed(1)} kg</p>
          <p className="subtext">
            {percentageVsAverage > 0
              ? `${percentageVsAverage}% above national average`
              : `${Math.abs(percentageVsAverage)}% below national average`}
          </p>
        </div>

        <div className="card">
          <p className="label">Activities Logged</p>
          <p className="value">{activities.length}</p>
          <p className="subtext">Keep logging to track changes</p>
        </div>

        <div className="card">
          <p className="label">Average Daily</p>
          <p className="value">
            {activities.length > 0
              ? (totalEmissions / 30).toFixed(2)
              : '0.00'}{' '}
            kg
          </p>
          <p className="subtext">Target: less than 16.6 kg/day</p>
        </div>
      </div>

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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {recommendations.map((rec, i) => (
                <div className="card" key={i} style={{ borderLeft: '4px solid var(--color-primary-light)' }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>{rec.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '12px' }}>{rec.description}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-primary-light)' }}>
                      Est. Savings: {rec.savings}
                    </span>
                    <button style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem' }}>
                      {rec.actionText}
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
