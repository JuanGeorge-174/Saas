import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/index';
import Patient from '@/lib/db/models/Patient';
import Clinic from '@/lib/db/models/Clinic';
import { authorize } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';

/**
 * PATIENT IMPORT API (JSON from frontend CSV parse)
 * Accepts an array of patient objects and bulk inserts.
 */

export async function POST(req) {
    try {
        await dbConnect();
        const session = await authorize(PERMISSIONS.ADD_PATIENTS);
        const { clinicId } = session;

        const { patients } = await req.json();

        if (!Array.isArray(patients) || patients.length === 0) {
            return NextResponse.json({ error: 'No patient data provided' }, { status: 400 });
        }

        // Validate and clean data
        const clinic = await Clinic.findById(clinicId);
        let nextId = clinic.patientCount + 1;

        const patientsToInsert = patients.map(p => ({
            clinicId,
            fullName: p.fullName || p['Full Name'],
            age: parseInt(p.age || p['Age']) || 0,
            sex: (p.sex || p['Sex'] || 'Male').charAt(0).toUpperCase() + (p.sex || p['Sex'] || 'Male').slice(1).toLowerCase(),
            phone: p.phone || p['Phone'] || '',
            email: p.email || p['Email'] || '',
            medicalHistory: p.medicalHistory || p['Medical History'] || '',
            allergies: p.allergies || p['Allergies'] || '',
            patientId: `P-${(nextId++).toString().padStart(4, '0')}`,
        }));

        // Bulk Insert
        const result = await Patient.insertMany(patientsToInsert);

        // Update clinic counter
        await Clinic.findByIdAndUpdate(clinicId, { $inc: { patientCount: patientsToInsert.length } });

        return NextResponse.json({
            success: true,
            count: result.length,
            message: `Successfully imported ${result.length} patients`
        });

    } catch (error) {
        console.error('Patient Import Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to import patients' }, { status: 500 });
    }
}
