import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db/index';
import Appointment from '@/lib/db/models/Appointment';
import Visit from '@/lib/db/models/Visit';
import Patient from '@/lib/db/models/Patient';
import { authorize } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';

/**
 * DASHBOARD METRICS API (PRODUCTION READY)
 * 
 * DERIVED FROM: VISITS and APPOINTMENTS
 * FILTERED BY: clinic_id and current date
 */

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        await dbConnect();

        // 1. Authorize user (clinic-scoped session)
        const session = await authorize(PERMISSIONS.VIEW_DASHBOARD);
        const clinicIdObj = new mongoose.Types.ObjectId(session.clinicId);
        const { clinicId } = session;

        // 2. Define Time Boundaries (Clinic's Today)
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // 3. AUTO-UPDATE MISSED APPOINTMENTS (Strict Rule 3)
        // Grace period: 15 minutes
        const gracePeriodMinutes = 15;
        const cutoffTime = new Date(Date.now() - gracePeriodMinutes * 60 * 1000);

        await Appointment.updateMany({
            clinicId: clinicIdObj,
            appointmentDate: { $gte: startOfDay, $lte: endOfDay },
            status: 'SCHEDULED', // Use new PRODUCTION status
            arrivalTime: null,
            startDateTime: { $lt: cutoffTime }
        }, {
            $set: { status: 'MISSED' }
        });

        // 4. AGGREGATE REAL-TIME DATA
        const [
            patientsVisitedToday,
            pendingAppointmentsToday,
            missedAppointmentsToday,
            newPatientsToday
        ] = await Promise.all([
            // Card 1: Total Patients Visited Today (Rule 1)
            // Count visits where status in ('WAITING', 'IN_PROGRESS', 'COMPLETED')
            Visit.countDocuments({
                clinicId: clinicIdObj,
                visitDate: { $gte: startOfDay, $lte: endOfDay },
                status: { $in: ['WAITING', 'IN_PROGRESS', 'COMPLETED'] }
            }),

            Appointment.countDocuments({
                clinicId: clinicIdObj,
                appointmentDate: { $gte: startOfDay, $lte: endOfDay },
                status: 'SCHEDULED',
                arrivalTime: null
            }),

            // Card 3: Missed Appointments Today (Rule 3)
            Appointment.countDocuments({
                clinicId: clinicIdObj,
                appointmentDate: { $gte: startOfDay, $lte: endOfDay },
                status: 'MISSED'
            }),

            // Card 4: New Patients Registered Today
            Patient.countDocuments({
                clinicId: clinicIdObj,
                createdAt: { $gte: startOfDay, $lte: endOfDay },
                isDeleted: { $ne: true }
            })
        ]);

        return NextResponse.json({
            metrics: {
                visitedToday: patientsVisitedToday,
                pendingToday: pendingAppointmentsToday,
                missedToday: missedAppointmentsToday,
                newPatientsToday: newPatientsToday
            }
        });

    } catch (error) {
        console.error('Metrics API Error:', error);
        return NextResponse.json({
            error: error.message || 'Failed to fetch dashboard data'
        }, { status: error.status || 500 });
    }
}
