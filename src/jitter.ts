/**
 * Generates a full‑jitter delay within the given range.
 *
 * Full jitter selects a completely random delay between `minDelay` and
 * `maxDelay`, spreading numbers across the entire interval to create jitter.
 *
 * @param {number} minDelayMs - The minimum delay (inclusive).
 * @param {number} maxDelayMs - The maximum delay (exclusive).
 * @returns {number} A random delay between `minDelay` and `maxDelay`.
 * @description Full jitter is ideal when many clients may retry at the same time and you need to aggressively spread those retries out. It’s especially useful under high contention or bursty failure conditions, where a wide range of random delays helps prevent retry storms and reduces load on downstream services.
 */
export function calculateFullJitter(minDelayMs: number, maxDelayMs: number): number {
    return Math.random() * (maxDelayMs - minDelayMs) + minDelayMs;
}

/**
 * Calculates an equal‑jitter backoff delay.
 *
 * Equal jitter splits the delay into a fixed half and a random half.
 * This reduces synchronization between clients while avoiding the
 * extremely low delays produced by full jitter.
 *
 * @param {number} baseDelayMs - The original backoff delay before jitter.
 * @returns {number} A delay between half of `baseDelay` and the full `baseDelay`.
 * @description Equal jitter is useful when you want a smoother, more predictable retry pattern that still avoids synchronized retries. It guarantees at least half of the base delay while adding randomness to the other half, giving you a balanced backoff that reduces contention without the extreme variability of full jitter.
 */
export function calculateEqualJitter(baseDelayMs: number): number {
    const halfDelay = baseDelayMs / 2;
    return halfDelay + Math.random() * halfDelay;
}

/**
 * Calculates a fixed‑jitter delay by subtracting a constant amount from the base delay. Unlike random jitter strategies, fixed jitter provides predictable timing while still preventing perfectly aligned retries.
 * Use this when you want a small, consistent desynchronization between clients without introducing randomness — ideal for stable systems where timing consistency matters more than wide jitter distribution.
 * @param {number} maxDelayMs - The original delay before applying jitter.
 * @param {number} jitterAmount - The fixed amount to subtract.
 * @returns {number} The delay after subtracting `jitterAmount`, never below zero.
 */
export function calculateFixedJitter(maxDelayMs: number, jitterAmount: number): number {
    return Math.max(0, maxDelayMs - jitterAmount);
}

/**
 * Calculates a random‑jitter backoff delay by applying a symmetric
 * random variation around the base delay. The jitter fraction determines
 * how far the delay may swing above or below the original value.
 *
 * Random jitter is useful when you want to “wiggle” the delay without
 * dramatically changing its overall shape. It provides light
 * desynchronization between clients while keeping the delay centered
 * around the base value — ideal for systems that need some variability
 * but not the wide spread of full jitter.
 *
 * @param {number} baseDelayMs - The original delay before jitter is applied.
 * @param {number} jitterFraction - Maximum fractional deviation (e.g., 0.2 for ±20%).
 * @returns {number} A jittered delay, clamped to zero if the calculation goes negative.
 */
export function calculateRandomJitter(baseDelayMs: number, jitterFraction: number): number {
    // Math.random() gives us 0 to 1 so multiply by 2 and subtract 1 to get -1 to 1 range
    const randomNumberBetweenJitterFraction = (Math.random() * 2 - 1) * jitterFraction;
    return Math.max(0, baseDelayMs * (1 + randomNumberBetweenJitterFraction));
}

/**
 * Calculates a decorrelated jitter backoff delay using the algorithm
 * popularized by AWS. Each retry delay is chosen randomly between the
 * base delay and three times the previous delay, then capped at the
 * maximum allowed delay. This prevents synchronized retry spikes and
 * produces a smooth, adaptive backoff pattern.
 *
 * Use this when you need highly desynchronized retries across many
 * clients—especially in distributed systems or high‑traffic services
 * where coordinated retry storms can overwhelm downstream resources.
 *
 * AWS reference:
 * https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
 *
 * @param {number} baseDelayMs - The minimum delay for any retry attempt.
 * @param {number} maxDelayMs - The maximum allowed delay.
 * @param {number} [prevDelayMs=0] - The delay used for the previous retry.
 * @returns {number} A jittered delay capped at `maxDelayMs`.
 */
export function calculateDecorrelatedJitter(baseDelayMs: number, maxDelayMs: number, prevDelayMs: number = 0): number {
    const upperDelayMs = Math.max(baseDelayMs, prevDelayMs * 3);
    const randomValueBetweenBaseDelayAnd3xPrevoiusDelay = baseDelayMs + Math.random() * (upperDelayMs - baseDelayMs);
    return Math.min(maxDelayMs, randomValueBetweenBaseDelayAnd3xPrevoiusDelay)
}