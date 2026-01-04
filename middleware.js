import { NextResponse } from 'next/server';

// Simple in-memory rate limiter (for production, use Redis)
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // Max 100 requests per minute per IP

function getRateLimitKey(ip) {
    return `${ip}:${Math.floor(Date.now() / RATE_LIMIT_WINDOW)}`;
}

export function middleware(request) {
    const pathname = request.nextUrl.pathname;

    // Skip rate limiting for static files
    if (pathname.includes('_next') || pathname.includes('favicon')) {
        return NextResponse.next();
    }

    // Get client IP
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const key = getRateLimitKey(ip);

    // Check rate limit
    const currentCount = requestCounts.get(key) || 0;

    // AUTHENTICATION CHECK
    // Define public paths that don't require login
    const isPublicPath = pathname === '/login' || pathname === '/api/auth/login' || pathname.startsWith('/_next') || pathname.startsWith('/static') || pathname === '/favicon.ico';

    // Get session cookie
    const sessionCookie = request.cookies.get('session');
    const isAuthenticated = !!sessionCookie;

    // Redirect logic
    if (!isAuthenticated && !isPublicPath) {
        // Redirect to login if trying to access protected route
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (isAuthenticated && pathname === '/login') {
        // Redirect to dashboard if already logged in and trying to access login
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    if (currentCount >= RATE_LIMIT_MAX_REQUESTS && pathname.includes('/api/')) {
        return new NextResponse(JSON.stringify({
            error: 'Too many requests',
            message: 'Rate limit exceeded. Please try again later.',
            retryAfter: RATE_LIMIT_WINDOW / 1000
        }), {
            status: 429,
            headers: {
                'Content-Type': 'application/json',
                'Retry-After': Math.ceil(RATE_LIMIT_WINDOW / 1000).toString()
            },
        });
    }

    // Update request count
    requestCounts.set(key, currentCount + 1);

    // Clean up old entries periodically
    if (Math.random() < 0.01) { // 1% chance to cleanup
        requestCounts.forEach((value, key) => {
            const [, timestamp] = key.split(':');
            if (Math.floor(Date.now() / RATE_LIMIT_WINDOW) - parseInt(timestamp) > 2) {
                requestCounts.delete(key);
            }
        });
    }

    // Add security headers
    const response = NextResponse.next();

    // Security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');

    // CORS headers (adjust as needed for your domain)
    response.headers.set('Access-Control-Allow-Origin', 'http://localhost:3000');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return response;
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
