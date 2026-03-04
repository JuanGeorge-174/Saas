import { serialize } from 'cookie';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export function setAuthCookies(res, accessToken, refreshToken) {
    // Access Token: Short-lived, HttpOnly, Strict SameSite
    const accessCookie = serialize('accessToken', accessToken, {
        httpOnly: true,
        secure: IS_PRODUCTION,
        sameSite: 'strict',
        path: '/',
        maxAge: 15 * 60, // 15 minutes
    });

    // Refresh Token: Long-lived, HttpOnly, Strict, Path-restricted for safety
    const refreshCookie = serialize('refreshToken', refreshToken, {
        httpOnly: true,
        secure: IS_PRODUCTION,
        sameSite: 'strict',
        path: '/api/auth', // Only sent to auth routes
        maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    res.headers.set('Set-Cookie', accessCookie);
    res.headers.append('Set-Cookie', refreshCookie);
}

export function clearAuthCookies(res) {
    const expiredAccess = serialize('accessToken', '', {
        httpOnly: true,
        secure: IS_PRODUCTION,
        sameSite: 'strict',
        path: '/',
        maxAge: -1,
    });

    const expiredRefresh = serialize('refreshToken', '', {
        httpOnly: true,
        secure: IS_PRODUCTION,
        sameSite: 'strict',
        path: '/api/auth',
        maxAge: -1,
    });

    res.headers.set('Set-Cookie', expiredAccess);
    res.headers.append('Set-Cookie', expiredRefresh);
}
