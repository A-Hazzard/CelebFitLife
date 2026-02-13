// Progressive rate limiter for error attempts
// For production, consider using Redis or a dedicated service

interface RateLimitStore {
  [key: string]: {
    errorCount: number; // Consecutive error attempts (resets after timeout)
    resetTime: number; // When the timeout expires
    lastErrorTime: number; // Last time an error occurred
    timeoutLevel: number; // Which timeout level we're at (0 = 1min, 1 = 5min, 2 = 10min, 3 = 24h)
  };
}

interface SignupRateLimitStore {
  [key: string]: {
    hourlySignups: number; // Number of signups in the current hour
    dailySignups: number; // Number of signups in the current day
    hourlyResetTime: number; // When the hourly window resets
    dailyResetTime: number; // When the daily window resets
  };
}

const store: RateLimitStore = {};
const signupStore: SignupRateLimitStore = {};

// Progressive timeout durations in milliseconds
const TIMEOUT_DURATIONS = [
  1 * 60 * 1000,      // 1 minute
  5 * 60 * 1000,      // 5 minutes
  10 * 60 * 1000,     // 10 minutes
  24 * 60 * 60 * 1000 // 24 hours (tomorrow)
];

// Signup rate limiting constants
const MAX_SIGNUPS_PER_HOUR = 5;
const MAX_SIGNUPS_PER_DAY = 10;
const HOUR_IN_MS = 60 * 60 * 1000; // 1 hour
const DAY_IN_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Rate limiter for signups to prevent spam
 * Enforces: max 5 signups per hour OR max 10 signups per day per IP
 */
export function rateLimitSignups(
  identifier: string
): { allowed: boolean; reason?: string; resetTime?: number; hourlyRemaining?: number; dailyRemaining?: number } {
  const now = Date.now();
  const key = identifier;

  // Initialize or clean expired entries
  if (!signupStore[key]) {
    signupStore[key] = {
      hourlySignups: 0,
      dailySignups: 0,
      hourlyResetTime: now + HOUR_IN_MS,
      dailyResetTime: now + DAY_IN_MS,
    };
  }

  // Reset hourly counter if window expired
  if (signupStore[key].hourlyResetTime < now) {
    signupStore[key].hourlySignups = 0;
    signupStore[key].hourlyResetTime = now + HOUR_IN_MS;
  }

  // Reset daily counter if window expired
  if (signupStore[key].dailyResetTime < now) {
    signupStore[key].dailySignups = 0;
    signupStore[key].dailyResetTime = now + DAY_IN_MS;
  }

  // Check hourly limit
  if (signupStore[key].hourlySignups >= MAX_SIGNUPS_PER_HOUR) {
    const minutesRemaining = Math.ceil((signupStore[key].hourlyResetTime - now) / (60 * 1000));
    return {
      allowed: false,
      reason: `Too many signups. Maximum ${MAX_SIGNUPS_PER_HOUR} signups per hour. Try again in ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}.`,
      resetTime: signupStore[key].hourlyResetTime,
      hourlyRemaining: 0,
      dailyRemaining: Math.max(0, MAX_SIGNUPS_PER_DAY - signupStore[key].dailySignups),
    };
  }

  // Check daily limit
  if (signupStore[key].dailySignups >= MAX_SIGNUPS_PER_DAY) {
    const hoursRemaining = Math.ceil((signupStore[key].dailyResetTime - now) / (60 * 60 * 1000));
    return {
      allowed: false,
      reason: `Too many signups. Maximum ${MAX_SIGNUPS_PER_DAY} signups per day. Try again in ${hoursRemaining} hour${hoursRemaining !== 1 ? 's' : ''}.`,
      resetTime: signupStore[key].dailyResetTime,
      hourlyRemaining: Math.max(0, MAX_SIGNUPS_PER_HOUR - signupStore[key].hourlySignups),
      dailyRemaining: 0,
    };
  }

  // Increment both counters
  signupStore[key].hourlySignups++;
  signupStore[key].dailySignups++;

  return {
    allowed: true,
    hourlyRemaining: Math.max(0, MAX_SIGNUPS_PER_HOUR - signupStore[key].hourlySignups),
    dailyRemaining: Math.max(0, MAX_SIGNUPS_PER_DAY - signupStore[key].dailySignups),
  };
}

export function rateLimitErrors(
  identifier: string
): { allowed: boolean; resetTime: number; timeoutMinutes: number } {
  const now = Date.now();
  const key = identifier;

  // Clean up expired entries
  if (store[key] && store[key].resetTime < now) {
    // Timeout expired - reset error count but keep timeout level
    // This allows progressive timeouts: after 1min timeout, next 5 errors = 5min timeout
    store[key].errorCount = 0;
    store[key].resetTime = 0;
  }

  // Initialize or get existing entry
  if (!store[key]) {
    store[key] = {
      errorCount: 0,
      resetTime: 0,
      lastErrorTime: 0,
      timeoutLevel: 0,
    };
  }

  // Check if currently in timeout period
  if (store[key].resetTime > now) {
    const timeoutMinutes = Math.ceil((store[key].resetTime - now) / (60 * 1000));
    return {
      allowed: false,
      resetTime: store[key].resetTime,
      timeoutMinutes,
    };
  }

  // Allow the request (errors will be recorded separately)
  return {
    allowed: true,
    resetTime: 0,
    timeoutMinutes: 0,
  };
}


export function recordError(identifier: string): { shouldTimeout: boolean; timeoutMinutes: number; resetTime: number } {
  const key = identifier;
  const now = Date.now();

  if (!store[key]) {
    store[key] = {
      errorCount: 0,
      resetTime: 0,
      lastErrorTime: 0,
      timeoutLevel: 0,
    };
  }

  // If currently in timeout, don't increment
  if (store[key].resetTime > now) {
    return {
      shouldTimeout: true,
      timeoutMinutes: Math.ceil((store[key].resetTime - now) / (60 * 1000)),
      resetTime: store[key].resetTime,
    };
  }

  // Increment error count
  store[key].errorCount++;
  store[key].lastErrorTime = now;

  // Check if we've hit the error threshold (5 errors)
  if (store[key].errorCount >= 5) {
    // Use current timeout level to determine duration
    const timeoutIndex = Math.min(store[key].timeoutLevel, TIMEOUT_DURATIONS.length - 1);
    const timeoutDuration = TIMEOUT_DURATIONS[timeoutIndex];

    store[key].resetTime = now + timeoutDuration;

    // Increment timeout level for next time (but cap at max)
    if (store[key].timeoutLevel < TIMEOUT_DURATIONS.length - 1) {
      store[key].timeoutLevel++;
    }

    const timeoutMinutes = Math.ceil(timeoutDuration / (60 * 1000));
    return {
      shouldTimeout: true,
      timeoutMinutes,
      resetTime: store[key].resetTime,
    };
  }

  return {
    shouldTimeout: false,
    timeoutMinutes: 0,
    resetTime: 0,
  };
}

export function recordSuccess(identifier: string): void {
  const key = identifier;

  // Reset error count and timeout level on successful request
  if (store[key]) {
    store[key].errorCount = 0;
    store[key].resetTime = 0;
    store[key].timeoutLevel = 0; // Reset to first timeout level
  }
}

// Legacy function for backward compatibility (not used for error-based limiting)
export function rateLimit(
  identifier: string,
  maxRequests: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = identifier;

  // Clean up expired entries
  if (store[key] && store[key].resetTime < now) {
    delete store[key];
  }

  // Initialize or get existing entry
  if (!store[key]) {
    store[key] = {
      errorCount: 0,
      resetTime: now + windowMs,
      lastErrorTime: 0,
      timeoutLevel: 0,
    };
  }

  // Check if limit exceeded
  if (store[key].errorCount >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: store[key].resetTime,
    };
  }

  // Increment count
  store[key].errorCount++;

  return {
    allowed: true,
    remaining: maxRequests - store[key].errorCount,
    resetTime: store[key].resetTime,
  };
}

export function getClientIdentifier(request: Request): string {
  // Try to get IP from various headers (for production behind proxy)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';

  return ip;
}

