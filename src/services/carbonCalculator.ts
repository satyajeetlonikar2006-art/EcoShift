import { VEHICLE_EMISSIONS, FOOD_EMISSIONS, HOME_EMISSIONS } from '@/constants/emissions';
import { VehicleType } from '@/types';

// Constants to eliminate magic numbers
const ROUNDING_FACTOR = 100;
const GRAMS_IN_KG = 1000;

/**
 * Calculate CO₂ emissions for a transport activity
 * @param distance - Distance in km
 * @param vehicleType - Type of vehicle
 * @returns CO₂ in kg
 * @throws Error if distance is invalid or vehicle type is unknown
 */
export function calculateTransportEmissions(
  distance: number,
  vehicleType: VehicleType | string
): number {
  if (distance < 0) {
    throw new Error('Distance must be positive');
  }
  if (distance > 500) {
    console.warn('Extremely long distance logged');
  }

  const emissionFactor = VEHICLE_EMISSIONS[vehicleType];
  if (!emissionFactor && emissionFactor !== 0) {
    throw new Error(`Unknown vehicle type: ${vehicleType}`);
  }

  return Math.round(distance * emissionFactor * ROUNDING_FACTOR) / ROUNDING_FACTOR;
}

/**
 * Calculate CO₂ emissions for a food activity
 * @param amount - Amount in grams
 * @param foodType - Type of food
 * @returns CO₂ in kg
 * @throws Error if amount is invalid or food type is unknown
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
  const emissionsInKg = (amount / GRAMS_IN_KG) * emissionFactor;
  return Math.round(emissionsInKg * ROUNDING_FACTOR) / ROUNDING_FACTOR;
}

/**
 * Calculate CO₂ emissions for home energy
 * @param amount - Amount in kWh or m3
 * @param resourceType - Type of resource (electricity_kwh, natural_gas_m3, water_m3)
 * @returns CO₂ in kg
 * @throws Error if amount is invalid or resource type is unknown
 */
export function calculateHomeEmissions(amount: number, resourceType: string): number {
  if (amount <= 0) {
    throw new Error('Amount must be positive');
  }

  const emissionFactor = HOME_EMISSIONS[resourceType];
  if (!emissionFactor && emissionFactor !== 0) {
    throw new Error(`Unknown resource type: ${resourceType}`);
  }

  const emissionsInKg = amount * emissionFactor;
  return Math.round(emissionsInKg * ROUNDING_FACTOR) / ROUNDING_FACTOR;
}

/**
 * Calculate total CO₂ for a list of activities
 * @param emissions - Array of emission values in kg
 * @returns Total emissions in kg
 */
export function calculateTotalEmissions(emissions: number[]): number {
  return Math.round(emissions.reduce((sum, val) => sum + val, 0) * ROUNDING_FACTOR) / ROUNDING_FACTOR;
}

/**
 * Get category breakdown
 * @param activities - Array of logged activities
 * @returns Object mapping category to sum of emissions
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

