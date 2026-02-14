import { describe, it, expect } from 'vitest';
import { applyJitter } from '../src/retry';

describe('applyJitter - Error Handling & Validation', () => {
  
  // -----------------------------
  // BASE DELAY VALIDATION
  // -----------------------------
  describe('baseDelay validation', () => {
    it('should throw error for negative baseDelay', () => {
      expect(() => {
        applyJitter(-100, { type: 'equal' }, 0);
      }).toThrow('Invalid baseDelay: -100. Must be a non-negative finite number.');
    });

    it('should throw error for infinite baseDelay', () => {
      expect(() => {
        applyJitter(Infinity, { type: 'equal' }, 0);
      }).toThrow('Invalid baseDelay: Infinity. Must be a non-negative finite number.');
    });

    it('should throw error for NaN baseDelay', () => {
      expect(() => {
        applyJitter(NaN, { type: 'equal' }, 0);
      }).toThrow('Invalid baseDelay: NaN. Must be a non-negative finite number.');
    });
  });

  // -----------------------------
  // PREV DELAY VALIDATION
  // -----------------------------
  describe('prevDelay validation', () => {
    it('should throw error for negative prevDelay', () => {
      expect(() => {
        applyJitter(100, { type: 'equal' }, -50);
      }).toThrow('Invalid prevDelay: -50. Must be a non-negative finite number.');
    });

    it('should throw error for infinite prevDelay', () => {
      expect(() => {
        applyJitter(100, { type: 'decorrelated', maxDelay: 1000 }, Infinity);
      }).toThrow('Invalid prevDelay: Infinity. Must be a non-negative finite number.');
    });
  });

  // -----------------------------
  // FULL JITTER VALIDATION
  // -----------------------------
  describe('full jitter validation', () => {
    it('should throw error when min is negative', () => {
      expect(() => {
        applyJitter(100, { type: 'full', min: -10, max: 100 }, 0);
      }).toThrow('Invalid min delay: -10. Must be a non-negative finite number.');
    });

    it('should throw error when max is negative', () => {
      expect(() => {
        applyJitter(100, { type: 'full', min: 10, max: -100 }, 0);
      }).toThrow('Invalid max delay: -100. Must be a non-negative finite number.');
    });

    it('should throw error when min >= max', () => {
      expect(() => {
        applyJitter(100, { type: 'full', min: 500, max: 100 }, 0);
      }).toThrow('Invalid delay range: min (500) must be less than max (100).');
    });

    it('should throw error when min equals max', () => {
      expect(() => {
        applyJitter(100, { type: 'full', min: 100, max: 100 }, 0);
      }).toThrow('Invalid delay range: min (100) must be less than max (100).');
    });

    it('should throw error when min is infinite', () => {
      expect(() => {
        applyJitter(100, { type: 'full', min: Infinity, max: 1000 }, 0);
      }).toThrow('Invalid min delay: Infinity. Must be a non-negative finite number.');
    });
  });

  // -----------------------------
  // FIXED JITTER VALIDATION
  // -----------------------------
  describe('fixed jitter validation', () => {
    it('should throw error when amount is negative', () => {
      expect(() => {
        applyJitter(100, { type: 'fixed', amount: -50 }, 0);
      }).toThrow('Invalid jitter amount: -50. Must be a non-negative finite number.');
    });

    it('should throw error when amount is infinite', () => {
      expect(() => {
        applyJitter(100, { type: 'fixed', amount: Infinity }, 0);
      }).toThrow('Invalid jitter amount: Infinity. Must be a non-negative finite number.');
    });
  });

  // -----------------------------
  // RANDOM JITTER VALIDATION
  // -----------------------------
  describe('random jitter validation', () => {
    it('should throw error when fraction is negative', () => {
      expect(() => {
        applyJitter(100, { type: 'random', fraction: -0.5 }, 0);
      }).toThrow('Invalid jitter fraction: -0.5. Must be between 0 and 1.');
    });

    it('should throw error when fraction is greater than 1', () => {
      expect(() => {
        applyJitter(100, { type: 'random', fraction: 1.5 }, 0);
      }).toThrow('Invalid jitter fraction: 1.5. Must be between 0 and 1.');
    });

    it('should throw error when fraction is infinite', () => {
      expect(() => {
        applyJitter(100, { type: 'random', fraction: Infinity }, 0);
      }).toThrow('Invalid jitter fraction: Infinity. Must be between 0 and 1.');
    });

    it('should allow fraction of 0', () => {
      expect(() => {
        applyJitter(100, { type: 'random', fraction: 0 }, 0);
      }).not.toThrow();
    });

    it('should allow fraction of 1', () => {
      expect(() => {
        applyJitter(100, { type: 'random', fraction: 1 }, 0);
      }).not.toThrow();
    });
  });

  // -----------------------------
  // DECORRELATED JITTER VALIDATION
  // -----------------------------
  describe('decorrelated jitter validation', () => {
    it('should throw error when maxDelay is negative', () => {
      expect(() => {
        applyJitter(100, { type: 'decorrelated', maxDelay: -1000 }, 0);
      }).toThrow('Invalid maxDelay: -1000. Must be a non-negative finite number.');
    });

    it('should throw error when maxDelay is less than baseDelay', () => {
      expect(() => {
        applyJitter(1000, { type: 'decorrelated', maxDelay: 500 }, 0);
      }).toThrow('maxDelay (500) must be greater than or equal to baseDelay (1000).');
    });

    it('should throw error when maxDelay is infinite', () => {
      expect(() => {
        applyJitter(100, { type: 'decorrelated', maxDelay: Infinity }, 0);
      }).toThrow('Invalid maxDelay: Infinity. Must be a non-negative finite number.');
    });

    it('should allow maxDelay equal to baseDelay', () => {
      expect(() => {
        applyJitter(100, { type: 'decorrelated', maxDelay: 100 }, 0);
      }).not.toThrow();
    });
  });

  // -----------------------------
  // RETURN VALUE VALIDATION
  // -----------------------------
  describe('return value validation', () => {
    it('should validate that equal jitter returns valid number', () => {
      const result = applyJitter(1000, { type: 'equal' }, 0);
      
      expect(typeof result).toBe('number');
      expect(isFinite(result)).toBe(true);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(isNaN(result)).toBe(false);
    });

    it('should validate that full jitter result is within range', () => {
      const result = applyJitter(100, { type: 'full', min: 50, max: 200 }, 0);
      
      expect(result).toBeGreaterThanOrEqual(50);
      expect(result).toBeLessThanOrEqual(200);
    });

    it('should validate that fixed jitter result does not exceed baseDelay', () => {
      const result = applyJitter(1000, { type: 'fixed', amount: 200 }, 0);
      
      expect(result).toBeLessThanOrEqual(1000);
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it('should validate that random jitter result is within bounds', () => {
      const baseDelay = 1000;
      const fraction = 0.3;
      const result = applyJitter(baseDelay, { type: 'random', fraction }, 0);
      
      const expectedMin = baseDelay * (1 - fraction);
      const expectedMax = baseDelay * (1 + fraction);
      
      expect(result).toBeGreaterThanOrEqual(expectedMin);
      expect(result).toBeLessThanOrEqual(expectedMax);
    });

    it('should validate that decorrelated jitter does not exceed maxDelay', () => {
      const result = applyJitter(100, { type: 'decorrelated', maxDelay: 500 }, 1000);
      
      expect(result).toBeLessThanOrEqual(500);
      expect(result).toBeGreaterThanOrEqual(0);
    });
  });

  // -----------------------------
  // EDGE CASES
  // -----------------------------
  describe('edge cases', () => {
    it('should handle zero baseDelay', () => {
      expect(() => {
        applyJitter(0, { type: 'equal' }, 0);
      }).not.toThrow();
    });

    it('should handle zero prevDelay', () => {
      expect(() => {
        applyJitter(100, { type: 'decorrelated', maxDelay: 1000 }, 0);
      }).not.toThrow();
    });

    it('should handle very large valid numbers', () => {
      expect(() => {
        applyJitter(Number.MAX_SAFE_INTEGER / 10, { type: 'equal' }, 0);
      }).not.toThrow();
    });
  });
});