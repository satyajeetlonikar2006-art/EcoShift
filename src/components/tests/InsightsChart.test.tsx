import React from 'react';
import { render, screen } from '@testing-library/react';
import { InsightsChart } from '../InsightsChart';

// Mock recharts – these components require SVG/canvas not available in happy-dom
vi.mock('recharts', () => ({
  PieChart: ({ children }: { children?: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ data }: { data?: { name: string; value: number }[] }) => (
    <div data-testid="pie">
      {data?.map((d, i) => (
        <span key={i} data-testid={`pie-segment-${i}`}>
          {d.name}: {d.value}
        </span>
      ))}
    </div>
  ),
  Cell: () => <div data-testid="cell" />,
  Legend: () => <div data-testid="legend" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
}));

describe('InsightsChart', () => {
  describe('Empty data', () => {
    it('returns null when data object is empty', () => {
      const { container } = render(<InsightsChart data={{}} />);
      expect(container.innerHTML).toBe('');
    });

    it('does not render the chart container when there is no data', () => {
      render(<InsightsChart data={{}} />);
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
  });

  describe('Chart container', () => {
    it('renders with role="img"', () => {
      render(<InsightsChart data={{ transport: 10 }} />);
      expect(screen.getByRole('img')).toBeInTheDocument();
    });

    it('has correct aria-label for accessibility', () => {
      render(<InsightsChart data={{ transport: 10 }} />);
      expect(
        screen.getByRole('img', { name: 'Carbon emissions breakdown pie chart' })
      ).toBeInTheDocument();
    });

    it('has the chart-container and card CSS classes', () => {
      render(<InsightsChart data={{ transport: 10 }} />);
      const container = screen.getByRole('img');
      expect(container).toHaveClass('chart-container');
      expect(container).toHaveClass('card');
    });
  });

  describe('Data transformation', () => {
    it('capitalizes category names', () => {
      render(<InsightsChart data={{ transport: 10, food: 5 }} />);
      expect(screen.getByText(/Transport:/)).toBeInTheDocument();
      expect(screen.getByText(/Food:/)).toBeInTheDocument();
    });

    it('capitalizes single-letter category names', () => {
      render(<InsightsChart data={{ a: 1 }} />);
      expect(screen.getByText(/A:/)).toBeInTheDocument();
    });

    it('rounds values to 2 decimal places', () => {
      render(<InsightsChart data={{ transport: 10.456 }} />);
      expect(screen.getByText('Transport: 10.46')).toBeInTheDocument();
    });

    it('handles integer values without adding unnecessary decimals', () => {
      render(<InsightsChart data={{ home: 7 }} />);
      expect(screen.getByText('Home: 7')).toBeInTheDocument();
    });
  });

  describe('Rendering with data', () => {
    it('renders with a single category', () => {
      render(<InsightsChart data={{ transport: 25.5 }} />);

      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
      expect(screen.getByTestId('pie')).toBeInTheDocument();
      expect(screen.getByText('Transport: 25.5')).toBeInTheDocument();
    });

    it('renders with multiple categories', () => {
      render(
        <InsightsChart
          data={{
            transport: 25.5,
            food: 12.3,
            home: 8.75,
            shopping: 3.2,
          }}
        />
      );

      expect(screen.getByText('Transport: 25.5')).toBeInTheDocument();
      expect(screen.getByText('Food: 12.3')).toBeInTheDocument();
      expect(screen.getByText('Home: 8.75')).toBeInTheDocument();
      expect(screen.getByText('Shopping: 3.2')).toBeInTheDocument();
    });

    it('renders the PieChart component', () => {
      render(<InsightsChart data={{ transport: 10 }} />);
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });

    it('renders the Legend component', () => {
      render(<InsightsChart data={{ transport: 10 }} />);
      expect(screen.getByTestId('legend')).toBeInTheDocument();
    });

    it('renders the ResponsiveContainer', () => {
      render(<InsightsChart data={{ transport: 10 }} />);
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    it('renders correct number of pie segments', () => {
      render(
        <InsightsChart data={{ transport: 10, food: 5, home: 3 }} />
      );
      expect(screen.getByTestId('pie-segment-0')).toBeInTheDocument();
      expect(screen.getByTestId('pie-segment-1')).toBeInTheDocument();
      expect(screen.getByTestId('pie-segment-2')).toBeInTheDocument();
    });

    it('handles zero values', () => {
      render(<InsightsChart data={{ walking: 0 }} />);
      expect(screen.getByText('Walking: 0')).toBeInTheDocument();
    });
  });
});
