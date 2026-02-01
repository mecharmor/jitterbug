/**
 * Jitterbug - A lightweight library for building reliable retry behavior
 */

export { retry, calculateDelay, sleep, type RetryOptions, type BackoffStrategy } from './retry';

import * as jitterFunctions from './jitter';
import { retry } from './retry';

export default {
  retry,
  ...jitterFunctions
};
