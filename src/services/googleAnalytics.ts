import { analytics } from './firebase';
import { logEvent } from 'firebase/analytics';

/**
 * Track when user logs an activity
 */
export function trackActivityLogged(activityType: string, co2Amount: number): void {
  if (analytics) {
    logEvent(analytics, 'activity_logged', {
      activity_type: activityType,
      co2_amount: Math.round(co2Amount * 100) / 100,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Track when user views insights
 */
export function trackInsightsViewed(): void {
  if (analytics) {
    logEvent(analytics, 'insights_viewed', {
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Track when user creates a goal
 */
export function trackGoalCreated(targetAmount: number): void {
  if (analytics) {
    logEvent(analytics, 'goal_created', {
      target_amount: targetAmount,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Track page view
 */
export function trackPageView(pageName: string): void {
  if (analytics) {
    logEvent(analytics, 'page_view', {
      page_name: pageName,
      timestamp: new Date().toISOString(),
    });
  }
}
