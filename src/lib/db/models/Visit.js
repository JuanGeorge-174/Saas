import mongoose from 'mongoose';

/**
 * VISIT MODEL - Core Entity for Queue & Operations
 * 
 * A Visit is created when:
 * 1. Appointment arrives (linked via appointmentId)
 * 2. Walk-in patient arrives (no appointmentId)
 * 
 * Visit drives:
 * - Queue display (sorted by arrivalTime)
 * - Doctor workflow
 * - Revenue (payments must link to visitId)
 * - Metrics (visited today count)
 */

const VisitSchema = new mongoose.Schema({
    // Multi-tenant isolation
    clinicId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Clinic',
        required: true,
        index: true
    },

    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
        index: true
    },

    // Link to appointment (null for walk-ins)
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
        default: null,
        index: true
    },

    // Visit classification
    visitType: {
        type: String,
        enum: ['APPOINTMENT', 'WALK_IN'],
        required: true,
        default: 'WALK_IN'
    },

    // Core timestamps for queue management
    visitDate: {
        type: Date,
        required: true,
        index: true
    },

    arrivalTime: {
        type: Date,
        required: true,
        index: true // Critical for queue sorting
    },

    exitTime: {
        type: Date,
        default: null
    },

    // Assigned doctor
    assignedDoctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false, // Can be assigned later
        index: true
    },

    // Clinical data
    chiefComplaint: {
        type: String,
        trim: true,
        default: ''
    },

    diagnosis: {
        type: String,
        trim: true,
        default: ''
    },

    treatment: {
        type: String,
        trim: true,
        default: ''
    },

    prescription: {
        type: String,
        trim: true,
        default: ''
    },

    doctorNotes: {
        type: String,
        trim: true,
        default: ''
    },

    // Queue workflow helpers
    waitingStoppedAt: {
        type: Date,
        default: null
    },

    doctorSigned: {
        type: Boolean,
        default: false,
        index: true
    },

    // File uploads (X-rays, reports, images)
    files: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File'
    }],

    // Visit status for queue management
    status: {
        type: String,
        enum: ['WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
        default: 'WAITING',
        required: true,
        index: true
    },

    // Audit fields
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }

}, {
    timestamps: true
});

// Compound indexes for performance
VisitSchema.index({ clinicId: 1, visitDate: 1, status: 1 }); // Queue queries
VisitSchema.index({ clinicId: 1, arrivalTime: 1 }); // Queue sorting
VisitSchema.index({ patientId: 1, visitDate: -1 }); // Patient history
VisitSchema.index({ clinicId: 1, assignedDoctorId: 1, status: 1 }); // Doctor queue

// Prevent duplicate active visits for same patient
VisitSchema.index(
    { clinicId: 1, patientId: 1, visitDate: 1, status: 1 },
    {
        unique: true,
        partialFilterExpression: { status: { $in: ['WAITING', 'IN_PROGRESS'] } }
    }
);

export default mongoose.models.Visit || mongoose.model('Visit', VisitSchema);
