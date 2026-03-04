import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/index';
import User from '@/lib/db/models/User';
import { authorize } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import bcrypt from 'bcryptjs';

/**
 * PASSWORD CHANGE API
 * Admin-only access to change user passwords
 */

export async function POST(req) {
    try {
        await dbConnect();
        const session = await authorize(PERMISSIONS.MANAGE_USERS);
        const { clinicId } = session;

        const body = await req.json();
        const { userId, newPassword } = body;

        if (!userId || !newPassword) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (newPassword.length < 8) {
            return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
        }

        // Find user and verify they belong to the same clinic
        const user = await User.findOne({ _id: userId, clinicId });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        user.passwordHash = hashedPassword;
        await user.save();

        return NextResponse.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Password change error:', error);
        return NextResponse.json({
            error: error.message || 'Failed to change password'
        }, { status: error.status || 500 });
    }
}
