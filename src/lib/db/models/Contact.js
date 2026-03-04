import mongoose from 'mongoose';

const ContactSchema = new mongoose.Schema({
    clinicId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Clinic',
        required: true,
        index: true
    },
    phoneNumber: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    email: {
        type: String,
        lowercase: true,
        trim: true,
        default: ''
    }
}, {
    timestamps: true
});

// Ensure phone number lookup is fast per clinic
ContactSchema.index({ clinicId: 1, phoneNumber: 1 });

export default mongoose.models.Contact || mongoose.model('Contact', ContactSchema);
