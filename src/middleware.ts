import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

/**
 * Centralized Edge Middleware (SEC-003)
 * 
 * Runs on Vercel's Edge Runtime BEFORE any route handler executes.
 * Provides a single security gate for all protected endpoints,
 * eliminating the need for copy-pasting auth logic across 30+ routes.
 * 
 * Public routes (login, register, respond, health, feed) are explicitly allowed.
 * All other /api/* routes require a valid Bearer token.
 */

const PUBLIC_API_ROUTES = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/password',
    '/api/health',
    '/api/feed',
    '/api/pusher/auth',
];

// Routes that need auth optionally (check inside handler)
const OPTIONAL_AUTH_PATTERNS = [
    /^\/api\/surveys\/[^/]+\/respond$/,  // respond endpoint allows anon
    /^\/api\/surveys\/[^/]+$/,           // GET survey by ID is public
];

function isPublicRoute(pathname: string): boolean {
    if (PUBLIC_API_ROUTES.includes(pathname)) return true;
    return OPTIONAL_AUTH_PATTERNS.some(pattern => pattern.test(pathname));
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Only intercept API routes
    if (!pathname.startsWith('/api/')) {
        return NextResponse.next();
    }

    // Allow public API routes
    if (isPublicRoute(pathname)) {
        return NextResponse.next();
    }

    // Extract and verify JWT
    const authHeader = request.headers.get('authorization');
    const cookieToken = request.cookies.get('token')?.value;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : cookieToken;

    if (!token) {
        return NextResponse.json(
            { success: false, message: 'Authentication required' },
            { status: 401 }
        );
    }

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
        const { payload } = await jwtVerify(token, secret);

        // Inject user ID into request headers for downstream route handlers
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-user-id', payload.userId as string);
        requestHeaders.set('x-user-email', payload.email as string);

        return NextResponse.next({
            request: { headers: requestHeaders },
        });
    } catch {
        return NextResponse.json(
            { success: false, message: 'Invalid or expired token' },
            { status: 401 }
        );
    }
}

export const config = {
    matcher: ['/api/:path*'],
};
