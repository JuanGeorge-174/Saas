import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/index';
import Visit from '@/lib/db/models/Visit';
import { authorize } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';

/**
 * LIVE QUEUE API (STRICT PRODUCTION LOGIC)
 * 
 * Includes: Walk-ins and Arrived Appointments
 * Sorting: arrival_time ASC
 * Performance: .lean() for fast reads
 * Security: clinicId scoped
 */

export async function GET(req) {
    try {
        await dbConnect();
        const session = await authorize(PERMISSIONS.VIEW_DASHBOARD);
        const { clinicId } = session;

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // Fetch all active visits for today
        const visits = await Visit.find({
            clinicId,
            visitDate: { $gte: startOfDay, $lte: endOfDay },
            status: { $in: ['WAITING', 'IN_PROGRESS'] }
        })
            .populate('patientId', 'fullName patientId age sex phone')
            .populate('assignedDoctorId', 'fullName')
            .sort({ arrivalTime: 1 })
            .lean();

        const now = new Date();

        // Calculate real-time waiting metrics (Rule 2)
        const queue = visits.map(visit => {
            const arrival = new Date(visit.arrivalTime);
            const waitingMs = now - arrival;
            const waitingMinutes = Math.floor(waitingMs / (1000 * 60));

            // Color Coding Logic (STRICT RULE 2)
            let waitColor = 'green';
            if (waitingMinutes > 15) {
                waitColor = 'red';
            } else if (waitingMinutes >= 10) {
                waitColor = 'blue';
            }

            return {
                id: visit._id,
                patient: {
                    name: visit.patientId?.fullName || 'Unknown',
                    id: visit.patientId?.patientId || 'N/A',
                    age: visit.patientId?.age,
                    sex: visit.patientId?.sex,
                    phone: visit.patientId?.phone
                },
                doctor: visit.assignedDoctorId?.fullName || 'Unassigned',
                arrivalTime: visit.arrivalTime,
                waitingTime: waitingMinutes,
                color: waitColor,
                status: visit.status,
                visitType: visit.visitType,
                appointmentId: visit.appointmentId
            };
        });

        return NextResponse.json({ queue });

    } catch (error) {
        console.error('Live Queue API Error:', error);
        return NextResponse.json({
            error: error.message || 'Failed to fetch live queue'
        }, { status: error.status || 500 });
    }
}
