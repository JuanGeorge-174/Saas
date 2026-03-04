import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/index';
import Clinic from '@/lib/db/models/Clinic';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/auth/tokens';

export async function GET(req) {
    try {
        await dbConnect();

        // 1. Auth Guard
        const cookieStore = await cookies();
        const token = cookieStore.get('accessToken')?.value;
        const decoded = verifyAccessToken(token);

        if (!decoded || decoded.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Fetch all clinics
        const clinics = await Clinic.find({}).sort({ createdAt: -1 });

        return NextResponse.json({ clinics });

    } catch (error) {
        console.error('Super Admin Fetch Error:', error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}
