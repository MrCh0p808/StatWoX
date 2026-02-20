import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/jwt';

// Paths that do not require authentication
const PUBLIC_PATHS = [
    '/',
    '/login',
    '/register',
    '/api/auth/login',
    '/api/auth/register',
    '/api/health',
    '/_next',
    '/favicon.ico',
    '/static'
];

export default async function proxy(request: NextRequest) {
    const startTime = Date.now();
    const { pathname, search } = request.nextUrl;

    const terminate = (response: NextResponse) => {
        const duration = Date.now() - startTime;
        console.log(`[API Proxy] ${request.method} ${pathname}${search} - Status: ${response.status} (${duration}ms)`);
        return response;
    };

    // Check if the path is public
    if (PUBLIC_PATHS.some(path => pathname === path || pathname.startsWith(path + '/'))) {
        return terminate(NextResponse.next());
    }

    // Get the token from the header or cookies
    const token = request.headers.get('Authorization')?.replace('Bearer ', '') ||
        request.cookies.get('token')?.value;

    if (!token) {
        // If it's an API route, return 401
        if (pathname.startsWith('/api')) {
            return terminate(NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 }));
        }
        // Otherwise redirect to login
        return terminate(NextResponse.redirect(new URL('/login', request.url)));
    }

    // Verify the token
    const payload = await verifyToken(token);

    if (!payload) {
        if (pathname.startsWith('/api')) {
            return terminate(NextResponse.json({ success: false, message: 'Invalid Token' }, { status: 401 }));
        }
        return terminate(NextResponse.redirect(new URL('/login', request.url)));
    }

    return terminate(NextResponse.next());
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
