import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db/index';
import Appointment from '@/lib/db/models/Appointment';
import Visit from '@/lib/db/models/Visit';
import { authorize } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';

export async function POST(req) {
    try {
        await dbConnect();

        // 1. Authorize (Receptionist or Admin can check-in)
        const session = await authorize(PERMISSIONS.CHECK_IN_PATIENTS);
        const { clinicId, userId } = session;

        const { id, action } = await req.json();

        if (!id || !action) {
            return NextResponse.json({ error: 'ID and action are required' }, { status: 400 });
        }

        const appointment = await Appointment.findOne({ _id: id, clinicId });
        if (!appointment) {
            return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
        }

        switch (action) {
            case 'CHECK_IN':
                // Strict workflow: ARRIVAL creates a Visit (queue is Visit-driven)
                if (appointment.status === 'ARRIVED' && appointment.visitId) {
                    return NextResponse.json({ success: true, visitId: appointment.visitId });
                }

                {
                    const conn = mongoose.connection;
                    const mongoSession = await conn.startSession();
                    mongoSession.startTransaction();
                    try {
                        const now = new Date();
                        const startOfDay = new Date();
                        startOfDay.setHours(0, 0, 0, 0);

                        const visit = await Visit.create([{
                            clinicId,
                            patientId: appointment.patientId,
                            appointmentId: appointment._id,
                            visitType: 'APPOINTMENT',
                            visitDate: startOfDay,
                            arrivalTime: now,
                            assignedDoctorId: appointment.doctorId || null,
                            status: 'WAITING',
                            createdBy: userId
                        }], { session: mongoSession });

                        appointment.status = 'ARRIVED';
                        appointment.arrivalTime = now;
                        appointment.visitId = visit[0]._id;
                        await appointment.save({ session: mongoSession });

                        await mongoSession.commitTransaction();
                        return NextResponse.json({ success: true, visitId: visit[0]._id });
                    } catch (e) {
                        await mongoSession.abortTransaction();
                        throw e;
                    } finally {
                        mongoSession.endSession();
                    }
                }

            case 'MARK_NO_SHOW':
                appointment.status = 'MISSED';
                await appointment.save();
                break;

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Queue Action API Error:', error);
        return NextResponse.json({
            error: error.message || 'Action failed'
        }, { status: error.status || 500 });
    }
}
