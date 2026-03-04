'use server';

import dbConnect from '@/lib/db/index';
import AuditLog from '@/lib/db/models/AuditLog';
import { authorize } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';

/**
 * GET AUDIT LOGS (ADMIN ONLY)
 */
export async function getAuditLogs(filters = {}) {
    try {
        await dbConnect();
        const session = await authorize(PERMISSIONS.VIEW_AUDIT_LOGS);
        const { clinicId } = session;

        const query = { clinicId };

        if (filters.userId) query.userId = filters.userId;
        if (filters.moduleName) query.moduleName = filters.moduleName;
        if (filters.action) query.action = filters.action;

        if (filters.startDate && filters.endDate) {
            query.timestamp = {
                $gte: new Date(filters.startDate),
                $lte: new Date(filters.endDate)
            };
        }

        const logs = await AuditLog.find(query)
            .populate('userId', 'fullName role')
            .sort({ timestamp: -1 })
            .limit(100)
            .lean();

        return {
            success: true,
            logs: logs.map(l => ({
                id: l._id.toString(),
                user: l.userId?.fullName || 'System',
                role: l.userId?.role || 'N/A',
                action: l.action,
                module: l.moduleName,
                resource: l.resource,
                resourceId: l.resourceId?.toString(),
                changes: l.changes,
                severity: l.severity,
                timestamp: l.timestamp
            }))
        };
    } catch (error) {
        return { success: false, error: 'Unauthorized' };
    }
}
