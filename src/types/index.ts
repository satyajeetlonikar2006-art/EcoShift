/**
 * User activity logged by the user
 */
export interface Activity {
  id: string;
  userId: string;
  category: 'transport' | 'food' | 'home' | 'shopping';
  activityType: string; // e.g., 'car', 'bus', 'beef', 'vegetarian'
  distance?: number; // km (for transport)
  amount?: number; // grams or count (for food)
  co2Impact: number; // kg CO₂
  description: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User profile
 */
export interface User {
  uid: string;
  phoneNumber: string;
  createdAt: Date;
  monthlyTarget: number; // kg CO₂
}

/**
 * Recommendation for user
 */
export interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: string;
  savingsPotential: number; // kg CO₂ per week
  action: string;
  confidence: number; // 0-100
}

/**
 * Vehicle type enum
 */
export enum VehicleType {
  CAR = 'car',
  BUS = 'bus',
  BICYCLE = 'bicycle',
  TRAIN = 'train',
  WALKING = 'walking',
}

/**
 * Activity category enum
 */
export enum ActivityCategory {
  TRANSPORT = 'transport',
  FOOD = 'food',
  HOME = 'home',
  SHOPPING = 'shopping',
}
