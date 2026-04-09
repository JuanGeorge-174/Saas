import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    // ⚠️ CRITICAL: Clinic Association (Multi-tenancy)
    clinicId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Clinic',
        required: true,
        index: true // CRITICAL for query performance
    },

    // Authentication
    loginId: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
        // Unique within clinic, not globally
    },
    passwordHash: {
        type: String,
        required: true,
        select: false // Don't return in queries by default
    },

    // Personal Information
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },

    // Role & Permissions
    role: {
        type: String,
        enum: ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'SUPER_ADMIN'],
        required: true,
        index: true
    },

    // Account Status
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    isDeleted: {
        type: Boolean,
        default: false,
        index: true
    },

    // Security: Account Lockout
    failedLoginAttempts: {
        type: Number,
        default: 0
    },

    // Activity Tracking
    lastLogin: {
        type: Date
    },
    lastLoginIP: {
        type: String
    },

    // Audit
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// ⚠️ CRITICAL: Compound index for clinic-scoped unique loginId
UserSchema.index({ clinicId: 1, loginId: 1 }, { unique: true });

// Compound index for email (unique within clinic, but email is optional)
UserSchema.index({ clinicId: 1, email: 1 }, { unique: true, sparse: true });

// Index for role-based queries within clinic
UserSchema.index({ clinicId: 1, role: 1 });

// Index for active user lookup
UserSchema.index({ clinicId: 1, isActive: 1 });

// Methods
UserSchema.methods.incrementFailedAttempts = async function () {
    this.failedLoginAttempts += 1;
    await this.save();
};

UserSchema.methods.resetFailedAttempts = async function () {
    this.failedLoginAttempts = 0;
    await this.save();
};

UserSchema.methods.updateLastLogin = async function (ipAddress) {
    this.lastLogin = new Date();
    this.lastLoginIP = ipAddress;
    await this.save();
};

// Static methods for clinic-scoped queries
UserSchema.statics.findByClinicAndLoginId = function (clinicId, loginId) {
    return this.findOne({ clinicId, loginId, isActive: true }).select('+passwordHash');
};

UserSchema.statics.findActiveUsersByClinic = function (clinicId) {
    return this.find({ clinicId, isActive: true }).select('-passwordHash');
};

UserSchema.statics.countUsersByClinic = function (clinicId) {
    return this.countDocuments({ clinicId, isActive: true });
};

// Pre-save middleware (Async version is more robust in Next.js)
UserSchema.pre('save', async function () {
    if (this.isModified('loginId') && this.loginId) {
        this.loginId = this.loginId.toLowerCase().trim();
    }
    // Prevent duplicate null/empty email errors on sparse index
    if (this.email === '' || this.email === null) {
        this.email = undefined;
    }
});

console.log('--- [MODEL] User model initialized (v2-fix) ---');

export default mongoose.models.User || mongoose.model('User', UserSchema);
