import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActivityForm } from '../ActivityForm';
import { logActivity } from '@/services/firebaseDB';
import { trackActivityLogged } from '@/services/googleAnalytics';
import { calculateTransportEmissions, calculateFoodEmissions, calculateHomeEmissions } from '@/services/carbonCalculator';

// Mock services
vi.mock('@/services/firebaseDB', () => ({
  logActivity: vi.fn(),
}));

vi.mock('@/services/googleAnalytics', () => ({
  trackActivityLogged: vi.fn(),
}));

vi.mock('@/services/carbonCalculator', () => ({
  calculateTransportEmissions: vi.fn(),
  calculateFoodEmissions: vi.fn(),
  calculateHomeEmissions: vi.fn(),
}));

const mockLogActivity = vi.mocked(logActivity);
const mockTrackActivityLogged = vi.mocked(trackActivityLogged);
const mockCalculateTransportEmissions = vi.mocked(calculateTransportEmissions);
const mockCalculateFoodEmissions = vi.mocked(calculateFoodEmissions);
const mockCalculateHomeEmissions = vi.mocked(calculateHomeEmissions);

const mockActivity = {
  id: 'activity-1',
  userId: 'test-user',
  category: 'transport' as const,
  activityType: 'car',
  distance: 10,
  co2Impact: 2.5,
  description: 'Commute',
  date: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

function setup(props = {}) {
  const user = userEvent.setup();
  const utils = render(<ActivityForm {...props} />);
  return { user, ...utils };
}

describe('ActivityForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCalculateTransportEmissions.mockReturnValue(2.5);
    mockCalculateFoodEmissions.mockReturnValue(13.5);
    mockCalculateHomeEmissions.mockReturnValue(40);
    mockLogActivity.mockResolvedValue(mockActivity);
  });

  describe('Rendering (Transport tab default)', () => {
    it('renders category tabs', () => {
      setup();
      expect(screen.getByRole('button', { name: /transport/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /food/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /home/i })).toBeInTheDocument();
    });

    it('renders vehicle type select by default', () => {
      setup();
      expect(screen.getByLabelText(/vehicle type/i)).toBeInTheDocument();
    });

    it('renders the distance input by default', () => {
      setup();
      expect(screen.getByLabelText(/distance/i)).toBeInTheDocument();
    });

    it('renders the description input', () => {
      setup();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });

    it('renders submit button with correct text', () => {
      setup();
      const button = screen.getByRole('button', { name: /log activity/i });
      expect(button).toBeInTheDocument();
    });
  });

  describe('Category tab switching', () => {
    it('switches to food tab and shows food type select', async () => {
      const { user } = setup();
      await user.click(screen.getByRole('button', { name: /food/i }));

      expect(screen.getByLabelText(/food type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    });

    it('switches to home tab and shows resource type select', async () => {
      const { user } = setup();
      await user.click(screen.getByRole('button', { name: /home/i }));

      expect(screen.getByLabelText(/resource type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/usage/i)).toBeInTheDocument();
    });
  });

  describe('ARIA attributes', () => {
    it('has noValidate on the form element', () => {
      setup();
      const form = document.querySelector('form');
      expect(form).toHaveAttribute('noValidate');
    });

    it('marks activity type select as aria-required', () => {
      setup();
      const select = screen.getByLabelText(/vehicle type/i);
      expect(select).toHaveAttribute('aria-required', 'true');
    });

    it('marks distance/amount input as aria-required', () => {
      setup();
      const input = screen.getByLabelText(/distance/i);
      expect(input).toHaveAttribute('aria-required', 'true');
    });

    it('has aria-label "Log Activity" on submit button', () => {
      setup();
      expect(screen.getByRole('button', { name: /log activity/i })).toHaveAttribute('aria-label', 'Log Activity');
    });
  });

  describe('Validation', () => {
    it('shows error when distance is empty and blurred', async () => {
      const { user } = setup();
      const distanceInput = screen.getByLabelText(/distance/i);
      await user.click(distanceInput);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });

    it('shows error for distance exceeding max', async () => {
      const { user } = setup();
      await user.type(screen.getByLabelText(/distance/i), '600');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/max 500 km/i)).toBeInTheDocument();
      });
    });
  });

  describe('Successful submission (Transport)', () => {
    it('calls calculateTransportEmissions with correct arguments', async () => {
      const { user } = setup();
      await user.type(screen.getByLabelText(/distance/i), '10');
      await user.click(screen.getByRole('button', { name: /log activity/i }));

      await waitFor(() => {
        expect(mockCalculateTransportEmissions).toHaveBeenCalledWith(10, 'car');
      });
    });

    it('calls logActivity with transport payload', async () => {
      const { user } = setup();
      await user.type(screen.getByLabelText(/distance/i), '25');
      await user.click(screen.getByRole('button', { name: /log activity/i }));

      await waitFor(() => {
        expect(mockLogActivity).toHaveBeenCalledWith(
          expect.objectContaining({ category: 'transport', distance: 25 })
        );
      });
    });

    it('calls trackActivityLogged after successful submission', async () => {
      const { user } = setup();
      await user.type(screen.getByLabelText(/distance/i), '10');
      await user.click(screen.getByRole('button', { name: /log activity/i }));

      await waitFor(() => {
        expect(mockTrackActivityLogged).toHaveBeenCalledWith('car', 2.5);
      });
    });

    it('calls onActivityLogged callback with the created activity', async () => {
      const onActivityLogged = vi.fn();
      const { user } = setup({ onActivityLogged });
      await user.type(screen.getByLabelText(/distance/i), '10');
      await user.click(screen.getByRole('button', { name: /log activity/i }));

      await waitFor(() => {
        expect(onActivityLogged).toHaveBeenCalledWith(mockActivity);
      });
    });

    it('resets form after successful submission', async () => {
      const { user } = setup();
      const distanceInput = screen.getByLabelText(/distance/i) as HTMLInputElement;
      await user.type(distanceInput, '10');
      await user.click(screen.getByRole('button', { name: /log activity/i }));

      await waitFor(() => {
        expect(distanceInput.value).toBe('');
      });
    });
  });

  describe('Successful submission (Food tab)', () => {
    it('calls calculateFoodEmissions when food category is active', async () => {
      const { user } = setup();
      await user.click(screen.getByRole('button', { name: /food/i }));
      await user.type(screen.getByLabelText(/amount/i), '500');
      await user.click(screen.getByRole('button', { name: /log activity/i }));

      await waitFor(() => {
        expect(mockCalculateFoodEmissions).toHaveBeenCalledWith(500, 'beef');
      });
    });
  });

  describe('Successful submission (Home tab)', () => {
    it('calls calculateHomeEmissions when home category is active', async () => {
      const { user } = setup();
      await user.click(screen.getByRole('button', { name: /home/i }));
      await user.type(screen.getByLabelText(/usage/i), '100');
      await user.click(screen.getByRole('button', { name: /log activity/i }));

      await waitFor(() => {
        expect(mockCalculateHomeEmissions).toHaveBeenCalledWith(100, 'electricity_kwh');
      });
    });
  });

  describe('Failed submission', () => {
    it('shows error message when logActivity throws an Error', async () => {
      mockLogActivity.mockRejectedValueOnce(new Error('Network error'));
      const { user } = setup();
      await user.type(screen.getByLabelText(/distance/i), '10');
      await user.click(screen.getByRole('button', { name: /log activity/i }));

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('shows generic error message when logActivity throws a non-Error', async () => {
      mockLogActivity.mockRejectedValueOnce('something went wrong');
      const { user } = setup();
      await user.type(screen.getByLabelText(/distance/i), '10');
      await user.click(screen.getByRole('button', { name: /log activity/i }));

      await waitFor(() => {
        expect(screen.getByText('Failed to log activity')).toBeInTheDocument();
      });
    });

    it('displays error with role="alert"', async () => {
      mockLogActivity.mockRejectedValueOnce(new Error('Server error'));
      const { user } = setup();
      await user.type(screen.getByLabelText(/distance/i), '10');
      await user.click(screen.getByRole('button', { name: /log activity/i }));

      await waitFor(() => {
        const alerts = screen.getAllByRole('alert');
        const errorAlert = alerts.find(a => a.textContent === 'Server error');
        expect(errorAlert).toBeDefined();
      });
    });

    it('does not call onActivityLogged on failure', async () => {
      mockLogActivity.mockRejectedValueOnce(new Error('Fail'));
      const onActivityLogged = vi.fn();
      const { user } = setup({ onActivityLogged });
      await user.type(screen.getByLabelText(/distance/i), '10');
      await user.click(screen.getByRole('button', { name: /log activity/i }));

      await waitFor(() => { expect(screen.getByText('Fail')).toBeInTheDocument(); });
      expect(onActivityLogged).not.toHaveBeenCalled();
    });

    it('does not call trackActivityLogged on failure', async () => {
      mockLogActivity.mockRejectedValueOnce(new Error('Fail'));
      const { user } = setup();
      await user.type(screen.getByLabelText(/distance/i), '10');
      await user.click(screen.getByRole('button', { name: /log activity/i }));

      await waitFor(() => { expect(screen.getByText('Fail')).toBeInTheDocument(); });
      expect(mockTrackActivityLogged).not.toHaveBeenCalled();
    });
  });

  describe('Submit button state', () => {
    it('shows "Logging..." text during submission', async () => {
      let resolveLogActivity: (value: any) => void;
      mockLogActivity.mockReturnValueOnce(new Promise(resolve => { resolveLogActivity = resolve; }));

      const { user } = setup();
      await user.type(screen.getByLabelText(/distance/i), '10');
      await user.click(screen.getByRole('button', { name: /log activity/i }));

      await waitFor(() => { expect(screen.getByText('Logging...')).toBeInTheDocument(); });

      resolveLogActivity!(mockActivity);
      await waitFor(() => { expect(screen.getByText('Log Activity')).toBeInTheDocument(); });
    });
  });
});
