import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/index';
import Appointment from '@/lib/db/models/Appointment';
import Patient from '@/lib/db/models/Patient';
import User from '@/lib/db/models/User';
import { authorize } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';

/**
 * PRODUCTION READY APPOINTMENT API
 * Fully multi-tenant scoped and RBAC protected.
 */

export async function GET(req) {
    try {
        await dbConnect();
        const session = await authorize(PERMISSIONS.VIEW_APPOINTMENTS);
        const { clinicId } = session;

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const date = searchParams.get('date'); // YYYY-MM-DD

        const query = { clinicId };
        if (status && status !== 'all') query.status = status.toUpperCase();

        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            query.appointmentDate = { $gte: startOfDay, $lte: endOfDay };
        }

        const appointments = await Appointment.find(query)
            .populate('patientId', 'fullName patientId phone')
            .populate('doctorId', 'fullName')
            .sort({ startDateTime: 1 })
            .lean();

        return NextResponse.json(appointments.map(a => ({
            id: a._id.toString(),
            patient: a.patientId?.fullName || 'Deleted Patient',
            patientId: a.patientId?.patientId || 'N/A',
            patientMongoId: a.patientId?._id,
            phone: a.patientId?.phone || '',
            doctor: a.doctorId?.fullName || 'Unassigned',
            doctorMongoId: a.doctorId?._id,
            date: a.appointmentDate,
            time: a.appointmentTime,
            status: a.status,
            notes: a.notes
        })));

    } catch (error) {
        console.error('Appointment GET Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch appointments' }, { status: error.status || 500 });
    }
}

export async function POST(req) {
    try {
        await dbConnect();
        const session = await authorize(PERMISSIONS.MANAGE_APPOINTMENTS);
        const { clinicId, userId } = session;

        const body = await req.json();
        const {
            id,
            patientMongoId,
            doctorMongoId,
            date,
            time,
            status,
            notes,
            duration
        } = body;

        if (id) {
            // UPDATE
            const appointment = await Appointment.findOne({ _id: id, clinicId });
            if (!appointment) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });

            // Optional updates (status-only updates allowed)
            if (patientMongoId) appointment.patientId = patientMongoId;
            if (doctorMongoId) appointment.doctorId = doctorMongoId;

            if (date) {
                appointment.appointmentDate = new Date(date);
            }
            if (time) {
                appointment.appointmentTime = time;
            }
            if (date && time) {
                const startDateTime = new Date(date);
                const [hours, minutes] = time.split(':');
                startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                appointment.startDateTime = startDateTime;
            }

            if (status) appointment.status = status.toUpperCase();
            if (notes !== undefined) appointment.notes = notes || '';
            if (duration) appointment.duration = duration;

            await appointment.save();
            return NextResponse.json({ success: true, id: appointment._id });
        } else {
            // CREATE
            // Validation
            if (!patientMongoId || !date || !time) {
                throw new Error('Missing required fields: patient, date, time');
            }

            const startDateTime = new Date(date);
            const [hours, minutes] = time.split(':');
            startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            const appointment = await Appointment.create({
                clinicId,
                patientId: patientMongoId,
                doctorId: doctorMongoId || (session.role === 'DOCTOR' ? userId : null),
                appointmentDate: new Date(date),
                appointmentTime: time,
                startDateTime,
                duration: duration || 30,
                status: 'SCHEDULED', // Production starting status
                notes: notes || '',
                createdBy: userId
            });

            return NextResponse.json({ success: true, id: appointment._id });
        }

    } catch (error) {
        console.error('Appointment POST Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to save appointment' }, { status: 400 });
    }
}

export async function DELETE(req) {
    try {
        await dbConnect();
        const session = await authorize(PERMISSIONS.MANAGE_APPOINTMENTS);
        const { clinicId } = session;

        const { id } = await req.json();

        const result = await Appointment.findOneAndDelete({ _id: id, clinicId });
        if (!result) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Appointment DELETE Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to delete appointment' }, { status: error.status || 500 });
    }
}
