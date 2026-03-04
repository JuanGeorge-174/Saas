import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/index';
import Patient from '@/lib/db/models/Patient';
import { authorize } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';

export async function GET(req) {
    try {
        await dbConnect();
        const session = await authorize(PERMISSIONS.EXPORT_DATA);
        const { clinicId } = session;

        const { searchParams } = new URL(req.url);
        const format = searchParams.get('format') || 'json';

        const patients = await Patient.find({ clinicId, isDeleted: false })
            .select('patientId fullName age sex phone email address medicalHistory allergies status createdAt')
            .sort({ createdAt: -1 })
            .lean();

        if (format === 'csv') {
            const header = 'ID,Name,Age,Sex,Phone,Email,Status,DateRegistered\n';
            const rows = patients.map(p => {
                return `"${p.patientId}","${p.fullName}",${p.age},"${p.sex}","${p.phone}","${p.email || ''}","${p.status}","${p.createdAt.toISOString()}"`;
            }).join('\n');

            const csv = header + rows;
            return new Response(csv, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename="patients_export_${new Date().toISOString().split('T')[0]}.csv"`
                }
            });
        }

        return NextResponse.json(patients);

    } catch (error) {
        console.error('Export Error:', error);
        return NextResponse.json({ error: error.message || 'Export failed' }, { status: error.status || 500 });
    }
}
