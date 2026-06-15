import { render, screen } from '@testing-library/react';
import { SummaryCards } from '../SummaryCards';
import { describe, it, expect } from 'vitest';

describe('SummaryCards', () => {
  it('renders stats correctly below national average', () => {
    render(
      <SummaryCards
        totalEmissions={120.5}
        activitiesCount={8}
        dailyAverage="4.02"
        percentageVsAverage={-30}
      />
    );

    expect(screen.getByText('Total CO₂ Emitted')).toBeInTheDocument();
    expect(screen.getByText('120.5 kg')).toBeInTheDocument();
    expect(screen.getByText('30% below national average')).toBeInTheDocument();
    expect(screen.getByText('Activities Logged')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('4.02 kg')).toBeInTheDocument();
  });

  it('renders stats correctly above national average', () => {
    render(
      <SummaryCards
        totalEmissions={600.0}
        activitiesCount={12}
        dailyAverage="20.00"
        percentageVsAverage={20}
      />
    );

    expect(screen.getByText('600.0 kg')).toBeInTheDocument();
    expect(screen.getByText('20% above national average')).toBeInTheDocument();
  });
});
