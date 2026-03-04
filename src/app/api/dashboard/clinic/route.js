import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/index';
import Clinic from '@/lib/db/models/Clinic';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/auth/tokens';
import { authorize } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';

export async function GET() {
    try {
        await dbConnect();
        const cookieStore = await cookies();
        const token = cookieStore.get('accessToken')?.value;
        const user = verifyAccessToken(token);

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const clinic = await Clinic.findById(user.clinicId).lean();
        if (!clinic) {
            return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });
        }

        // Flatten the response for easier frontend consumption
        return NextResponse.json({
            id: clinic._id,
            clinicName: clinic.clinicName,
            email: clinic.email,
            phone: clinic.phone,
            address: clinic.address,
            subscription: clinic.subscription,
            limits: clinic.limits,
            usage: clinic.usage
        });

    } catch (error) {
        console.error('Clinic Fetch Error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function PATCH(req) {
    try {
        await dbConnect();
        const session = await authorize(PERMISSIONS.MANAGE_USERS); // Admin only
        const { clinicId } = session;

        const body = await req.json();
        const { clinicName, email, phone, address } = body;

        const clinic = await Clinic.findById(clinicId);
        if (!clinic) {
            return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });
        }

        // Update fields
        if (clinicName) clinic.clinicName = clinicName;
        if (email) clinic.email = email;
        if (phone) clinic.phone = phone;
        if (address) clinic.address = address;

        await clinic.save();

        return NextResponse.json({
            success: true,
            message: 'Clinic details updated successfully'
        });

    } catch (error) {
        console.error('Clinic Update Error:', error);
        return NextResponse.json({
            error: error.message || 'Failed to update clinic'
        }, { status: error.status || 500 });
    }
}
