import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
    clinicId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Clinic',
        required: true,
        index: true
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    action: {
        type: String,
        required: true
    }, // e.g., "LOGIN", "PATIENT_CREATED", "APPOINTMENT_DELETED"

    moduleName: {
        type: String,
        required: true
    }, // e.g., "DASHBOARD", "PATIENTS", "APPOINTMENTS", "REVENUE"

    resource: {
        type: String,
        required: true
    }, // e.g., "USER", "PATIENT", "APPOINTMENT"

    resourceId: {
        type: mongoose.Schema.Types.ObjectId
    },

    changes: {
        type: Object
    }, // Store before/after values if necessary

    ipAddress: { type: String },
    userAgent: { type: String },

    severity: {
        type: String,
        enum: ['INFO', 'WARNING', 'CRITICAL'],
        default: 'INFO'
    },

    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
});

// Rotate logs or use TTL index if needed
// AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 31536000 }); // 1 year

export default mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
