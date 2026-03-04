import { NextResponse } from 'next/server';
import { clearAuthCookies } from '@/lib/auth/cookies';

export async function POST(req) {
    const response = NextResponse.json({ success: true });
    clearAuthCookies(response);

    // Optional: Log logout event (non-blocking)
    try {
        const { logAction } = await import('@/lib/audit');
        // We'd need to extract user from token before clearing cookies to log who logged out
        // For now, base success
    } catch (e) { }

    return response;
}
