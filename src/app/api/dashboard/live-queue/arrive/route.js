import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db/index';
import Visit from '@/lib/db/models/Visit';
import Appointment from '@/lib/db/models/Appointment';
import Patient from '@/lib/db/models/Patient';
import { authorize } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';

/**
 * ARRIVAL FLOW API (STRICT PRODUCTION LOGIC)
 * 
 * Scenario 1: Appointment Arrival
 * Scenario 2: Walk-In Arrival
 * 
 * Rules:
 * - Use transactions for atomicity
 * - Set arrival_time = now
 * - Clinic-scoped validation
 */

export async function POST(req) {
    const sessionToken = await authorize(PERMISSIONS.MANAGE_APPOINTMENTS);
    const { clinicId, userId } = sessionToken;

    await dbConnect();
    const conn = mongoose.connection;
    const session = await conn.startSession();
    session.startTransaction();

    try {
        const body = await req.json();
        const { type, appointmentId, patientId, doctorId } = body;

        const now = new Date();
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        let createdVisitId;

        if (type === 'APPOINTMENT') {
            // SCENARIO 1: APPOINTMENT ARRIVAL
            if (!appointmentId) throw new Error('Appointment ID is required');

            const appointment = await Appointment.findOne({
                _id: appointmentId,
                clinicId
            }).session(session);

            if (!appointment) throw new Error('Appointment not found');
            if (appointment.status === 'ARRIVED') throw new Error('Patient already marked as arrived');

            // 1. Create the Visit
            const visit = await Visit.create([{
                clinicId,
                patientId: appointment.patientId,
                appointmentId: appointment._id,
                visitType: 'APPOINTMENT',
                visitDate: startOfDay,
                arrivalTime: now,
                assignedDoctorId: doctorId || appointment.doctorId,
                status: 'WAITING',
                createdBy: userId
            }], { session });

            // 2. Update Appointment Status
            appointment.status = 'ARRIVED';
            appointment.arrivalTime = now;
            appointment.visitId = visit[0]._id;
            await appointment.save({ session });

            createdVisitId = visit[0]._id;

        } else if (type === 'WALK_IN') {
            // SCENARIO 2: WALK-IN ARRIVAL
            if (!patientId) throw new Error('Patient ID is required');

            const patient = await Patient.findOne({ _id: patientId, clinicId });
            if (!patient) throw new Error('Patient not found');

            // 1. Create Walk-in Visit Directly
            const visit = await Visit.create([{
                clinicId,
                patientId: patient._id,
                visitType: 'WALK_IN',
                visitDate: startOfDay,
                arrivalTime: now,
                assignedDoctorId: doctorId,
                status: 'WAITING',
                createdBy: userId
            }], { session });

            createdVisitId = visit[0]._id;
        } else {
            throw new Error('Invalid arrival type');
        }

        await session.commitTransaction();
        return NextResponse.json({
            success: true,
            visitId: createdVisitId,
            message: 'Patient arrived and added to queue'
        });

    } catch (error) {
        await session.abortTransaction();
        console.error('Arrival Flow Error:', error);
        return NextResponse.json({
            error: error.message || 'Failed to process arrival'
        }, { status: 400 });
    } finally {
        session.endSession();
    }
}
