import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/index';
import User from '@/lib/db/models/User';
import PasswordResetToken from '@/lib/db/models/PasswordResetToken';
import { hashPassword } from '@/lib/auth/password';
import crypto from 'crypto';
import AuditLog from '@/lib/db/models/AuditLog';

export async function POST(req) {
    try {
        await dbConnect();
        const { token, password } = await req.json();

        if (!token || !password) {
            return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // 1. Find Valid Token
        const resetToken = await PasswordResetToken.findOne({
            token: hashedToken,
            expires: { $gt: new Date() },
            used: false
        });

        if (!resetToken) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
        }

        // 2. Update Password
        const user = await User.findById(resetToken.userId);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        user.passwordHash = await hashPassword(password);
        await user.save();

        // 3. Mark Token Used
        resetToken.used = true;
        await resetToken.save();

        // 4. Audit Log
        await AuditLog.create({
            clinicId: user.clinicId,
            userId: user._id,
            action: 'PASSWORD_RESET',
            resource: 'USER',
            resourceId: user._id,
            severity: 'WARNING'
        });

        return NextResponse.json({ success: true, message: 'Password reset successfully' });

    } catch (error) {
        console.error('Reset Password Error:', error);
        return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
    }
}
