import { describe, it, expect } from 'vitest';
import { generateRecommendations } from '../recommendationsGenerator';
import { Activity } from '@/types';

describe('recommendationsGenerator', () => {
  const baseActivity = {
    id: '1',
    userId: 'user-123',
    co2Impact: 10,
    description: 'test',
    date: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('should generate car recommendations when car distance > 50', () => {
    const activities: Activity[] = [
      {
        ...baseActivity,
        category: 'transport',
        activityType: 'car',
        distance: 60,
        co2Impact: 15,
      },
    ];

    const result = generateRecommendations(activities);
    expect(result.some(r => r.title.includes('public transit'))).toBe(true);
  });

  it('should generate food recommendations when beef is logged', () => {
    const activities: Activity[] = [
      {
        ...baseActivity,
        category: 'food',
        activityType: 'beef',
        amount: 500,
        co2Impact: 13.5,
      },
    ];

    const result = generateRecommendations(activities);
    expect(result.some(r => r.title.includes('plant-based'))).toBe(true);
  });

  it('should generate home recommendations when home energy is logged', () => {
    const activities: Activity[] = [
      {
        ...baseActivity,
        category: 'home',
        activityType: 'electricity_kwh',
        amount: 200,
        co2Impact: 80,
      },
    ];

    const result = generateRecommendations(activities);
    expect(result.some(r => r.title.includes('home energy'))).toBe(true);
  });

  it('should populate list with default active transit and logging reminder if short', () => {
    const result = generateRecommendations([]);
    expect(result.length).toBe(2);
    expect(result[0].title).includes('active transit');
    expect(result[1].title).includes('Track consistently');
  });
});
