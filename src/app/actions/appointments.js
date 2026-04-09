'use server';

import mongoose from 'mongoose';
import dbConnect from '@/lib/db/index';
import Appointment from '@/lib/db/models/Appointment';
import Patient from '@/lib/db/models/Patient';
import Visit from '@/lib/db/models/Visit';
import { authorize } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { logAction } from '@/lib/audit';
import { revalidatePath } from 'next/cache';

/**
 * CREATE APPOINTMENT (Minimal Info)
 * On arrival, this can be linked to a registered patient.
 */
export async function createAppointment(data) {
    try {
        await dbConnect();
        const session = await authorize(PERMISSIONS.MANAGE_APPOINTMENTS);
        const { clinicId, userId } = session;

        // NOTE: Workflow allows appointments without a Patient; UI currently selects a patient.
        if (!data?.patientId) {
            return { success: false, error: 'Patient is required (lead appointments not enabled yet)' };
        }
        if (!data?.date || !data?.time) {
            return { success: false, error: 'Date and time are required' };
        }

        // Canonical startDateTime (YYYY-MM-DD + HH:mm)
        const startDateTime = new Date(data.date);
        const [hh, mm] = String(data.time).split(':').map(v => parseInt(v, 10));
        if (Number.isFinite(hh) && Number.isFinite(mm)) {
            startDateTime.setHours(hh, mm, 0, 0);
        }

        const appointment = await Appointment.create({
            clinicId,
            patientId: data.patientId,
            doctorId: data.doctorId || null,
            appointmentDate: new Date(new Date(data.date).setHours(0, 0, 0, 0)),
            appointmentTime: data.time,
            startDateTime,
            duration: data.duration || 30,
            visitReason: data.visitReason || '',
            notes: data.notes || data.visitReason || '',
            status: 'SCHEDULED',
            createdBy: userId
        });

        await logAction({
            clinicId,
            userId,
            action: 'APPOINTMENT_CREATED',
            moduleName: 'APPOINTMENTS',
            resource: 'APPOINTMENT',
            resourceId: appointment._id,
            changes: { patientId: data.patientId, date: data.date },
            severity: 'INFO'
        });

        revalidatePath('/admin/appointments');
        return { success: true, id: appointment._id.toString() };
    } catch (error) {
        console.error('Appointment Creation Error:', error);
        return { success: false, error: 'Failed to create appointment' };
    }
}

/**
 * UPDATE APPOINTMENT DOCTOR ASSIGNMENT
 */
export async function updateAppointmentDoctor(id, doctorId) {
    try {
        await dbConnect();
        const session = await authorize(PERMISSIONS.MANAGE_APPOINTMENTS);
        const { clinicId, userId } = session;

        const appointment = await Appointment.findOneAndUpdate(
            { _id: id, clinicId },
            { doctorId: doctorId },
            { new: true }
        );

        if (!appointment) return { success: false, error: 'Appointment not found' };

        await logAction({
            clinicId,
            userId,
            action: 'APPOINTMENT_DOCTOR_UPDATED',
            moduleName: 'APPOINTMENTS',
            resource: 'APPOINTMENT',
            resourceId: appointment._id,
            changes: { doctorId },
            severity: 'INFO'
        });

        revalidatePath('/admin/appointments');
        revalidatePath('/admin'); // For dashboard queue

        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to update doctor' };
    }
}

/**
 * UPDATE APPOINTMENT STATUS (Lifecycle)
 */
export async function updateAppointmentStatus(id, status) {
    try {
        await dbConnect();
        const session = await authorize(PERMISSIONS.MANAGE_APPOINTMENTS);
        const { clinicId, userId } = session;

        const nextStatus = String(status || '').toUpperCase();
        if (nextStatus === 'ARRIVED') {
            // Arrival must create a Visit (handled by /api/dashboard/live-queue/arrive)
            return { success: false, error: 'Use Arrival Flow to mark ARRIVED (creates the Visit + queue entry).' };
        }

        const appointment = await Appointment.findOneAndUpdate(
            { _id: id, clinicId },
            { status: nextStatus },
            { new: true }
        );

        if (!appointment) return { success: false, error: 'Appointment not found' };

        await logAction({
            clinicId,
            userId,
            action: 'APPOINTMENT_STATUS_UPDATED',
            moduleName: 'APPOINTMENTS',
            resource: 'APPOINTMENT',
            resourceId: appointment._id,
            changes: { status: nextStatus },
            severity: 'INFO'
        });

        revalidatePath('/admin/appointments');
        revalidatePath('/admin'); // For dashboard queue if it reacts to appointments

        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to update status' };
    }
}

/**
 * GET APPOINTMENTS (Filtered)
 */
export async function getAppointments(status = 'all') {
    try {
        await dbConnect();
        const session = await authorize(PERMISSIONS.VIEW_APPOINTMENTS);
        const { clinicId } = session;

        const query = { clinicId };
        if (status !== 'all') query.status = String(status).toUpperCase();

        const appointments = await Appointment.find(query)
            .populate('patientId', 'fullName patientId')
            .populate('doctorId', 'fullName')
            .sort({ startDateTime: 1 })
            .lean();

        return {
            success: true,
            appointments: appointments.map(a => ({
                id: a._id.toString(),
                patient: a.patientId?.fullName || 'Unknown',
                patientMongoId: a.patientId?._id?.toString(),
                date: a.appointmentDate || a.date,
                time: a.appointmentTime || a.time,
                status: a.status,
                doctor: a.doctorId?.fullName || 'Unassigned',
                notes: a.notes || a.visitReason
            }))
        };
    } catch (error) {
        return { success: false, error: 'Unauthorized' };
    }
}
