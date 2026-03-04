import mongoose from 'mongoose';

const MedicalRecordSchema = new mongoose.Schema({
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
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
        required: true,
        index: true
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    doctorNotes: {
        type: String,
        required: true,
        trim: true
    },
    uploadedFiles: [{
        fileName: String,
        filePath: String,
        fileType: String,
        uploadedAt: { type: Date, default: Date.now }
    }]
}, {
    timestamps: true
});

// Production Indexes
MedicalRecordSchema.index({ patientId: 1, createdAt: -1 });

export default mongoose.models.MedicalRecord || mongoose.model('MedicalRecord', MedicalRecordSchema);
