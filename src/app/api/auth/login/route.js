import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/index';
import User from '@/lib/db/models/User';
import Clinic from '@/lib/db/models/Clinic';
import { verifyPassword } from '@/lib/auth/password';
import { signAccessToken, signRefreshToken } from '@/lib/auth/tokens';
import { setAuthCookies } from '@/lib/auth/cookies';
import RateLimit from '@/lib/db/models/RateLimit';

export async function POST(req) {
    try {
        await dbConnect();
        const ip = req.headers.get('x-forwarded-for') || 'unknown';
        const limitKey = `auth:${ip}`;

        // Rate limit with silent fail for better UX
        try {
            const limit = await RateLimit.findOne({ key: limitKey });
            if (limit && limit.points > 20) {
                return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 });
            }
            await RateLimit.findOneAndUpdate(
                { key: limitKey },
                { $inc: { points: 1 } },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
        } catch (rlError) {
            console.error('Non-critical RateLimit Error:', rlError.message);
        }

        const body = await req.json();
        const { clinicName: rawClinicName, loginId, password } = body;
        const clinicName = rawClinicName?.trim();

        if (!clinicName || !loginId || !password) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
        }

        // Logic-based logging
        console.log(`[AUTH] Attempt: Clinic="${clinicName}", User="${loginId}"`);

        // 1. Find Clinic
        const escapedName = clinicName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const clinic = await Clinic.findOne({
            clinicName: { $regex: new RegExp(`^${escapedName}$`, 'i') },
            isActive: true
        });

        if (!clinic) {
            console.warn(`[AUTH] Clinic not found: "${clinicName}"`);
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // 2. Find User
        const user = await User.findOne({
            clinicId: clinic._id,
            loginId: loginId.toLowerCase().trim()
        }).select('+passwordHash');

        if (!user || !user.isActive) {
            console.warn(`[AUTH] User not found: "${loginId}" in Clinic="${clinicName}"`);
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // 3. Password Check
        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) {
            await user.incrementFailedAttempts();
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // 4. Success Flow
        await user.resetFailedAttempts();
        await user.updateLastLogin(ip);

        const payload = {
            userId: user._id.toString(),
            clinicId: user.clinicId.toString(),
            role: user.role,
        };

        const accessToken = signAccessToken(payload);
        const refreshToken = signRefreshToken(payload);

        const response = NextResponse.json({
            success: true,
            user: {
                loginId: user.loginId,
                fullName: user.fullName,
                role: user.role,
                clinicId: user.clinicId,
                clinicName: clinic.clinicName
            }
        });

        setAuthCookies(response, accessToken, refreshToken);

        // Audit Logging
        try {
            const { logAction } = await import('@/lib/audit');
            await logAction({
                clinicId: user.clinicId,
                userId: user._id,
                action: 'LOGIN',
                resource: 'USER',
                resourceId: user._id,
                req
            });
        } catch (auditError) { }

        // Success: Clear rate limit
        try { await RateLimit.deleteOne({ key: limitKey }); } catch (e) { }

        return response;

    } catch (error) {
        console.error('[CRITICAL AUTH ERROR]:', error);
        return NextResponse.json({
            error: 'Authentication service encountered an error',
            details: error.message
        }, { status: 500 });
    }
}
