import mongoose from 'mongoose';

const PatientSchema = new mongoose.Schema({
    clinicId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Clinic',
        required: true,
        index: true
    },

    // Permanent Identity
    fullName: {
        type: String,
        required: false, // Changed from true to support legacy data
        trim: true
    },

    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },

    dateOfBirth: {
        type: Date,
        required: false // Changed from true to support legacy data
    },

    dob: { type: Date },

    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
        required: false // Changed from true
    },

    sex: { type: String },
    phone: { type: String, trim: true },
    age: { type: Number },

    // Family Member Handling
    contactId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contact',
        required: false, // Changed from true to allow patients without contacts (legacy)
        index: true
    },

    relationToContact: {
        type: String,
        enum: ['self', 'son', 'daughter', 'spouse', 'parent', 'other'],
        required: true,
        default: 'self'
    },

    // Metadata
    patientId: {
        type: String,
        required: true, // Manual clinic-scoped ID (P-1001)
        trim: true
    },

    status: {
        type: String,
        enum: ['ACTIVE', 'ARCHIVED', 'LEAD', 'BAD_DEBT'],
        default: 'ACTIVE',
        index: true
    },

    // Clinical & Demographic
    address: {
        type: String,
        trim: true
    },

    medicalHistory: {
        type: String,
        default: ''
    },

    allergies: {
        type: String,
        default: ''
    },

    // Lifecycle
    lastContacted: { type: Date },
    lastVisitDate: { type: Date },
    recallDate: { type: Date, index: true },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    isDeleted: {
        type: Boolean,
        default: false,
        index: true
    }
}, {
    timestamps: true
});

// Production Indexes
PatientSchema.index({ clinicId: 1, fullName: 1, dateOfBirth: 1 }); // Strong match lookup
PatientSchema.index({ clinicId: 1, patientId: 1 }, { unique: true });
// contactId already has index: true on the field; avoid duplicate schema index warnings

// Force model cleanup for Dev hot-reloads
if (process.env.NODE_ENV === 'development') {
    delete mongoose.models.Patient;
}

export default mongoose.models.Patient || mongoose.model('Patient', PatientSchema);
