import mongoose from 'mongoose';

/**
 * APPOINTMENT MODEL
 * 
 * Represents a scheduled slot (may exist without a registered Patient).
 *
 * Workflow alignment:
 * - BOOKING is separate from VISIT (patient is a person, visit is an encounter)
 * - On ARRIVAL, system creates a Visit and links it here via visitId
 * - MISSED is auto-derived by dashboard metrics logic (grace period)
 */

const AppointmentSchema = new mongoose.Schema({
    clinicId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Clinic',
        required: true,
        index: true
    },

    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: false, // appointments may exist before patient registration
        index: true
    },

    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false, // can be assigned later
        index: true
    },

    /**
     * Canonical scheduling fields used by dashboard APIs
     */
    appointmentDate: { type: Date, index: true }, // Date-only boundary queries
    appointmentTime: { type: String, trim: true }, // "HH:mm" (UI)
    startDateTime: { type: Date, index: true }, // precise sorting + missed detection
    endDateTime: { type: Date, index: true }, // derived from startDateTime + duration (for conflict checks)
    duration: { type: Number, default: 30, min: 5 }, // minutes

    /**
     * Backward-compat fields (legacy server actions)
     * Prefer appointmentDate/appointmentTime/startDateTime going forward.
     */
    date: { type: Date, index: true },
    time: { type: String, trim: true },

    status: {
        type: String,
        enum: ['SCHEDULED', 'ARRIVED', 'COMPLETED', 'MISSED', 'CANCELLED', 'RESCHEDULED'],
        default: 'SCHEDULED',
        index: true
    },

    // Arrival tracking (set on check-in)
    arrivalTime: { type: Date, default: null, index: true },

    // Visit linkage (set when converted/arrived)
    visitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Visit', default: null, index: true },

    // Rescheduling history (full audit trail preserved)
    rescheduledFromId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', default: null, index: true },
    supersededById: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', default: null, index: true },

    visitReason: {
        type: String,
        trim: true,
        default: ''
    },

    notes: { type: String, trim: true, default: '' },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Production Indexes
AppointmentSchema.index({ clinicId: 1, appointmentDate: 1, status: 1 });
AppointmentSchema.index({ clinicId: 1, startDateTime: 1, status: 1 });
AppointmentSchema.index({ patientId: 1, startDateTime: -1 });
AppointmentSchema.index({ clinicId: 1, doctorId: 1, startDateTime: 1 });

// Normalize legacy fields for older code paths
AppointmentSchema.pre('validate', function () {
    // If only legacy date/time provided, hydrate canonical fields
    if (!this.startDateTime && (this.date || this.appointmentDate) && (this.time || this.appointmentTime)) {
        const base = new Date(this.appointmentDate || this.date);
        const timeStr = (this.appointmentTime || this.time || '').trim();

        // Expect "HH:mm" (fallback: keep as date-only if parse fails)
        const match = /^(\d{1,2}):(\d{2})$/.exec(timeStr);
        if (match) {
            base.setHours(parseInt(match[1], 10), parseInt(match[2], 10), 0, 0);
            this.startDateTime = base;
        }

        this.appointmentDate = this.appointmentDate || new Date(base.setHours(0, 0, 0, 0));
        this.appointmentTime = this.appointmentTime || timeStr;
    }

    // Keep legacy mirrors in sync for any remaining callers
    if (this.appointmentDate && !this.date) this.date = this.appointmentDate;
    if (this.appointmentTime && !this.time) this.time = this.appointmentTime;

    // Derive endDateTime for reliable overlap checks
    if (this.startDateTime && this.duration) {
        const end = new Date(this.startDateTime.getTime() + this.duration * 60 * 1000);
        this.endDateTime = end;
    }
});

export default mongoose.models.Appointment || mongoose.model('Appointment', AppointmentSchema);
