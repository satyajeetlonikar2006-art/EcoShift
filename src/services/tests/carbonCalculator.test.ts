import { describe, it, expect, vi } from 'vitest';
import {
  calculateTransportEmissions,
  calculateFoodEmissions,
  calculateHomeEmissions,
  calculateTotalEmissions,
  getCategoryBreakdown,
} from '../carbonCalculator';
import { VehicleType, ActivityCategory } from '@/types';

describe('carbonCalculator', () => {
  describe('calculateTransportEmissions', () => {
    it('should calculate car emissions correctly', () => {
      const result = calculateTransportEmissions(10, VehicleType.CAR);
      expect(result).toBe(2.5); // 10 * 0.25
    });

    it('should calculate bus emissions correctly', () => {
      const result = calculateTransportEmissions(10, VehicleType.BUS);
      expect(result).toBe(0.5); // 10 * 0.05
    });

    it('should return 0 for bicycle', () => {
      const result = calculateTransportEmissions(10, VehicleType.BICYCLE);
      expect(result).toBe(0);
    });

    it('should handle zero distance', () => {
      const result = calculateTransportEmissions(0, VehicleType.CAR);
      expect(result).toBe(0);
    });

    it('should throw for negative distance', () => {
      expect(() => calculateTransportEmissions(-5, VehicleType.CAR)).toThrow(
        'Distance must be positive'
      );
    });

    it('should throw for invalid vehicle type', () => {
      expect(() => calculateTransportEmissions(10, 'invalid')).toThrow(
        'Unknown vehicle type'
      );
    });

    it('should warn for distance > 500km', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      calculateTransportEmissions(600, VehicleType.CAR);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('calculateFoodEmissions', () => {
    it('should calculate beef emissions correctly', () => {
      const result = calculateFoodEmissions(1000, 'beef');
      expect(result).toBe(27); // 1000g * 27 / 1000 = 27
    });

    it('should calculate chicken emissions correctly and round', () => {
      const result = calculateFoodEmissions(500, 'chicken');
      expect(result).toBe(3.45); // 500g * 6.9 / 1000 = 3.45
    });

    it('should throw for zero amount', () => {
      expect(() => calculateFoodEmissions(0, 'beef')).toThrow(
        'Amount must be positive'
      );
    });

    it('should throw for negative amount', () => {
      expect(() => calculateFoodEmissions(-100, 'beef')).toThrow(
        'Amount must be positive'
      );
    });

    it('should throw for invalid food type', () => {
      expect(() => calculateFoodEmissions(500, 'invalid')).toThrow(
        'Unknown food type'
      );
    });
  });

  describe('calculateHomeEmissions', () => {
    it('should calculate electricity emissions correctly', () => {
      const result = calculateHomeEmissions(100, 'electricity_kwh');
      expect(result).toBe(40); // 100 * 0.4
    });

    it('should calculate natural gas emissions correctly', () => {
      const result = calculateHomeEmissions(10, 'natural_gas_m3');
      expect(result).toBe(18); // 10 * 1.8
    });

    it('should calculate water emissions correctly and round', () => {
      const result = calculateHomeEmissions(5, 'water_m3');
      expect(result).toBe(1.2); // 5 * 0.24
    });

    it('should throw for zero amount', () => {
      expect(() => calculateHomeEmissions(0, 'electricity_kwh')).toThrow(
        'Amount must be positive'
      );
    });

    it('should throw for negative amount', () => {
      expect(() => calculateHomeEmissions(-5, 'electricity_kwh')).toThrow(
        'Amount must be positive'
      );
    });

    it('should throw for invalid resource type', () => {
      expect(() => calculateHomeEmissions(10, 'invalid_resource')).toThrow(
        'Unknown resource type'
      );
    });
  });

  describe('calculateTotalEmissions', () => {
    it('should sum emissions correctly', () => {
      const result = calculateTotalEmissions([2.5, 0.5, 0]);
      expect(result).toBe(3);
    });

    it('should handle empty array', () => {
      const result = calculateTotalEmissions([]);
      expect(result).toBe(0);
    });

    it('should round to 2 decimals', () => {
      const result = calculateTotalEmissions([0.333, 0.333, 0.334]);
      expect(result).toBe(1); // 0.333 + 0.333 + 0.334 = 1.0
    });
  });

  describe('getCategoryBreakdown', () => {
    it('should group by category correctly', () => {
      const activities = [
        { category: ActivityCategory.TRANSPORT, co2Impact: 2.5 },
        { category: ActivityCategory.TRANSPORT, co2Impact: 1.0 },
        { category: ActivityCategory.FOOD, co2Impact: 5.0 },
      ];

      const result = getCategoryBreakdown(activities);

      expect(result.transport).toBe(3.5);
      expect(result.food).toBe(5.0);
    });

    it('should handle empty array', () => {
      const result = getCategoryBreakdown([]);
      expect(result).toEqual({});
    });
  });
});
