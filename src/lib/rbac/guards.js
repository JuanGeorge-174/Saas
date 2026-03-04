import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/tokens';
import { ROLES, ROLE_PERMISSIONS } from '@/lib/rbac/permissions';

export async function authorize(req, requiredPermissions = []) {
    try {
        // 1. Extract Token
        const accessToken = req.cookies.get('accessToken')?.value;

        if (!accessToken) {
            return null; // Not authenticated
        }

        // 2. Verify Token
        const decoded = verifyAccessToken(accessToken);
        if (!decoded) {
            return null; // Invalid token
        }

        // 3. Check Permissions (RBAC)
        const userRole = decoded.role;
        const userPermissions = ROLE_PERMISSIONS[userRole] || [];

        const hasPermission = requiredPermissions.every(p => userPermissions.includes(p));

        if (!hasPermission) {
            // Authenticated but not authorized
            return false;
        }

        // 4. Return Session
        return {
            userId: decoded.userId,
            clinicId: decoded.clinicId,
            role: userRole,
        };

    } catch (error) {
        console.error('Authorization error:', error);
        return null;
    }
}

// Wrapper to simplify API responses
export async function secureRoute(req, requiredPermissions, handler) {
    const session = await authorize(req, requiredPermissions);

    if (session === null) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session === false) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return handler(req, session);
}
