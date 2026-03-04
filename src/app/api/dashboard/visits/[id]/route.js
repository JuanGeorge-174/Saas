import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/index';
import Visit from '@/lib/db/models/Visit';
import Appointment from '@/lib/db/models/Appointment';
import { authorize } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';

export async function PATCH(req, { params }) {
    try {
        await dbConnect();

        // 1. Authorize (Doctor or Admin can update notes)
        const session = await authorize(PERMISSIONS.ADD_VISIT_NOTES);
        const { clinicId } = session;
        const { id } = await params;

        const body = await req.json();
        const {
            chiefComplaint,
            diagnosis,
            treatment,
            prescription,
            doctorNotes,
            status
        } = body;

        // 2. Find Visit (Scoped by clinicId)
        const visit = await Visit.findOne({ _id: id, clinicId });
        if (!visit) {
            return NextResponse.json({ error: 'Visit not found' }, { status: 404 });
        }

        // 3. Update fields
        visit.chiefComplaint = chiefComplaint !== undefined ? chiefComplaint : visit.chiefComplaint;
        visit.diagnosis = diagnosis !== undefined ? diagnosis : visit.diagnosis;
        visit.treatment = treatment !== undefined ? treatment : visit.treatment;
        visit.prescription = prescription !== undefined ? prescription : visit.prescription;
        visit.doctorNotes = doctorNotes !== undefined ? doctorNotes : visit.doctorNotes;

        if (status) {
            visit.status = status;
            if (status === 'COMPLETED') {
                visit.exitTime = new Date();

                // Also ensure appointment is marked as completed
                if (visit.appointmentId) {
                    await Appointment.findByIdAndUpdate(visit.appointmentId, { status: 'COMPLETED' });
                }
            }
        }

        await visit.save();

        return NextResponse.json({ success: true, visit });

    } catch (error) {
        console.error('Visit API Error:', error);
        return NextResponse.json({
            error: error.message || 'Failed to update visit'
        }, { status: error.status || 500 });
    }
}

export async function GET(req, { params }) {
    try {
        await dbConnect();
        const session = await authorize(PERMISSIONS.VIEW_MEDICAL_RECORDS);
        const { clinicId } = session;
        const { id } = await params;

        const visit = await Visit.findOne({ _id: id, clinicId })
            .populate('patientId', 'fullName patientId age sex phone')
            .populate('doctorId', 'fullName')
            .populate('files')
            .lean();

        if (!visit) {
            return NextResponse.json({ error: 'Visit not found' }, { status: 404 });
        }

        return NextResponse.json(visit);
    } catch (error) {
        console.error('Visit GET Error:', error);
        return NextResponse.json({ error: 'Failed to fetch visit' }, { status: 500 });
    }
}
