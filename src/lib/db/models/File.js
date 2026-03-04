import mongoose from 'mongoose';

const FileSchema = new mongoose.Schema({
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

    visitId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Visit'
    },

    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    fileName: {
        type: String,
        required: true
    },

    fileType: {
        type: String,
        required: true
    },

    fileSize: {
        type: Number, // in bytes
        required: true
    },

    filePath: {
        type: String,
        required: true
    },

    category: {
        type: String,
        enum: ['XRAY', 'REPORT', 'PRESCRIPTION', 'OTHER'],
        default: 'OTHER'
    },

    accessibleBy: [{
        type: String,
        enum: ['ADMIN', 'DOCTOR', 'RECEPTIONIST']
    }],

    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

FileSchema.index({ clinicId: 1, patientId: 1 });

export default mongoose.models.File || mongoose.model('File', FileSchema);
