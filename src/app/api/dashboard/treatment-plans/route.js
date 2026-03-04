import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/index';
import TreatmentPlan from '@/lib/db/models/TreatmentPlan';
import { authorize } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';

/**
 * TREATMENT PLANS API
 * Scoped by clinicId for security.
 */

export async function GET(req) {
    try {
        await dbConnect();
        const session = await authorize(PERMISSIONS.VIEW_TREATMENT_PLANS);
        const { clinicId } = session;

        const { searchParams } = new URL(req.url);
        const patientMongoId = searchParams.get('patientId');

        const query = { clinicId };
        if (patientMongoId) query.patientId = patientMongoId;

        const plans = await TreatmentPlan.find(query)
            .populate('patientId', 'fullName patientId')
            .sort({ updatedAt: -1 })
            .lean();

        return NextResponse.json(plans.map(p => ({
            id: p._id.toString(),
            patientName: p.patientId?.fullName || 'Deleted Patient',
            patientId: p.patientId?.patientId || 'N/A',
            title: p.title,
            description: p.description,
            procedures: p.procedures,
            totalCost: p.totalEstimatedCost,
            status: p.status,
            createdAt: p.createdAt
        })));

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
}

export async function POST(req) {
    try {
        await dbConnect();
        const session = await authorize(PERMISSIONS.MANAGE_TREATMENT_PLANS);
        const { clinicId, userId } = session;

        const body = await req.json();
        const { id, patientMongoId, title, description, procedures, status } = body;

        const totalCost = procedures?.reduce((all, curr) => all + (Number(curr.estimatedCost) || 0), 0) || 0;

        if (id) {
            const plan = await TreatmentPlan.findOne({ _id: id, clinicId });
            if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });

            plan.title = title || plan.title;
            plan.description = description || plan.description;
            plan.procedures = procedures || plan.procedures;
            plan.status = status || plan.status;
            plan.totalEstimatedCost = totalCost;

            await plan.save();
            return NextResponse.json({ success: true, plan });
        } else {
            if (!patientMongoId || !title) return NextResponse.json({ error: 'Missing Required Fields' }, { status: 400 });

            const plan = await TreatmentPlan.create({
                clinicId,
                patientId: patientMongoId,
                title,
                description,
                procedures: procedures || [],
                totalEstimatedCost: totalCost,
                status: status || 'ACTIVE',
                createdBy: userId
            });

            return NextResponse.json({ success: true, plan });
        }
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
}
