'use server';

import mongoose from 'mongoose';
import dbConnect from '@/lib/db/index';
import Payment from '@/lib/db/models/Payment';
import Visit from '@/lib/db/models/Visit';
import { authorize } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { logAction } from '@/lib/audit';
import { revalidatePath } from 'next/cache';

/**
 * RECORD PAYMENT (Visit-based)
 */
export async function recordPayment(data) {
    try {
        await dbConnect();
        const session = await authorize(PERMISSIONS.MANAGE_BILLING);
        const { clinicId, userId } = session;

        const visit = await Visit.findOne({ _id: data.visitId, clinicId });
        if (!visit) return { success: false, error: 'Visit not found' };

        const payment = await Payment.create({
            clinicId,
            patientId: visit.patientId,
            visitId: visit._id,
            amount: data.amount,
            method: data.method,
            status: data.status || 'COMPLETED',
            notes: data.notes,
            recordedBy: userId
        });

        await logAction({
            clinicId,
            userId,
            action: 'PAYMENT_RECORDED',
            moduleName: 'REVENUE',
            resource: 'PAYMENT',
            resourceId: payment._id,
            changes: { amount: data.amount, visitId: data.visitId },
            severity: 'INFO'
        });

        revalidatePath('/admin/revenue');
        return { success: true, id: payment._id.toString() };
    } catch (error) {
        console.error('Payment Error:', error);
        return { success: false, error: 'Failed to record payment' };
    }
}
/**
 * GET REVENUE DATA
 */
export async function getRevenue(filter = 'today') {
    try {
        await dbConnect();
        const session = await authorize(PERMISSIONS.MANAGE_BILLING);
        const { clinicId } = session;

        let start = new Date();
        start.setHours(0, 0, 0, 0);
        let end = new Date();
        end.setHours(23, 59, 59, 999);

        if (filter === 'month') {
            start.setDate(1);
        } else if (filter === 'year') {
            start.setMonth(0, 1);
        } else if (filter === 'all') {
            start = new Date(0);
        }

        const payments = await Payment.find({
            clinicId,
            paymentDate: { $gte: start, $lte: end }
        })
            .populate('patientId', 'fullName patientId')
            .sort({ paymentDate: -1 })
            .lean();

        const metrics = payments.reduce((acc, p) => ({
            totalPaid: acc.totalPaid + (p.paidAmount || 0),
            totalPending: acc.totalPending + (p.pendingAmount || 0)
        }), { totalPaid: 0, totalPending: 0 });

        return {
            success: true,
            payments: payments.map(p => ({
                id: p._id.toString(),
                patient: p.patientId?.fullName || 'Unknown',
                patientId: p.patientId?.patientId || 'N/A',
                total: p.totalAmount,
                paid: p.paidAmount,
                pending: p.pendingAmount,
                status: p.status,
                date: p.paymentDate,
                transactions: p.transactionHistory || []
            })),
            metrics
        };
    } catch (error) {
        return { success: false, error: 'Unauthorized' };
    }
}
