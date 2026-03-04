import mongoose from 'mongoose';

const ClinicalNoteSchema = new mongoose.Schema({
    clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true, index: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' }, // Optional link

    content: { type: String, required: true }, // Structured JSON or Markdown

    teethInvolved: [{ type: String }], // ISO/FDI Notation (e.g., '18', '24')
    treatmentCodes: [{ type: String }], // CDT/ADA placeholder codes

    isDraft: { type: Boolean, default: true },
    signedAt: { type: Date }, // When the doctor finalized it (immutability start)

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

// History Index
ClinicalNoteSchema.index({ clinicId: 1, patientId: 1, createdAt: -1 });

export default mongoose.models.ClinicalNote || mongoose.model('ClinicalNote', ClinicalNoteSchema);
