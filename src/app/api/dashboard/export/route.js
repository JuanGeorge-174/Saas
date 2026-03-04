import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/index';
import Patient from '@/lib/db/models/Patient';
import Appointment from '@/lib/db/models/Appointment';
import Payment from '@/lib/db/models/Payment';
import Inventory from '@/lib/db/models/Inventory';
import { authorize } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';

/**
 * FULL CLINIC DATA EXPORT API
 * Supports JSON and flat CSV formats for clinical portability.
 */

export async function GET(req) {
    try {
        await dbConnect();
        const session = await authorize(PERMISSIONS.EXPORT_DATA);
        const { clinicId } = session;

        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type') || 'all'; // all, patients, revenue, inventory
        const format = searchParams.get('format') || 'json';

        let data = {};

        if (type === 'all' || type === 'patients') {
            data.patients = await Patient.find({ clinicId, isDeleted: false }).lean();
        }
        if (type === 'all' || type === 'revenue') {
            data.payments = await Payment.find({ clinicId }).lean();
        }
        if (type === 'all' || type === 'inventory') {
            data.inventory = await Inventory.find({ clinicId }).lean();
        }
        if (type === 'all' || type === 'appointments') {
            data.appointments = await Appointment.find({ clinicId }).lean();
        }

        if (format === 'csv') {
            // Basic CSV generation for 'all' (simple flattened summary)
            const headers = ['Entity', 'Identifier', 'Value/Name', 'Status', 'Date'];
            let rows = [headers.join(',')];

            if (data.patients) {
                data.patients.forEach(p => rows.push(['Patient', p.patientId, p.fullName, p.status, p.createdAt.toISOString()].join(',')));
            }
            if (data.payments) {
                data.payments.forEach(p => rows.push(['Payment', p._id, p.totalAmount, p.status, p.paymentDate.toISOString()].join(',')));
            }

            return new Response(rows.join('\n'), {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename=clinic_export_${Date.now()}.csv`
                }
            });
        }

        return NextResponse.json(data);

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
}
