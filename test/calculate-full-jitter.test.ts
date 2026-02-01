import { describe, it, expect, vi } from 'vitest';
import { calculateFullJitter } from '../src/jitter';

describe('calculateFullJitter', () => {
    it('never returns a value outside the expected range across many runs', () => {
        const min = 100;
        const max = 500;
        for (let i = 0; i < 10_000; i++) {
            const value = calculateFullJitter(min, max);
            expect(value).toBeGreaterThanOrEqual(min);
            expect(value).toBeLessThanOrEqual(max);
        }
    });
    it('returns a value within the min and max range', () => {
        const min = 100;
        const max = 500;

        const value = calculateFullJitter(min, max);

        expect(value).toBeGreaterThanOrEqual(min);
        expect(value).toBeLessThanOrEqual(max);
    });

    it('produces different values across multiple calls (statistical check)', () => {
        const min = 0;
        const max = 1000;

        const results = new Set();
        for (let i = 0; i < 20; i++) {
            results.add(calculateFullJitter(min, max));
        }

        // Not guaranteed, but extremely likely unless Math.random is mocked
        expect(results.size).toBeGreaterThan(1);
    });

    it('returns the exact value when minDelayMs === maxDelayMs', () => {
        const min = 250;
        const max = 250;

        const value = calculateFullJitter(min, max);

        expect(value).toBe(250);
    });

    it('works correctly with a very small range', () => {
        const min = 1000;
        const max = 1001;

        const value = calculateFullJitter(min, max);

        expect(value).toBeGreaterThanOrEqual(min);
        expect(value).toBeLessThanOrEqual(max);
    });

    it('respects mocked Math.random for deterministic testing', () => {
        const spy = vi.spyOn(Math, 'random').mockReturnValue(0.5);

        const min = 200;
        const max = 400;

        const value = calculateFullJitter(min, max);

        // 0.5 * (400 - 200) + 200 = 300
        expect(value).toBe(300);

        spy.mockRestore();
    });
});
