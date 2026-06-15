import { render, screen } from '@testing-library/react';
import { Dashboard } from '../Dashboard';
import { Activity } from '@/types';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock hooks
const mockUseAuth = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
  triggerMockAuthStateChange: vi.fn(),
}));

const mockUseActivities = vi.fn();
vi.mock('@/hooks/useActivities', () => ({
  useActivities: () => mockUseActivities(),
}));

// Mock services
const mockTrackPageView = vi.fn();
vi.mock('@/services/googleAnalytics', () => ({
  trackPageView: (...args: unknown[]) => mockTrackPageView(...args),
}));

vi.mock('@/services/carbonCalculator', () => ({
  calculateTotalEmissions: vi.fn((emissions: number[]) =>
    emissions.reduce((sum: number, val: number) => sum + val, 0)
  ),
  getCategoryBreakdown: vi.fn((activities: Activity[]) =>
    activities.reduce(
      (acc: Record<string, number>, a: Activity) => {
        acc[a.category] = (acc[a.category] || 0) + a.co2Impact;
        return acc;
      },
      {} as Record<string, number>
    )
  ),
}));

// Mock child components to isolate Dashboard logic
vi.mock('../ActivityForm', () => ({
  ActivityForm: () => <div data-testid="activity-form">ActivityForm</div>,
}));

vi.mock('../InsightsChart', () => ({
  InsightsChart: ({ data }: { data: Record<string, number> }) => (
    <div data-testid="insights-chart">{JSON.stringify(data)}</div>
  ),
}));

vi.mock('../SummaryCards', () => ({
  SummaryCards: ({ totalEmissions, activitiesCount, percentageVsAverage }: {
    totalEmissions: number;
    activitiesCount: number;
    dailyAverage: string;
    percentageVsAverage: number;
  }) => (
    <div data-testid="summary-cards">
      <span>Total CO₂ Emitted</span>
      <span>{totalEmissions.toFixed(1)} kg</span>
      <span>Activities Logged</span>
      <span>{activitiesCount}</span>
      <span>{percentageVsAverage > 0 ? `${percentageVsAverage}% above national average` : `${Math.abs(percentageVsAverage)}% below national average`}</span>
    </div>
  ),
}));

vi.mock('../RecommendationsList', () => ({
  RecommendationsList: ({ activities }: { activities: Activity[] }) => (
    <div data-testid="recommendations-list">
      {activities.length > 0 ? 'Car trip' : 'Track consistently to build habits'}
    </div>
  ),
}));

const mockUser = { uid: 'user-123', email: 'test@test.com' };

const createActivity = (overrides: Partial<Activity> = {}): Activity => ({
  id: 'act-1',
  userId: 'user-123',
  category: 'transport',
  activityType: 'car',
  distance: 10,
  co2Impact: 2.5,
  description: 'Test',
  date: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading state', () => {
    it('shows loading message when auth is loading', () => {
      mockUseAuth.mockReturnValue({ user: null, loading: true, error: null });
      mockUseActivities.mockReturnValue({ activities: [], loading: true, error: null, refetch: vi.fn() });
      render(<Dashboard />);
      expect(screen.getByText('Loading your dashboard...')).toBeInTheDocument();
    });

    it('does not render the main dashboard content when loading', () => {
      mockUseAuth.mockReturnValue({ user: null, loading: true, error: null });
      mockUseActivities.mockReturnValue({ activities: [], loading: true, error: null, refetch: vi.fn() });
      render(<Dashboard />);
      expect(screen.queryByRole('main')).not.toBeInTheDocument();
    });
  });

  describe('Unauthenticated state', () => {
    it('shows access restricted message when no user', () => {
      mockUseAuth.mockReturnValue({ user: null, loading: false, error: null });
      mockUseActivities.mockReturnValue({ activities: [], loading: false, error: null, refetch: vi.fn() });
      render(<Dashboard />);
      expect(screen.getByText('Access Restricted')).toBeInTheDocument();
    });

    it('does not render dashboard content when unauthenticated', () => {
      mockUseAuth.mockReturnValue({ user: null, loading: false, error: null });
      mockUseActivities.mockReturnValue({ activities: [], loading: false, error: null, refetch: vi.fn() });
      render(<Dashboard />);
      expect(screen.queryByRole('main')).not.toBeInTheDocument();
    });
  });

  describe('Authenticated state - Header', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false, error: null });
      mockUseActivities.mockReturnValue({ activities: [], loading: false, error: null, refetch: vi.fn() });
    });

    it('renders the dashboard header with EcoShift title', () => {
      render(<Dashboard />);
      expect(screen.getByRole('heading', { name: 'EcoShift', level: 1 })).toBeInTheDocument();
    });

    it('renders the subtitle', () => {
      render(<Dashboard />);
      expect(screen.getByText('Your personal Carbon Footprint Tracker')).toBeInTheDocument();
    });

    it('renders the main landmark with aria-label', () => {
      render(<Dashboard />);
      expect(screen.getByRole('main', { name: 'Dashboard' })).toBeInTheDocument();
    });
  });

  describe('Tracks page view', () => {
    it('calls trackPageView with "dashboard" on mount', () => {
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false, error: null });
      mockUseActivities.mockReturnValue({ activities: [], loading: false, error: null, refetch: vi.fn() });
      render(<Dashboard />);
      expect(mockTrackPageView).toHaveBeenCalledWith('dashboard');
    });
  });

  describe('Summary cards', () => {
    it('displays total CO₂ as 0.0 kg when no activities', () => {
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false, error: null });
      mockUseActivities.mockReturnValue({ activities: [], loading: false, error: null, refetch: vi.fn() });
      render(<Dashboard />);
      expect(screen.getByText('0.0 kg')).toBeInTheDocument();
    });

    it('displays correct total CO₂ with activities', () => {
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false, error: null });
      mockUseActivities.mockReturnValue({
        activities: [createActivity({ co2Impact: 2.5 }), createActivity({ id: 'act-2', co2Impact: 3.5 })],
        loading: false, error: null, refetch: vi.fn(),
      });
      render(<Dashboard />);
      expect(screen.getByText('6.0 kg')).toBeInTheDocument();
    });

    it('displays activities count', () => {
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false, error: null });
      mockUseActivities.mockReturnValue({
        activities: [createActivity(), createActivity({ id: 'act-2' })],
        loading: false, error: null, refetch: vi.fn(),
      });
      render(<Dashboard />);
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('shows "below national average" when emissions are low', () => {
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false, error: null });
      mockUseActivities.mockReturnValue({
        activities: [createActivity({ co2Impact: 100 })],
        loading: false, error: null, refetch: vi.fn(),
      });
      render(<Dashboard />);
      expect(screen.getByText(/below national average/i)).toBeInTheDocument();
    });
  });

  describe('ActivityForm section', () => {
    it('renders the ActivityForm with heading', () => {
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false, error: null });
      mockUseActivities.mockReturnValue({ activities: [], loading: false, error: null, refetch: vi.fn() });
      render(<Dashboard />);
      expect(screen.getByText('Log New Activity')).toBeInTheDocument();
      expect(screen.getByTestId('activity-form')).toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('shows empty state message when no activities exist', () => {
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false, error: null });
      mockUseActivities.mockReturnValue({ activities: [], loading: false, error: null, refetch: vi.fn() });
      render(<Dashboard />);
      expect(screen.getByText('No activities logged yet!')).toBeInTheDocument();
    });

    it('does not render InsightsChart when no activities', () => {
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false, error: null });
      mockUseActivities.mockReturnValue({ activities: [], loading: false, error: null, refetch: vi.fn() });
      render(<Dashboard />);
      expect(screen.queryByTestId('insights-chart')).not.toBeInTheDocument();
    });
  });

  describe('Emission breakdown chart', () => {
    it('renders InsightsChart when activities exist', () => {
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false, error: null });
      mockUseActivities.mockReturnValue({
        activities: [createActivity()], loading: false, error: null, refetch: vi.fn(),
      });
      render(<Dashboard />);
      expect(screen.getByTestId('insights-chart')).toBeInTheDocument();
    });

    it('renders Emission Breakdown heading when activities exist', () => {
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false, error: null });
      mockUseActivities.mockReturnValue({
        activities: [createActivity()], loading: false, error: null, refetch: vi.fn(),
      });
      render(<Dashboard />);
      expect(screen.getByText('Emission Breakdown')).toBeInTheDocument();
    });
  });

  describe('Recommendations section', () => {
    it('renders Reduction Opportunities heading', () => {
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false, error: null });
      mockUseActivities.mockReturnValue({ activities: [], loading: false, error: null, refetch: vi.fn() });
      render(<Dashboard />);
      expect(screen.getByText('Reduction Opportunities')).toBeInTheDocument();
    });
  });
});
