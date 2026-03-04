import mongoose from 'mongoose';

const ClinicSchema = new mongoose.Schema({
    // Clinic Identity
    clinicName: {
        type: String,
        required: true,
        trim: true
    },
    clinicSlug: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },

    // Subscription
    subscriptionPlan: {
        type: String,
        enum: ['FREE', 'BASIC', 'PRO', 'ENTERPRISE'],
        default: 'FREE',
        required: true
    },
    subscriptionStatus: {
        type: String,
        enum: ['ACTIVE', 'SUSPENDED', 'CANCELLED', 'TRIAL'],
        default: 'ACTIVE',
        required: true
    },
    subscriptionStartDate: {
        type: Date,
        default: Date.now
    },
    subscriptionEndDate: {
        type: Date
    },

    // Admin Contact Info
    adminName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },

    // Clinic Details
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: { type: String, default: 'India' }
    },

    // Legal
    termsAccepted: {
        type: Boolean,
        required: true,
        default: false
    },
    termsAcceptedDate: {
        type: Date
    },

    // Status
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },

    // Usage Limits (based on plan)
    limits: {
        maxUsers: { type: Number, default: 3 },
        maxPatients: { type: Number, default: 100 },
        maxStorageGB: { type: Number, default: 1 }
    },

    // Current Usage
    usage: {
        userCount: { type: Number, default: 0 },
        patientCount: { type: Number, default: 0 },
        storageUsedMB: { type: Number, default: 0 }
    },

    // Timestamps
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

// Indexes for performance
ClinicSchema.index({ clinicName: 1 }, { unique: true });
ClinicSchema.index({ clinicSlug: 1 }, { unique: true });
ClinicSchema.index({ subscriptionStatus: 1, isActive: 1 });

// Pre-save middleware to generate slug (Async version is more robust)
ClinicSchema.pre('save', async function () {
    if (this.isModified('clinicName')) {
        this.clinicSlug = this.clinicName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
});

console.log('--- [MODEL] Clinic model initialized (v2-fix) ---');

// Methods
ClinicSchema.methods.isSubscriptionActive = function () {
    return this.subscriptionStatus === 'ACTIVE' && this.isActive;
};

ClinicSchema.methods.canAddUser = function () {
    return this.usage.userCount < this.limits.maxUsers;
};

ClinicSchema.methods.canAddPatient = function () {
    return this.usage.patientCount < this.limits.maxPatients;
};

ClinicSchema.methods.hasStorageSpace = function (sizeInMB) {
    return (this.usage.storageUsedMB + sizeInMB) <= (this.limits.maxStorageGB * 1024);
};

export default mongoose.models.Clinic || mongoose.model('Clinic', ClinicSchema);
