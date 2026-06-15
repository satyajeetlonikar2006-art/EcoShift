import React, { useMemo } from 'react';
import { Activity } from '@/types';
import { generateRecommendations } from '@/services/recommendationsGenerator';

interface RecommendationsListProps {
  activities: Activity[];
}

/**
 * RecommendationsList Component
 * Renders lists of personalized carbon reduction recommendations based on logged activities
 * @param props - Component props containing user activity logs
 * @returns React component
 */
export const RecommendationsList = React.memo(function RecommendationsList({
  activities,
}: RecommendationsListProps) {
  const recommendations = useMemo(() => {
    return generateRecommendations(activities);
  }, [activities]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {recommendations.map((rec, i) => (
        <div
          className="card"
          key={i}
          style={{ borderLeft: '4px solid var(--color-primary-light)' }}
        >
          <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>{rec.title}</h3>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.9rem',
              marginBottom: '12px',
            }}
          >
            {rec.description}
          </p>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--color-primary-light)',
              }}
            >
              Est. Savings: {rec.savings}
            </span>
            <button style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem' }}>
              {rec.actionText}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
});
