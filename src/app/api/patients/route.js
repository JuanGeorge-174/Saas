import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/index';
import Patient from '@/lib/db/models/Patient';
import { secureRoute } from '@/lib/rbac/guards';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { z } from 'zod';

// Validator
const PatientSchema = z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    dob: z.string().datetime().or(z.string()), // Accept ISO string
    gender: z.enum(['Male', 'Female', 'Other']),
    phone: z.string().min(10),
    email: z.string().email().optional().or(z.literal('')),
    address: z.string().optional(),
});

export async function POST(req) {
    return secureRoute(req, [PERMISSIONS.WRITE_PATIENTS], async (req, session) => {
        try {
            await dbConnect();
            const body = await req.json();

            // 1. Validate Input
            const result = PatientSchema.safeParse(body);
            if (!result.success) {
                return NextResponse.json({ error: 'Validation Failed', details: result.error.format() }, { status: 400 });
            }

            const { data } = result;

            // 2. Check Duplicates (Clinic Scope)
            const existing = await Patient.findOne({
                clinicId: session.clinicId,
                phone: data.phone,
            });

            if (existing) {
                return NextResponse.json({ error: 'Patient with this phone number already exists in this clinic.' }, { status: 409 });
            }

            // 3. Create Patient
            const newPatient = await Patient.create({
                ...data,
                clinicId: session.clinicId,
                createdBy: session.userId,
            });

            return NextResponse.json({ success: true, id: newPatient._id }, { status: 201 });

        } catch (error) {
            console.error('Create Patient Error:', error);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }
    });
}

export async function GET(req) {
    return secureRoute(req, [PERMISSIONS.READ_PATIENTS], async (req, session) => {
        try {
            await dbConnect();

            const { searchParams } = new URL(req.url);
            const query = searchParams.get('q') || '';
            const page = parseInt(searchParams.get('page') || '1');
            const limit = 20;

            // 1. Build Query (Clinic Scope Enforced)
            const filter = { clinicId: session.clinicId };

            if (query) {
                // Name search or Phone search
                filter.$or = [
                    { lastName: { $regex: query, $options: 'i' } },
                    { firstName: { $regex: query, $options: 'i' } },
                    { phone: { $regex: query, $options: 'i' } },
                ];
            }

            // 2. Execute
            const patients = await Patient.find(filter)
                .sort({ updatedAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .select('firstName lastName dob phone lastVisitDate status'); // Optimization

            const total = await Patient.countDocuments(filter);

            return NextResponse.json({
                data: patients,
                meta: {
                    total,
                    page,
                    totalPages: Math.ceil(total / limit)
                }
            });

        } catch (error) {
            console.error('Fetch Patients Error:', error);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }
    });
}
