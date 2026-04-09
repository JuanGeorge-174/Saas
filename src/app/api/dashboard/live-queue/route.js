import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/index';
import Visit from '@/lib/db/models/Visit';
import Appointment from '@/lib/db/models/Appointment';
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
        const { clinicId, role, userId } = session;

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // Fetch all active visits for today
        const visitQuery = {
            clinicId,
            visitDate: { $gte: startOfDay, $lte: endOfDay },
            status: { $in: ['WAITING', 'IN_PROGRESS'] }
        };
        
        // Isolate queue for Doctors
        if (role === 'DOCTOR') {
            visitQuery.$or = [
                { assignedDoctorId: userId },
                { assignedDoctorId: null },
                { assignedDoctorId: { $exists: false } }
            ];
        }

        const visits = await Visit.find(visitQuery)
            .populate('patientId', 'fullName patientId age sex phone')
            .populate('assignedDoctorId', 'fullName')
            .sort({ arrivalTime: 1 })
            .lean();

        const now = new Date();

        // Calculate real-time waiting metrics (Rule 2)
        const queue = visits.map(visit => {
            const arrival = new Date(visit.arrivalTime);
            const endForWait = visit.waitingStoppedAt ? new Date(visit.waitingStoppedAt) : now;
            const waitingMs = endForWait - arrival;
            const waitingMinutes = Math.floor(waitingMs / (1000 * 60));

            // Color Coding Logic:
            // - < 10 minutes: green
            // - >= 10 minutes: purple
            const waitColor = waitingMinutes < 10 ? 'green' : 'purple';

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
                doctorSigned: visit.doctorSigned || false,
                visitType: visit.visitType,
                appointmentId: visit.appointmentId
            };
        });

        // Fetch Scheduled and Missed Appointments within a 24-hour window
        const next24Hours = new Date();
        next24Hours.setHours(next24Hours.getHours() + 24);
        
        const past24Hours = new Date();
        past24Hours.setHours(past24Hours.getHours() - 24);

        const apptQuery = {
            clinicId,
            appointmentDate: { $gte: past24Hours, $lte: next24Hours },
            status: { $in: ['SCHEDULED', 'MISSED'] }
        };
        
        if (role === 'DOCTOR') {
            apptQuery.$or = [
                { doctorId: userId },
                { doctorId: null },
                { doctorId: { $exists: false } }
            ];
        }

        const appointments = await Appointment.find(apptQuery)
            .populate('patientId', 'fullName patientId age sex phone')
            .populate('doctorId', 'fullName')
            .sort({ startDateTime: 1 })
            .lean();

        const pendingAppts = appointments.map(app => ({
            id: app._id,
            patient: {
                name: app.patientId?.fullName || app.patientName || 'Unknown',
                id: app.patientId?.patientId || 'N/A',
                age: app.patientId?.age,
                sex: app.patientId?.sex,
                phone: app.patientId?.phone || app.phone
            },
            doctor: app.doctorId?.fullName || 'Unassigned',
            arrivalTime: app.startDateTime || app.appointmentDate,
            waitingTime: 0,
            color: app.status === 'MISSED' ? 'red' : 'slate', 
            status: app.status,
            doctorSigned: false,
            visitType: 'APPOINTMENT',
            appointmentId: app._id,
            isAppointment: true
        }));

        // Combine and sort by time (arrived visits first by arrival time, then scheduled by start time)
        const fullQueue = [...queue, ...pendingAppts].sort((a, b) => new Date(a.arrivalTime) - new Date(b.arrivalTime));

        return NextResponse.json({ queue: fullQueue });

    } catch (error) {
        console.error('Live Queue API Error:', error);
        return NextResponse.json({
            error: error.message || 'Failed to fetch live queue'
        }, { status: error.status || 500 });
    }
}
