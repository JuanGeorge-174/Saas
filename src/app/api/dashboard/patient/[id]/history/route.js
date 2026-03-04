import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/index';
import Visit from '@/lib/db/models/Visit';
import { authorize } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';

/**
 * PATIENT CLINICAL HISTORY API
 * Fetches all past visits for a specific patient with clinical notes and files.
 */

export async function GET(req, { params }) {
    try {
        await dbConnect();
        const session = await authorize(PERMISSIONS.VIEW_MEDICAL_RECORDS);
        const { clinicId } = session;
        const { id: patientId } = await params;

        const visits = await Visit.find({
            clinicId,
            patientId,
            status: 'COMPLETED' // Only show completed clinical records in history
        })
            .populate('assignedDoctorId', 'fullName')
            .populate('files', 'fileName fileType filePath category createdAt')
            .sort({ visitDate: -1 })
            .lean();

        return NextResponse.json({ visits });
    } catch (error) {
        console.error('Patient History GET Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch clinical history' }, { status: error.status || 500 });
    }
}
