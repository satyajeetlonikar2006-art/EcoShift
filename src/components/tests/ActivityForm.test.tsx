import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActivityForm } from '../ActivityForm';
import { VehicleType } from '@/types';
import { logActivity } from '@/services/firebaseDB';
import { trackActivityLogged } from '@/services/googleAnalytics';
import { calculateTransportEmissions } from '@/services/carbonCalculator';

// Mock services
vi.mock('@/services/firebaseDB', () => ({
  logActivity: vi.fn(),
}));

vi.mock('@/services/googleAnalytics', () => ({
  trackActivityLogged: vi.fn(),
}));

vi.mock('@/services/carbonCalculator', () => ({
  calculateTransportEmissions: vi.fn(),
}));

const mockLogActivity = vi.mocked(logActivity);
const mockTrackActivityLogged = vi.mocked(trackActivityLogged);
const mockCalculateTransportEmissions = vi.mocked(calculateTransportEmissions);

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
    mockLogActivity.mockResolvedValue(mockActivity);
  });

  describe('Rendering', () => {
    it('renders the vehicle type select', () => {
      setup();
      expect(screen.getByLabelText(/vehicle type/i)).toBeInTheDocument();
    });

    it('renders the distance input', () => {
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
      expect(button).toHaveTextContent('Log Activity');
    });

    it('renders the form legend', () => {
      setup();
      expect(screen.getByText('Log Your Carbon Activity')).toBeInTheDocument();
    });

    it('renders all vehicle types as select options', () => {
      setup();
      const select = screen.getByLabelText(/vehicle type/i) as HTMLSelectElement;
      const options = Array.from(select.options);
      const optionValues = options.map(o => o.value);

      expect(optionValues).toContain(VehicleType.CAR);
      expect(optionValues).toContain(VehicleType.BUS);
      expect(optionValues).toContain(VehicleType.TRAIN);
      expect(optionValues).toContain(VehicleType.BICYCLE);
      expect(optionValues).toContain(VehicleType.WALKING);
      expect(options).toHaveLength(5);
    });

    it('defaults vehicle type to car', () => {
      setup();
      const select = screen.getByLabelText(/vehicle type/i) as HTMLSelectElement;
      expect(select.value).toBe(VehicleType.CAR);
    });

    it('renders description character counter showing 0/200', () => {
      setup();
      expect(screen.getByText('0/200 characters')).toBeInTheDocument();
    });
  });

  describe('ARIA attributes', () => {
    it('has noValidate on the form element', () => {
      setup();
      const form = document.querySelector('form');
      expect(form).toBeInTheDocument();
      expect(form).toHaveAttribute('noValidate');
    });

    it('marks vehicle type select as aria-required', () => {
      setup();
      const select = screen.getByLabelText(/vehicle type/i);
      expect(select).toHaveAttribute('aria-required', 'true');
    });

    it('marks distance input as aria-required', () => {
      setup();
      const input = screen.getByLabelText(/distance/i);
      expect(input).toHaveAttribute('aria-required', 'true');
    });

    it('has aria-label "Log Activity" on the submit button', () => {
      setup();
      const button = screen.getByRole('button', { name: /log activity/i });
      expect(button).toHaveAttribute('aria-label', 'Log Activity');
    });

    it('has a distance help text linked via aria-describedby', () => {
      setup();
      const input = screen.getByLabelText(/distance/i);
      expect(input).toHaveAttribute('aria-describedby', 'distance-help');
      expect(screen.getByText(/enter the distance traveled/i)).toBeInTheDocument();
    });

    it('has a description help text linked via aria-describedby', () => {
      setup();
      const input = screen.getByLabelText(/description/i);
      expect(input).toHaveAttribute('aria-describedby', 'description-help');
    });
  });

  describe('Validation', () => {
    it('shows "Distance is required" when distance is empty and form is submitted', async () => {
      const { user } = setup();

      const distanceInput = screen.getByLabelText(/distance/i);
      // Focus and blur to trigger touched state
      await user.click(distanceInput);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/distance is required/i)).toBeInTheDocument();
      });
    });

    it('shows "Distance cannot exceed 500 km" for values over 500', async () => {
      const { user } = setup();

      const distanceInput = screen.getByLabelText(/distance/i);
      await user.type(distanceInput, '600');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/distance cannot exceed 500 km/i)).toBeInTheDocument();
      });
    });

    it('shows "Distance must be greater than 0" for negative values', async () => {
      const { user } = setup();

      const distanceInput = screen.getByLabelText(/distance/i);
      await user.type(distanceInput, '-5');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/distance must be greater than 0/i)).toBeInTheDocument();
      });
    });

    it('shows validation errors with role="alert"', async () => {
      const { user } = setup();

      const distanceInput = screen.getByLabelText(/distance/i);
      await user.click(distanceInput);
      await user.tab();

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toHaveTextContent(/distance is required/i);
      });
    });
  });

  describe('Description character counter', () => {
    it('updates character counter as user types', async () => {
      const { user } = setup();
      const descInput = screen.getByLabelText(/description/i);

      await user.type(descInput, 'Hello');

      expect(screen.getByText('5/200 characters')).toBeInTheDocument();
    });

    it('shows correct count for longer text', async () => {
      const { user } = setup();
      const descInput = screen.getByLabelText(/description/i);

      await user.type(descInput, 'Commute to work');

      expect(screen.getByText('15/200 characters')).toBeInTheDocument();
    });
  });

  describe('Successful submission', () => {
    it('calls calculateTransportEmissions with correct arguments', async () => {
      const { user } = setup();

      await user.type(screen.getByLabelText(/distance/i), '10');
      await user.click(screen.getByRole('button', { name: /log activity/i }));

      await waitFor(() => {
        expect(mockCalculateTransportEmissions).toHaveBeenCalledWith(10, VehicleType.CAR);
      });
    });

    it('calls logActivity with the correct payload', async () => {
      const { user } = setup();

      await user.type(screen.getByLabelText(/distance/i), '25');
      await user.selectOptions(screen.getByLabelText(/vehicle type/i), VehicleType.BUS);
      await user.type(screen.getByLabelText(/description/i), 'Bus ride');
      await user.click(screen.getByRole('button', { name: /log activity/i }));

      await waitFor(() => {
        expect(mockLogActivity).toHaveBeenCalledWith(
          expect.objectContaining({
            category: 'transport',
            activityType: VehicleType.BUS,
            distance: 25,
            co2Impact: 2.5,
            description: 'Bus ride',
          })
        );
      });
    });

    it('calls trackActivityLogged after successful submission', async () => {
      const { user } = setup();

      await user.type(screen.getByLabelText(/distance/i), '10');
      await user.click(screen.getByRole('button', { name: /log activity/i }));

      await waitFor(() => {
        expect(mockTrackActivityLogged).toHaveBeenCalledWith(VehicleType.CAR, 2.5);
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
      const descInput = screen.getByLabelText(/description/i) as HTMLInputElement;

      await user.type(distanceInput, '10');
      await user.type(descInput, 'Test drive');
      await user.click(screen.getByRole('button', { name: /log activity/i }));

      await waitFor(() => {
        expect(distanceInput.value).toBe('');
        expect(descInput.value).toBe('');
      });
    });

    it('works without onActivityLogged callback (optional prop)', async () => {
      const { user } = setup();

      await user.type(screen.getByLabelText(/distance/i), '10');
      await user.click(screen.getByRole('button', { name: /log activity/i }));

      await waitFor(() => {
        expect(mockLogActivity).toHaveBeenCalled();
      });
      // No error thrown when callback is absent
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

      await waitFor(() => {
        expect(screen.getByText('Fail')).toBeInTheDocument();
      });
      expect(onActivityLogged).not.toHaveBeenCalled();
    });

    it('does not call trackActivityLogged on failure', async () => {
      mockLogActivity.mockRejectedValueOnce(new Error('Fail'));
      const { user } = setup();

      await user.type(screen.getByLabelText(/distance/i), '10');
      await user.click(screen.getByRole('button', { name: /log activity/i }));

      await waitFor(() => {
        expect(screen.getByText('Fail')).toBeInTheDocument();
      });
      expect(mockTrackActivityLogged).not.toHaveBeenCalled();
    });
  });

  describe('Submit button state', () => {
    it('shows "Logging..." text during submission', async () => {
      // Make logActivity hang so we can observe the intermediate state
      let resolveLogActivity: (value: any) => void;
      mockLogActivity.mockReturnValueOnce(
        new Promise(resolve => {
          resolveLogActivity = resolve;
        })
      );

      const { user } = setup();
      await user.type(screen.getByLabelText(/distance/i), '10');
      await user.click(screen.getByRole('button', { name: /log activity/i }));

      // During submission, button should show "Logging..."
      await waitFor(() => {
        expect(screen.getByText('Logging...')).toBeInTheDocument();
      });

      // Resolve to clean up
      resolveLogActivity!(mockActivity);
      await waitFor(() => {
        expect(screen.getByText('Log Activity')).toBeInTheDocument();
      });
    });

    it('disables submit button during submission', async () => {
      let resolveLogActivity: (value: any) => void;
      mockLogActivity.mockReturnValueOnce(
        new Promise(resolve => {
          resolveLogActivity = resolve;
        })
      );

      const { user } = setup();
      await user.type(screen.getByLabelText(/distance/i), '10');
      await user.click(screen.getByRole('button', { name: /log activity/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /log activity/i })).toBeDisabled();
      });

      resolveLogActivity!(mockActivity);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /log activity/i })).not.toBeDisabled();
      });
    });
  });
});
