import mongoose from 'mongoose';

/**
 * PAYMENT MODEL
 * 
 * Every payment MUST link to a specific Visit.
 * Supports partial payments with a full audit trail of transactions.
 * Automatic status derivation: PAID, PARTIAL, PENDING.
 */

const PaymentSchema = new mongoose.Schema({
    clinicId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Clinic',
        required: true,
        index: true
    },

    isManual: {
        type: Boolean,
        default: false
    },

    manualPatientName: {
        type: String,
        trim: true
    },

    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: function() { return !this.isManual; },
        index: true
    },

    visitId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Visit',
        required: function() { return !this.isManual; },
        index: true
    },

    totalAmount: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },

    paidAmount: {
        type: Number,
        default: 0,
        min: 0
    },

    pendingAmount: {
        type: Number,
        default: 0
    },

    status: {
        type: String,
        enum: ['PAID', 'PARTIAL', 'PENDING'],
        default: 'PENDING',
        index: true
    },

    // Detailed audit trail of all payments made against this bill
    transactionHistory: [{
        amount: { type: Number, required: true },
        mode: {
            type: String,
            enum: ['CASH', 'CARD', 'UPI', 'INSURANCE', 'OTHER'],
            required: true
        },
        timestamp: { type: Date, default: Date.now },
        receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        note: String
    }],

    paymentDate: {
        type: Date,
        default: Date.now,
        index: true
    },

    notes: { type: String, trim: true },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Calculate pending amount and status before saving
PaymentSchema.pre('save', function () {
    // Round to 2 decimal places to avoid float issues
    this.totalAmount = Math.round(this.totalAmount * 100) / 100;
    this.paidAmount = Math.round(this.paidAmount * 100) / 100;

    this.pendingAmount = Math.max(0, this.totalAmount - this.paidAmount);

    if (this.pendingAmount <= 0) {
        this.status = 'PAID';
    } else if (this.paidAmount > 0) {
        this.status = 'PARTIAL';
    } else {
        this.status = 'PENDING';
    }
});

// Composite indexes for fast revenue reports
PaymentSchema.index({ clinicId: 1, paymentDate: 1, status: 1 });
PaymentSchema.index({ clinicId: 1, visitId: 1 });

export default mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);
