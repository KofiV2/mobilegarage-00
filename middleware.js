// Edge Middleware for Rate Limiting
// Protects against abuse by limiting requests per IP

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute window
const MAX_REQUESTS = 60; // Max requests per window

// Simple in-memory store (resets on cold start, but effective for burst protection)
const rateLimitStore = new Map();

function getRateLimitKey(ip) {
  return `rate_limit:${ip}`;
}

function isRateLimited(ip) {
  const key = getRateLimitKey(ip);
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record) {
    rateLimitStore.set(key, { count: 1, windowStart: now });
    return false;
  }

  // Reset window if expired
  if (now - record.windowStart > RATE_LIMIT_WINDOW) {
    rateLimitStore.set(key, { count: 1, windowStart: now });
    return false;
  }

  // Increment count
  record.count++;

  if (record.count > MAX_REQUESTS) {
    return true;
  }

  return false;
}

function cleanupOldEntries() {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now - record.windowStart > RATE_LIMIT_WINDOW * 2) {
      rateLimitStore.delete(key);
    }
  }
}

export default function middleware(request) {
  // Get client IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';

  // Skip rate limiting for static assets
  const url = new URL(request.url);
  const staticExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2'];
  if (staticExtensions.some(ext => url.pathname.endsWith(ext))) {
    return;
  }

  // Periodic cleanup
  if (Math.random() < 0.01) {
    cleanupOldEntries();
  }

  // Check rate limit
  if (isRateLimited(ip)) {
    return new Response(
      JSON.stringify({
        error: 'Too Many Requests',
        message: 'Please wait a moment before trying again.',
        retryAfter: 60
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '60',
          'X-RateLimit-Limit': MAX_REQUESTS.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': (Date.now() + RATE_LIMIT_WINDOW).toString()
        }
      }
    );
  }

  // Continue with request
  return;
}

export const config = {
  matcher: [
    // Match all paths except static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
