import React from 'react';

// Constants to eliminate magic numbers
const TARGET_DAILY_LIMIT_KG = 16.6;

interface SummaryCardsProps {
  totalEmissions: number;
  activitiesCount: number;
  dailyAverage: string;
  percentageVsAverage: number;
}

/**
 * SummaryCards Component
 * Renders stats cards showing total emissions, activities logged, and daily average
 * @param props - Component props
 * @returns React component
 */
export const SummaryCards = React.memo(function SummaryCards({
  totalEmissions,
  activitiesCount,
  dailyAverage,
  percentageVsAverage,
}: SummaryCardsProps) {
  return (
    <div className="summary-cards">
      <div className="card">
        <p className="label">Total CO₂ Emitted</p>
        <p className="value">{totalEmissions.toFixed(1)} kg</p>
        <p className="subtext">
          {percentageVsAverage > 0
            ? `${percentageVsAverage}% above national average`
            : `${Math.abs(percentageVsAverage)}% below national average`}
        </p>
      </div>

      <div className="card">
        <p className="label">Activities Logged</p>
        <p className="value">{activitiesCount}</p>
        <p className="subtext">Keep logging to track changes</p>
      </div>

      <div className="card">
        <p className="label">Average Daily</p>
        <p className="value">{dailyAverage} kg</p>
        <p className="subtext">Target: less than {TARGET_DAILY_LIMIT_KG} kg/day</p>
      </div>
    </div>
  );
});
