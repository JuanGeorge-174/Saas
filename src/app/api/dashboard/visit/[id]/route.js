import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/index';
import Visit from '@/lib/db/models/Visit';
import Patient from '@/lib/db/models/Patient';
import User from '@/lib/db/models/User';
import { authorize } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';

/**
 * VISIT DETAIL API
 * Handles fetching and updating clinical data for a specific visit.
 */

export async function GET(req, { params }) {
    try {
        await dbConnect();
        const session = await authorize(PERMISSIONS.VIEW_MEDICAL_RECORDS);
        const { clinicId } = session;
        const { id } = await params;

        const visit = await Visit.findOne({ _id: id, clinicId })
            .populate('patientId', 'fullName patientId age sex phone medicalHistory allergies email')
            .populate('assignedDoctorId', 'fullName')
            .populate('files', 'fileName fileType filePath category createdAt')
            .lean();

        if (!visit) {
            return NextResponse.json({ error: 'Visit not found' }, { status: 404 });
        }

        return NextResponse.json(visit);
    } catch (error) {
        console.error('Visit GET Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch visit' }, { status: error.status || 500 });
    }
}

export async function PATCH(req, { params }) {
    try {
        await dbConnect();
        const session = await authorize(PERMISSIONS.ADD_VISIT_NOTES);
        const { clinicId, userId } = session;
        const { id } = await params;

        const body = await req.json();
        const {
            chiefComplaint,
            diagnosis,
            treatment,
            prescription,
            doctorNotes,
            status,
            assignedDoctorId
        } = body;

        const visit = await Visit.findOne({ _id: id, clinicId });
        if (!visit) {
            return NextResponse.json({ error: 'Visit not found' }, { status: 404 });
        }

        // Update fields if provided
        if (chiefComplaint !== undefined) visit.chiefComplaint = chiefComplaint;
        if (diagnosis !== undefined) visit.diagnosis = diagnosis;
        if (treatment !== undefined) visit.treatment = treatment;
        if (prescription !== undefined) visit.prescription = prescription;
        if (doctorNotes !== undefined) visit.doctorNotes = doctorNotes;
        if (assignedDoctorId) visit.assignedDoctorId = assignedDoctorId;

        // Status update logic
        if (status) {
            // If changing to COMPLETED, record exitTime and update patient
            if (status === 'COMPLETED' && visit.status !== 'COMPLETED') {
                visit.exitTime = new Date();

                // Explicitly update patient's last visit date
                await Patient.findByIdAndUpdate(visit.patientId, {
                    lastVisitDate: visit.visitDate || new Date()
                });
            }
            visit.status = status;
        }

        visit.updatedBy = userId;
        await visit.save();

        return NextResponse.json({ success: true, visit });
    } catch (error) {
        console.error('Visit PATCH Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to update visit' }, { status: error.status || 400 });
    }
}
