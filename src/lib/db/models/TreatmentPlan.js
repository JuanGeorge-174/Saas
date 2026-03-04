import mongoose from 'mongoose';

const TreatmentPlanSchema = new mongoose.Schema({
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
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: { type: String, trim: true },
    procedures: [{
        toothNumber: String,
        procedureName: String, // e.g., Root Canal, Filling
        status: {
            type: String,
            enum: ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
            default: 'PLANNED'
        },
        priority: {
            type: String,
            enum: ['LOW', 'MEDIUM', 'HIGH'],
            default: 'MEDIUM'
        },
        estimatedCost: Number,
        notes: String
    }],
    totalEstimatedCost: { type: Number, default: 0 },
    status: {
        type: String,
        enum: ['DRAFT', 'ACTIVE', 'COMPLETED', 'ABANDONED'],
        default: 'ACTIVE',
        index: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

TreatmentPlanSchema.index({ clinicId: 1, patientId: 1 });

export default mongoose.models.TreatmentPlan || mongoose.model('TreatmentPlan', TreatmentPlanSchema);
