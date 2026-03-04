import { NextResponse } from 'next/server';

export function middleware(req) {
    const path = req.nextUrl.pathname;

    // Check if it's a dashboard route
    if (path.startsWith('/admin') || path.startsWith('/doctor') || path.startsWith('/reception')) {
        const accessToken = req.cookies.get('accessToken')?.value;

        if (!accessToken) {
            const url = req.nextUrl.clone();
            url.pathname = '/login';
            url.searchParams.set('callbackUrl', path);
            return NextResponse.redirect(url);
        }

        // Temporarily skip deep verification in middleware to avoid Edge/JWT issues
        // Authentication and Authorization are still strictly enforced at the API layer.
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*', '/doctor/:path*', '/reception/:path*'],
};
