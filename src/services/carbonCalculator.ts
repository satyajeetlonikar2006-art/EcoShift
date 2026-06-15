import { VEHICLE_EMISSIONS, FOOD_EMISSIONS, HOME_EMISSIONS } from '@/constants/emissions';
import { ActivityCategory, VehicleType } from '@/types';

/**
 * Calculate CO₂ emissions for a transport activity
 * @param distance - Distance in km
 * @param vehicleType - Type of vehicle
 * @returns CO₂ in kg
 * @throws Error if distance is invalid
 */
export function calculateTransportEmissions(
  distance: number,
  vehicleType: VehicleType | string
): number {
  if (distance < 0) {
    throw new Error('Distance must be positive');
  }

  if (distance > 500) {
    console.warn('Distance seems unusually high. Please verify.');
  }

  const emissionFactor = VEHICLE_EMISSIONS[vehicleType];
  if (!emissionFactor && emissionFactor !== 0) {
    throw new Error(`Unknown vehicle type: ${vehicleType}`);
  }

  return Math.round(distance * emissionFactor * 100) / 100; // Round to 2 decimals
}

/**
 * Calculate CO₂ emissions for a food activity
 * @param amount - Amount in grams
 * @param foodType - Type of food
 * @returns CO₂ in kg
 */
export function calculateFoodEmissions(amount: number, foodType: string): number {
  if (amount <= 0) {
    throw new Error('Amount must be positive');
  }

  const emissionFactor = FOOD_EMISSIONS[foodType];
  if (!emissionFactor && emissionFactor !== 0) {
    throw new Error(`Unknown food type: ${foodType}`);
  }

  // Convert grams to kg and multiply
  const emissionsInKg = (amount / 1000) * emissionFactor;
  return Math.round(emissionsInKg * 100) / 100;
}

/**
 * Calculate total CO₂ for a list of activities
 */
export function calculateTotalEmissions(emissions: number[]): number {
  return Math.round(emissions.reduce((sum, val) => sum + val, 0) * 100) / 100;
}

/**
 * Get category breakdown
 */
export function getCategoryBreakdown(
  activities: { category: string; co2Impact: number }[]
): Record<string, number> {
  return activities.reduce(
    (acc, activity) => {
      acc[activity.category] = (acc[activity.category] || 0) + activity.co2Impact;
      return acc;
    },
    {} as Record<string, number>
  );
}
