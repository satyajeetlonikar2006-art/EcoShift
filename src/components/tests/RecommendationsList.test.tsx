import { render, screen } from '@testing-library/react';
import { RecommendationsList } from '../RecommendationsList';
import { describe, it, expect } from 'vitest';
import { Activity } from '@/types';

describe('RecommendationsList', () => {
  const baseActivity = {
    id: '1',
    userId: 'user-123',
    co2Impact: 10,
    description: 'test',
    date: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('renders generated recommendations based on activities list', () => {
    const activities: Activity[] = [
      {
        ...baseActivity,
        category: 'transport',
        activityType: 'car',
        distance: 60,
        co2Impact: 15,
      },
    ];

    render(<RecommendationsList activities={activities} />);

    expect(screen.getByText('Switch some car trips to public transit')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /find local transit/i })).toBeInTheDocument();
  });
});
