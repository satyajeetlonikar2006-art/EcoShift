import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { logEvent } from 'firebase/analytics';
import {
  trackActivityLogged,
  trackInsightsViewed,
  trackGoalCreated,
  trackPageView,
} from '../googleAnalytics';

vi.mock('firebase/analytics', () => ({
  logEvent: vi.fn(),
}));

const mockLogEvent = logEvent as Mock;

describe('googleAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-13T18:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('trackActivityLogged', () => {
    it('should call logEvent with activity_logged event and correct params', () => {
      trackActivityLogged('car', 2.5);

      expect(mockLogEvent).toHaveBeenCalledTimes(1);
      expect(mockLogEvent).toHaveBeenCalledWith(
        {}, // analytics mock from setup.ts
        'activity_logged',
        {
          activity_type: 'car',
          co2_amount: 2.5,
          timestamp: '2026-06-13T18:00:00.000Z',
        }
      );
    });

    it('should round co2Amount to 2 decimal places', () => {
      trackActivityLogged('bus', 1.23456);

      const params = mockLogEvent.mock.calls[0][2];
      expect(params.co2_amount).toBe(1.23);
    });

    it('should handle zero co2Amount', () => {
      trackActivityLogged('bicycle', 0);

      const params = mockLogEvent.mock.calls[0][2];
      expect(params.co2_amount).toBe(0);
    });

    it('should handle large co2Amount values', () => {
      trackActivityLogged('car', 99999.999);

      const params = mockLogEvent.mock.calls[0][2];
      expect(params.co2_amount).toBe(100000);
    });
  });

  describe('trackInsightsViewed', () => {
    it('should call logEvent with insights_viewed event', () => {
      trackInsightsViewed();

      expect(mockLogEvent).toHaveBeenCalledTimes(1);
      expect(mockLogEvent).toHaveBeenCalledWith(
        {},
        'insights_viewed',
        {
          timestamp: '2026-06-13T18:00:00.000Z',
        }
      );
    });
  });

  describe('trackGoalCreated', () => {
    it('should call logEvent with goal_created event and target amount', () => {
      trackGoalCreated(500);

      expect(mockLogEvent).toHaveBeenCalledTimes(1);
      expect(mockLogEvent).toHaveBeenCalledWith(
        {},
        'goal_created',
        {
          target_amount: 500,
          timestamp: '2026-06-13T18:00:00.000Z',
        }
      );
    });

    it('should handle decimal target amounts', () => {
      trackGoalCreated(123.45);

      const params = mockLogEvent.mock.calls[0][2];
      expect(params.target_amount).toBe(123.45);
    });
  });

  describe('trackPageView', () => {
    it('should call logEvent with page_view event and page name', () => {
      trackPageView('Dashboard');

      expect(mockLogEvent).toHaveBeenCalledTimes(1);
      expect(mockLogEvent).toHaveBeenCalledWith(
        {},
        'page_view',
        {
          page_name: 'Dashboard',
          timestamp: '2026-06-13T18:00:00.000Z',
        }
      );
    });

    it('should handle page names with special characters', () => {
      trackPageView('Activity / Log');

      const params = mockLogEvent.mock.calls[0][2];
      expect(params.page_name).toBe('Activity / Log');
    });

    it('should handle empty page name', () => {
      trackPageView('');

      const params = mockLogEvent.mock.calls[0][2];
      expect(params.page_name).toBe('');
    });
  });

  describe('null analytics handling', () => {
    it('should not call logEvent when analytics is null', async () => {
      // We need to re-import with analytics set to null
      // Use dynamic imports with a fresh module that has null analytics
      vi.doMock('@/services/firebase', () => ({
        auth: { currentUser: { uid: 'test-user' } },
        db: {},
        analytics: null,
        app: {},
      }));

      // Clear the module cache so the re-import picks up the new mock
      vi.resetModules();

      const { trackActivityLogged: trackLogged } = await import('../googleAnalytics');
      const { logEvent: freshLogEvent } = await import('firebase/analytics');

      trackLogged('car', 2.5);

      expect(freshLogEvent).not.toHaveBeenCalled();
    });

    it('should not throw when analytics is null and trackInsightsViewed is called', async () => {
      vi.doMock('@/services/firebase', () => ({
        auth: { currentUser: { uid: 'test-user' } },
        db: {},
        analytics: null,
        app: {},
      }));

      vi.resetModules();

      const { trackInsightsViewed: trackInsights } = await import('../googleAnalytics');

      expect(() => trackInsights()).not.toThrow();
    });

    it('should not throw when analytics is null and trackGoalCreated is called', async () => {
      vi.doMock('@/services/firebase', () => ({
        auth: { currentUser: { uid: 'test-user' } },
        db: {},
        analytics: null,
        app: {},
      }));

      vi.resetModules();

      const { trackGoalCreated: trackGoal } = await import('../googleAnalytics');

      expect(() => trackGoal(100)).not.toThrow();
    });

    it('should not throw when analytics is null and trackPageView is called', async () => {
      vi.doMock('@/services/firebase', () => ({
        auth: { currentUser: { uid: 'test-user' } },
        db: {},
        analytics: null,
        app: {},
      }));

      vi.resetModules();

      const { trackPageView: trackPage } = await import('../googleAnalytics');

      expect(() => trackPage('Home')).not.toThrow();
    });
  });
});
