'use server';

import mongoose from 'mongoose';
import dbConnect from '@/lib/db/index';
import Payment from '@/lib/db/models/Payment';
import Visit from '@/lib/db/models/Visit';
import Patient from '@/lib/db/models/Patient';
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

        // data.paymentId is the _id of the Payment document
        const payment = await Payment.findOne({ _id: data.paymentId, clinicId });
        if (!payment) return { success: false, error: 'Billing record not found' };

        const paymentAmount = parseFloat(data.amount);
        if (isNaN(paymentAmount) || paymentAmount <= 0) return { success: false, error: 'Invalid amount' };

        // Add to transaction history
        payment.transactionHistory.push({
            amount: paymentAmount,
            mode: data.method,
            receivedBy: userId,
            note: data.notes
        });

        // Update total paid amount
        payment.paidAmount = (payment.paidAmount || 0) + paymentAmount;

        // The pre-save hook on Payment will automatically calculate pendingAmount and status.
        await payment.save();

        await logAction({
            clinicId,
            userId,
            action: 'PAYMENT_RECORDED',
            moduleName: 'REVENUE',
            resource: 'PAYMENT',
            resourceId: payment._id,
            changes: { amount: paymentAmount, mode: data.method },
            severity: 'INFO'
        });

        revalidatePath('/admin/revenue');
        return { success: true, id: payment._id.toString() };
    } catch (error) {
        console.error('Payment Error:', error);
        return { success: false, error: 'Failed to process payment' };
    }
}

/**
 * UPDATE BILL AMOUNT
 */
export async function updateBillAmount({ paymentId, amount }) {
    try {
        await dbConnect();
        const session = await authorize(PERMISSIONS.MANAGE_BILLING);
        const { clinicId, userId } = session;

        const payment = await Payment.findOne({ _id: paymentId, clinicId });
        if (!payment) return { success: false, error: 'Billing record not found' };

        const newTotal = parseFloat(amount);
        if (isNaN(newTotal) || newTotal < 0) return { success: false, error: 'Invalid amount' };

        payment.totalAmount = newTotal;
        await payment.save();

        await logAction({
            clinicId,
            userId,
            action: 'BILL_AMOUNT_UPDATED',
            moduleName: 'REVENUE',
            resource: 'PAYMENT',
            resourceId: payment._id,
            changes: { totalAmount: newTotal },
            severity: 'INFO'
        });

        revalidatePath('/admin/revenue');
        return { success: true };
    } catch (error) {
        console.error('Update Bill Error:', error);
        return { success: false, error: 'Failed to update bill amount' };
    }
}

/**
 * ADD MANUAL REVENUE (Not visit-based)
 */
export async function addManualRevenue(data) {
    try {
        await dbConnect();
        const session = await authorize(PERMISSIONS.MANAGE_BILLING);
        const { clinicId, userId } = session;

        const totalAmount = parseFloat(data.totalAmount);
        const paidAmount = parseFloat(data.paidAmount) || 0;

        if (isNaN(totalAmount) || totalAmount < 0) return { success: false, error: 'Invalid total amount' };
        if (paidAmount < 0 || paidAmount > totalAmount) return { success: false, error: 'Invalid paid amount' };

        const payment = new Payment({
            clinicId,
            isManual: true,
            patientId: data.patientId,
            totalAmount: totalAmount,
            paidAmount: 0, 
            createdBy: userId,
            notes: data.notes
        });

        if (paidAmount > 0) {
            payment.transactionHistory.push({
                amount: paidAmount,
                mode: data.mode || 'CASH',
                receivedBy: userId,
                note: data.notes
            });
            payment.paidAmount = paidAmount;
        }

        await payment.save();

        await logAction({
            clinicId,
            userId,
            action: 'MANUAL_REVENUE_ADDED',
            moduleName: 'REVENUE',
            resource: 'PAYMENT',
            resourceId: payment._id,
            changes: { totalAmount, paidAmount, mode: data.mode || 'CASH' },
            severity: 'INFO'
        });

        revalidatePath('/admin/revenue');
        return { success: true, id: payment._id.toString() };
    } catch (error) {
        console.error('Add Manual Revenue Error:', error);
        return { success: false, error: 'Failed to add manual revenue: ' + (error.message || error.toString()) };
    }
}

/**
 * GET REVENUE DATA
 */
export async function getRevenue(filter = 'today', search = '') {
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

        const matchQuery = {
            clinicId,
            paymentDate: { $gte: start, $lte: end }
        };

        if (search) {
            const searchRegex = new RegExp(search, 'i');
            const patients = await Patient.find({ 
                clinicId, 
                $or: [
                    { fullName: searchRegex },
                    { patientId: searchRegex }
                ]
            }).select('_id').lean();
            
            const patientIds = patients.map(p => p._id);
            matchQuery.patientId = { $in: patientIds };
        }

        const payments = await Payment.find(matchQuery)
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
                patient: p.patientId?.fullName || (p.isManual ? 'Manual Entry' : 'Unknown'),
                patientId: p.patientId?.patientId || (p.isManual ? 'MANUAL' : 'N/A'),
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
