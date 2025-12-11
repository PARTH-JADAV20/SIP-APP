// In lib/api.js
const RATE_LIMIT = {
  windowMs: 60000, // 1 minute
  maxRequests: 30, // Max requests per window
  currentRequests: 0,
  lastReset: Date.now()
};

export async function fetchWithRateLimit(url, options = {}) {
  const now = Date.now();
  
  // Reset counter if window has passed
  if (now - RATE_LIMIT.lastReset > RATE_LIMIT.windowMs) {
    RATE_LIMIT.currentRequests = 0;
    RATE_LIMIT.lastReset = now;
  }

  // Check rate limit
  if (RATE_LIMIT.currentRequests >= RATE_LIMIT.maxRequests) {
    const waitTime = RATE_LIMIT.windowMs - (now - RATE_LIMIT.lastReset);
    await new Promise(resolve => setTimeout(resolve, waitTime));
    return fetchWithRateLimit(url, options);
  }

  // Make the request
  RATE_LIMIT.currentRequests++;
  const response = await fetch(url, options);
  
  // Handle rate limit headers if present
  if (response.headers.has('X-RateLimit-Remaining')) {
    const remaining = parseInt(response.headers.get('X-RateLimit-Remaining'), 10);
    const reset = parseInt(response.headers.get('X-RateLimit-Reset'), 10) * 1000;
    
    if (remaining <= 0) {
      const waitTime = reset - Date.now();
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      return fetchWithRateLimit(url, options);
    }
  }

  return response;
}