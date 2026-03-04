import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/index';
import Patient from '@/lib/db/models/Patient';
import { authorize } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';

/**
 * PATIENT EXPORT API (CSV)
 * Exports all clinic patients in a CSV format.
 */

export async function GET(req) {
    try {
        await dbConnect();
        const session = await authorize(PERMISSIONS.VIEW_PATIENTS);
        const { clinicId } = session;

        const patients = await Patient.find({ clinicId, isDeleted: { $ne: true } }).sort({ fullName: 1 }).lean();

        // Generate CSV
        const headers = ['Full Name', 'Patient ID', 'Age', 'Sex', 'Phone', 'Email', 'Medical History', 'Allergies', 'Created At'];
        const rows = patients.map(p => [
            p.fullName,
            p.patientId,
            p.age,
            p.sex,
            p.phone || '',
            p.email || '',
            (Array.isArray(p.medicalHistory) ? p.medicalHistory.join('; ') : (p.medicalHistory || '')).replace(/,/g, ';'),
            (Array.isArray(p.allergies) ? p.allergies.join('; ') : (p.allergies || '')).replace(/,/g, ';'),
            p.createdAt ? p.createdAt.toISOString() : ''
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        return new NextResponse(csvContent, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="patients_export_${Date.now()}.csv"`
            }
        });

    } catch (error) {
        console.error('Patient Export Error:', error);
        return NextResponse.json({ error: 'Failed to export patients' }, { status: 500 });
    }
}
