import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/index';
import User from '@/lib/db/models/User';
import Clinic from '@/lib/db/models/Clinic';
import { hashPassword } from '@/lib/auth/password';
import { signAccessToken, signRefreshToken } from '@/lib/auth/tokens';
import { setAuthCookies } from '@/lib/auth/cookies';

export async function POST(req) {
    try {
        await dbConnect();
        const body = await req.json();
        const {
            clinicName,
            adminName,
            email,
            phone,
            loginId,
            password,
            plan,
            termsAccepted
        } = body;

        // 1. Basic Validation
        if (!clinicName || !adminName || !email || !phone || !loginId || !password || !termsAccepted) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
        }

        // 2. Check if Clinic Name exists
        const existingClinic = await Clinic.findOne({
            clinicName: { $regex: new RegExp(`^${clinicName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        });

        if (existingClinic) {
            return NextResponse.json({ error: 'Clinic name already exists' }, { status: 409 });
        }

        // 3. Create Clinic
        const newClinic = new Clinic({
            clinicName,
            adminName,
            email,
            phone,
            subscriptionPlan: plan || 'FREE',
            termsAccepted: !!termsAccepted,
            termsAcceptedDate: new Date()
        });

        // Explicitly generate slug for validation if needed, though pre-save hook exists
        newClinic.clinicSlug = clinicName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

        await newClinic.save();

        // 4. Hash Password
        const passwordHash = await hashPassword(password);

        // 5. Create Admin User
        const newUser = await User.create({
            clinicId: newClinic._id,
            loginId: loginId.toLowerCase().trim(),
            passwordHash,
            fullName: adminName,
            email,
            role: 'ADMIN',
        });

        // Update clinic usage
        newClinic.usage.userCount = 1;
        await newClinic.save();

        // 6. Issue Tokens
        const payload = {
            userId: newUser._id.toString(),
            clinicId: newClinic._id.toString(),
            role: newUser.role,
        };

        const accessToken = signAccessToken(payload);
        const refreshToken = signRefreshToken(payload);

        const response = NextResponse.json({
            success: true,
            user: {
                loginId: newUser.loginId,
                fullName: newUser.fullName,
                role: newUser.role,
                clinicId: newClinic._id,
                clinicName: newClinic.clinicName
            }
        });

        setAuthCookies(response, accessToken, refreshToken);

        // 7. Audit Logging
        try {
            const { logAction } = await import('@/lib/audit');
            await logAction({
                clinicId: newClinic._id,
                userId: newUser._id,
                action: 'SIGNUP',
                resource: 'CLINIC',
                resourceId: newClinic._id,
                req
            });
        } catch (auditError) { }

        return response;

    } catch (error) {
        console.error('[CRITICAL SIGNUP ERROR]:', error);
        if (error.code === 11000) {
            return NextResponse.json({ error: 'Clinic or Login ID already exists' }, { status: 409 });
        }
        return NextResponse.json({
            error: 'Failed to create account',
            details: error.message
        }, { status: 500 });
    }
}
