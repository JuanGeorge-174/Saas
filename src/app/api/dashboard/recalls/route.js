import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/index';
import Patient from '@/lib/db/models/Patient';
import { authorize } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';

export async function GET(req) {
    try {
        await dbConnect();
        const session = await authorize(PERMISSIONS.VIEW_RECALLS);
        const { clinicId } = session;

        const today = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Find patients whose recall date is due or past, AND haven't been contacted in the last 7 days
        const duePatients = await Patient.find({
            clinicId,
            recallDate: { $lte: today },
            $or: [
                { lastContacted: { $exists: false } },
                { lastContacted: { $lte: sevenDaysAgo } }
            ],
            isDeleted: false,
            status: 'ACTIVE'
        })
            .sort({ recallDate: 1 })
            .lean();

        // Also identify patients who haven't visited in 6 months but have no recall date
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const inactivePatients = await Patient.find({
            clinicId,
            lastVisitDate: { $lte: sixMonthsAgo },
            recallDate: { $exists: false },
            $or: [
                { lastContacted: { $exists: false } },
                { lastContacted: { $lte: sevenDaysAgo } }
            ],
            isDeleted: false,
            status: 'ACTIVE'
        })
            .sort({ lastVisitDate: 1 })
            .lean();

        return NextResponse.json({
            due: duePatients.map(p => ({
                id: p._id,
                name: p.fullName,
                patientId: p.patientId,
                phone: p.phone,
                date: p.recallDate,
                lastContacted: p.lastContacted,
                type: 'SCHEDULED'
            })),
            hygiene: inactivePatients.map(p => ({
                id: p._id,
                name: p.fullName,
                patientId: p.patientId,
                phone: p.phone,
                date: p.lastVisitDate,
                lastContacted: p.lastContacted,
                type: 'INACTIVE'
            }))
        });

    } catch (error) {
        console.error('Recall API Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch recall data' }, { status: error.status || 500 });
    }
}

export async function POST(req) {
    try {
        await dbConnect();
        const session = await authorize(PERMISSIONS.VIEW_RECALLS);
        const { clinicId } = session;

        const { patientId, action } = await req.json();

        if (action === 'MARK_CONTACTED') {
            await Patient.findOneAndUpdate(
                { _id: patientId, clinicId },
                { lastContacted: new Date() }
            );
            return NextResponse.json({ success: true });
        }

        if (action === 'SNOOZE') {
            const twoWeeksLater = new Date();
            twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);
            await Patient.findOneAndUpdate(
                { _id: patientId, clinicId },
                { recallDate: twoWeeksLater, lastContacted: new Date() }
            );
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
