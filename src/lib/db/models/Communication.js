import mongoose from 'mongoose';

const CommunicationSchema = new mongoose.Schema({
    clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true, index: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Staff who logged it

    type: {
        type: String,
        enum: ['CALL', 'SMS', 'EMAIL', 'WHATSAPP', 'IN_PERSON'],
        required: true
    },

    direction: {
        type: String,
        enum: ['INBOUND', 'OUTBOUND'],
        required: true
    },

    status: {
        type: String,
        enum: ['SENT', 'RECEIVED', 'FAILED', 'PENDING'],
        default: 'SENT'
    },

    summary: { type: String, required: true },

    createdAt: { type: Date, default: Date.now },
});

// Timeline Index
CommunicationSchema.index({ clinicId: 1, patientId: 1, createdAt: -1 });

export default mongoose.models.Communication || mongoose.model('Communication', CommunicationSchema);
