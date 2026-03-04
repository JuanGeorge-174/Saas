import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/index';
import AuditLog from '@/lib/db/models/AuditLog';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/auth/tokens';

export async function GET(req) {
    try {
        await dbConnect();
        const cookieStore = await cookies();
        const token = cookieStore.get('accessToken')?.value;
        const user = verifyAccessToken(token);

        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const action = searchParams.get('action');
        const limit = parseInt(searchParams.get('limit')) || 20;

        const query = { clinicId: user.clinicId };
        if (action) query.action = action;

        const logs = await AuditLog.find(query)
            .sort({ timestamp: -1 })
            .limit(limit)
            .populate('userId', 'fullName role');

        return NextResponse.json({ logs });

    } catch (error) {
        console.error('Audit Fetch Error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
