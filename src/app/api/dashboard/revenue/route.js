import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/index';
import Payment from '@/lib/db/models/Payment';
import Visit from '@/lib/db/models/Visit';
import Patient from '@/lib/db/models/Patient';
import { authorize } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';

/**
 * PRODUCTION REVENUE & BILLING API
 * 
 * Rules:
 * - MUST link to a Visit
 * - Supports partial payments with audit trail
 * - Real-time recalculated metrics
 */

export async function GET(req) {
    try {
        await dbConnect();
        const session = await authorize(PERMISSIONS.VIEW_REVENUE);
        const { clinicId } = session;

        const { searchParams } = new URL(req.url);
        const filter = searchParams.get('filter') || 'today'; // today, month, year, all

        const query = { clinicId };

        // Date Range Filtering (STRICT PRODUCTION LOGIC)
        const now = new Date();
        if (filter === 'today') {
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);
            query.paymentDate = { $gte: startOfDay };
        } else if (filter === 'month') {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            query.paymentDate = { $gte: startOfMonth };
        } else if (filter === 'year') {
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            query.paymentDate = { $gte: startOfYear };
        }

        const payments = await Payment.find(query)
            .populate('patientId', 'fullName patientId phone')
            .populate('visitId', 'visitDate status')
            .sort({ paymentDate: -1 })
            .lean();

        // Calculate Multi-Tenant Totals (Rule: Revenue Module Metrics)
        const metrics = payments.reduce((acc, curr) => {
            acc.totalPaid += curr.paidAmount || 0;
            acc.totalPending += curr.pendingAmount || 0;
            return acc;
        }, { totalPaid: 0, totalPending: 0 });

        return NextResponse.json({
            payments: payments.map(p => ({
                id: p._id,
                patient: p.patientId?.fullName || 'Deleted',
                patientId: p.patientId?.patientId || 'N/A',
                total: p.totalAmount,
                paid: p.paidAmount,
                pending: p.pendingAmount,
                status: p.status,
                date: p.paymentDate,
                visitId: p.visitId?._id,
                transactions: p.transactionHistory || []
            })),
            metrics
        });

    } catch (error) {
        console.error('Revenue GET Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        await dbConnect();
        const session = await authorize(PERMISSIONS.MANAGE_PAYMENTS);
        const { clinicId, userId } = session;

        const body = await req.json();
        const {
            id,
            visitId,
            patientId,
            totalAmount,
            paymentAmount,
            paymentMode,
            notes
        } = body;

        // 1. If updating an existing bill (Partial Payment)
        if (id) {
            const payment = await Payment.findOne({ _id: id, clinicId });
            if (!payment) throw new Error('Billing record not found');

            if (paymentAmount > 0) {
                // Add to audit trail (STRICT RULE: Maintain audit trail)
                payment.transactionHistory.push({
                    amount: paymentAmount,
                    mode: paymentMode,
                    receivedBy: userId,
                    note: notes
                });

                payment.paidAmount += parseFloat(paymentAmount);
                // Status is auto-recalculated by the Model Pre-Save
            }

            if (totalAmount !== undefined) payment.totalAmount = totalAmount;

            await payment.save();
            return NextResponse.json({ success: true, payment });
        }

        // 2. Creating a NEW bill (linked to Visit)
        if (!visitId || !patientId) throw new Error('Visit ID and Patient ID are required');

        const newPayment = await Payment.create({
            clinicId,
            patientId,
            visitId,
            totalAmount: totalAmount || 0,
            paidAmount: paymentAmount || 0,
            transactionHistory: paymentAmount > 0 ? [{
                amount: paymentAmount,
                mode: paymentMode || 'CASH',
                receivedBy: userId,
                note: notes
            }] : [],
            notes,
            createdBy: userId,
            paymentDate: new Date()
        });

        return NextResponse.json({ success: true, payment: newPayment });

    } catch (error) {
        console.error('Finance POST Error:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
