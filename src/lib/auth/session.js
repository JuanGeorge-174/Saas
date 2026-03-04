import { cookies } from 'next/headers';
import { verifyAccessToken } from './tokens';
import { hasPermission } from '../rbac/permissions';

/**
 * PRODUCTION SECURE SESSION HELPER
 * Extracts and verifies the session from HttpOnly cookies.
 * Guaranteed multi-tenant isolation by providing clinicId.
 */
export async function getSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;

    if (!token) return null;

    const decoded = verifyAccessToken(token);
    if (!decoded || !decoded.clinicId || !decoded.userId) return null;

    return {
        userId: decoded.userId,
        clinicId: decoded.clinicId,
        role: decoded.role
    };
}

/**
 * API GUARD
 * Ensures user is logged in, belongs to a clinic, and has required permission.
 * Returns the session or throws an error.
 */
export async function authorize(permission = null) {
    const session = await getSession();

    if (!session) {
        const error = new Error('Unauthorized');
        error.status = 401;
        throw error;
    }

    if (permission && !hasPermission(session.role, permission)) {
        const error = new Error('Forbidden: Insufficient permissions');
        error.status = 403;
        throw error;
    }

    return session;
}
