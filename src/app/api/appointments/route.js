import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/index';
import Appointment from '@/lib/db/models/Appointment';
import { secureRoute } from '@/lib/rbac/guards';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { z } from 'zod';

const AppointmentSchema = z.object({
    patientId: z.string(),
    doctorId: z.string(),
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
    type: z.string(),
    notes: z.string().optional(),
});

export async function POST(req) {
    return secureRoute(req, [PERMISSIONS.MANAGE_APPOINTMENTS], async (req, session) => {
        try {
            await dbConnect();
            const body = await req.json();

            const { data, success, error } = AppointmentSchema.safeParse(body);
            if (!success) {
                return NextResponse.json({ error: 'Validation Failed', details: error.format() }, { status: 400 });
            }

            // Convert to Date objects
            const start = new Date(data.startTime);
            const end = new Date(data.endTime);

            if (start >= end) {
                return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 });
            }

            // 1. Check Availability (Clinic Scope)
            // Conflict: (StartA < EndB) and (EndA > StartB)
            const conflict = await Appointment.findOne({
                clinicId: session.clinicId,
                doctorId: data.doctorId,
                status: { $nin: ['CANCELLED', 'MISSED'] },
                startDateTime: { $lt: end },
                endDateTime: { $gt: start }
            });

            if (conflict) {
                return NextResponse.json({ error: 'Doctor is already booked for this time slot.' }, { status: 409 });
            }

            // 2. Create Appointment
            const appointment = await Appointment.create({
                patientId: data.patientId,
                doctorId: data.doctorId,
                appointmentDate: new Date(new Date(start).setHours(0, 0, 0, 0)),
                appointmentTime: `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`,
                startDateTime: start,
                duration: Math.max(5, Math.round((end.getTime() - start.getTime()) / 60000)),
                notes: data.notes || '',
                visitReason: data.type || '',
                status: 'SCHEDULED',
                clinicId: session.clinicId,
                createdBy: session.userId,
            });

            return NextResponse.json({ success: true, id: appointment._id }, { status: 201 });

        } catch (e) {
            console.error('Create Appointment Error:', e);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }
    });
}

export async function GET(req) {
    return secureRoute(req, [PERMISSIONS.VIEW_APPOINTMENTS], async (req, session) => {
        try {
            await dbConnect();
            const { searchParams } = new URL(req.url);
            const start = searchParams.get('start');
            const end = searchParams.get('end');
            const doctorId = searchParams.get('doctorId');

            if (!start || !end) {
                return NextResponse.json({ error: 'Date range required' }, { status: 400 });
            }

            const query = {
                clinicId: session.clinicId,
                startDateTime: { $gte: new Date(start), $lte: new Date(end) },
                status: { $ne: 'CANCELLED' }
            };

            if (doctorId) {
                query.doctorId = doctorId;
            }

            const appointments = await Appointment.find(query)
                .populate('patientId', 'firstName lastName phone')
                .populate('doctorId', 'fullName')
                .sort({ startDateTime: 1 });

            return NextResponse.json({ data: appointments });

        } catch (e) {
            console.error('Fetch Appointments Error:', e);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }
    });
}
