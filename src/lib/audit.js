import AuditLog from '@/lib/db/models/AuditLog';
import dbConnect from '@/lib/db/index';

/**
 * CORE AUDIT LOGGING UTILITY
 * Logs critical actions for compliance and debugging.
 */
export async function logAction({
    clinicId,
    userId,
    action,
    moduleName,
    resource,
    resourceId = null,
    changes = null,
    severity = 'INFO'
}) {
    try {
        await dbConnect();
        await AuditLog.create({
            clinicId,
            userId,
            action,
            moduleName,
            resource,
            resourceId,
            changes,
            severity,
            timestamp: new Date()
        });
    } catch (error) {
        // Fallback for logging failure (don't break the main action)
        console.error('CRITICAL: Audit log failed:', error);
    }
}
