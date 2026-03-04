import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/index';
import User from '@/lib/db/models/User';
import Clinic from '@/lib/db/models/Clinic';
import PasswordResetToken from '@/lib/db/models/PasswordResetToken';
import crypto from 'crypto';

export async function POST(req) {
    try {
        await dbConnect();
        const { clinicName, loginId, email } = await req.json();

        if (!clinicName || (!loginId && !email)) {
            return NextResponse.json({ error: 'Clinic name and Login ID/Email are required' }, { status: 400 });
        }

        // 1. Find Clinic
        const clinic = await Clinic.findOne({
            clinicName: { $regex: new RegExp(`^${clinicName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
            isActive: true
        });

        if (!clinic) {
            // Generic message for security
            return NextResponse.json({ message: 'If the details match our records, a reset link will be sent.' });
        }

        // 2. Find User
        const query = { clinicId: clinic._id, isActive: true };
        if (loginId) query.loginId = loginId.toLowerCase().trim();
        else query.email = email.toLowerCase().trim();

        const user = await User.findOne(query);

        if (!user) {
            return NextResponse.json({ message: 'If the details match our records, a reset link will be sent.' });
        }

        // 3. Generate Token
        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

        await PasswordResetToken.create({
            userId: user._id,
            clinicId: clinic._id,
            token: crypto.createHash('sha256').update(token).digest('hex'),
            expires
        });

        // 4. In a real app, send email here. 
        // For this implementation, we log it and return it for demo purposes (checklist says email confirmation but also reset password page)
        console.log(`[PASS_RESET] Token for ${user.fullName}: ${token}`);

        // Return success with hint (normally wouldn't return token in production)
        return NextResponse.json({
            success: true,
            message: 'Reset link generated successfully.',
            debugToken: token // ONLY FOR DEVELOPMENT/CHECKLIST TESTING
        });

    } catch (error) {
        console.error('Forgot Password Error:', error);
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
}
