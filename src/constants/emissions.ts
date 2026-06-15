/**
 * Emission factors for different activities
 * All values in kg CO₂ per unit
 */

export const VEHICLE_EMISSIONS: Record<string, number> = {
  car: 0.25, // kg CO₂ per km
  bus: 0.05, // kg CO₂ per km
  train: 0.02, // kg CO₂ per km
  bicycle: 0, // kg CO₂ per km
  walking: 0, // kg CO₂ per km
};

export const FOOD_EMISSIONS: Record<string, number> = {
  beef: 27, // kg CO₂ per kg of beef
  chicken: 6.9, // kg CO₂ per kg of chicken
  fish: 12, // kg CO₂ per kg of fish
  dairy: 1.23, // kg CO₂ per kg of dairy
  vegetables: 0.2, // kg CO₂ per kg of vegetables
  grains: 0.15, // kg CO₂ per kg of grains
};

export const HOME_EMISSIONS: Record<string, number> = {
  electricity_kwh: 0.4, // kg CO₂ per kWh
  natural_gas_m3: 1.8, // kg CO₂ per m³
  water_m3: 0.24, // kg CO₂ per m³
};

export const AVERAGE_MONTHLY_FOOTPRINT = 500; // kg CO₂
export const AVERAGE_DAILY_FOOTPRINT = AVERAGE_MONTHLY_FOOTPRINT / 30;
