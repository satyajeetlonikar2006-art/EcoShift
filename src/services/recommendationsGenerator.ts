import { Activity } from '@/types';

// Constants to eliminate magic numbers
const CAR_DISTANCE_THRESHOLD_KM = 50;
const CAR_SAVINGS_COEFFICIENT = 0.2;
const HOME_SAVINGS_COEFFICIENT = 0.1;
const MAX_RECOMMENDATIONS = 3;

export interface RecommendationItem {
  title: string;
  description: string;
  savings: string;
  actionText: string;
}

/**
 * Generate a list of personalized carbon footprint reduction recommendations
 * @param activities - Array of logged user activities
 * @returns Array of RecommendationItems
 */
export function generateRecommendations(activities: Activity[]): RecommendationItem[] {
  const list: RecommendationItem[] = [];

  // 1. Transport recommendation
  const carActivities = activities.filter(
    a => a.category === 'transport' && a.activityType === 'car'
  );
  const totalCarDistance = carActivities.reduce((sum, a) => sum + (a.distance || 0), 0);
  const carCO2 = carActivities.reduce((sum, a) => sum + a.co2Impact, 0);

  if (totalCarDistance > CAR_DISTANCE_THRESHOLD_KM) {
    const savingsVal = carCO2 * CAR_SAVINGS_COEFFICIENT;
    list.push({
      title: 'Switch some car trips to public transit',
      description: `You drove ${totalCarDistance.toFixed(1)} km. Switching 20% of these trips to a bus or train could save up to ${savingsVal.toFixed(1)} kg CO₂.`,
      savings: `${savingsVal.toFixed(1)} kg CO₂`,
      actionText: 'Find local transit routes',
    });
  }

  // 2. Food recommendation (if beef logged)
  const beefActivities = activities.filter(
    a => a.category === 'food' && a.activityType === 'beef'
  );
  if (beefActivities.length > 0) {
    const beefCO2 = beefActivities.reduce((sum, a) => sum + a.co2Impact, 0);
    const foodSavings = beefCO2 * CAR_SAVINGS_COEFFICIENT; // swap 20%
    list.push({
      title: 'Introduce plant-based days',
      description: `You logged beef consumption. Swapping 20% of your beef meals with plant-based alternatives could reduce your food footprint by ${foodSavings.toFixed(1)} kg CO₂.`,
      savings: `${foodSavings.toFixed(1)} kg CO₂`,
      actionText: 'Explore vegan recipes',
    });
  }

  // 3. Home recommendation (if home energy logged)
  const homeActivities = activities.filter(a => a.category === 'home');
  if (homeActivities.length > 0) {
    const homeCO2 = homeActivities.reduce((sum, a) => sum + a.co2Impact, 0);
    const homeSavings = homeCO2 * HOME_SAVINGS_COEFFICIENT;
    list.push({
      title: 'Optimize home energy use',
      description: `Your logged home energy footprint is ${homeCO2.toFixed(1)} kg CO₂. Reducing standby power and adjusting your thermostat can save about ${homeSavings.toFixed(1)} kg CO₂ (10%).`,
      savings: `${homeSavings.toFixed(1)} kg CO₂`,
      actionText: 'Energy saving tips',
    });
  }

  // 4. Default transit recommendation
  if (list.length < MAX_RECOMMENDATIONS) {
    list.push({
      title: 'Adopt active transit options',
      description: 'Consider walking or cycling for trips under 3 km. You will reduce your carbon footprint to zero for those trips while staying fit!',
      savings: '1.5 - 3.0 kg CO₂ per trip',
      actionText: 'Explore bike paths',
    });
  }

  // 5. Default logging reminder
  if (list.length < MAX_RECOMMENDATIONS) {
    list.push({
      title: 'Track consistently to build habits',
      description: 'Logging your daily travel, food, and home energy habits helps you identify major sources of emissions and make data-driven decisions.',
      savings: 'Awareness is key',
      actionText: 'Learn more',
    });
  }

  return list.slice(0, MAX_RECOMMENDATIONS);
}
