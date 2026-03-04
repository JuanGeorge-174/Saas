import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db/index';
import User from '@/lib/db/models/User';
import { verifyAccessToken } from '@/lib/auth/tokens';
import { authorize } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import bcrypt from 'bcryptjs';

/**
 * STAFF & USER MANAGEMENT API
 * Admin-only access to manage clinic team members.
 */

export async function GET(req) {
    try {
        await dbConnect();
        
        // Get the real clinic ID from the clinic collection
        const Clinic = require('@/lib/db/models/Clinic').default;
        const clinic = await Clinic.findOne();
        const realClinicId = clinic ? clinic._id : new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');
        console.log('GET - Using real clinic ID:', realClinicId);

        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search');

        const query = { clinicId: realClinicId, isDeleted: { $ne: true } };
        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(query)
            .select('-passwordHash -refreshToken')
            .sort({ createdAt: -1 })
            .lean();

        console.log('Found users:', users.length);

        return NextResponse.json({
            users: users.map(u => ({
                id: u._id.toString(),
                fullName: u.fullName,
                loginId: u.loginId,
                email: u.email,
                phone: u.phone,
                role: u.role,
                isActive: u.isActive,
                createdAt: u.createdAt
            }))
        });

    } catch (error) {
        console.error('GET Error:', error);
        return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
}

export async function POST(req) {
    try {
        console.log('POST request started');
        await dbConnect();
        console.log('Database connected');
        
        // Get the real clinic ID from the clinic collection
        const Clinic = require('@/lib/db/models/Clinic').default;
        const clinic = await Clinic.findOne();
        const realClinicId = clinic ? clinic._id : new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');
        console.log('POST - Using real clinic ID:', realClinicId);
        
        const body = await req.json();
        console.log('POST - Request body:', body);
        const { id, fullName, email, phone, role, password, loginId } = body;

        if (id) {
            // Update existing user
            const existingUser = await User.findOne({ _id: id, clinicId: realClinicId });
            if (!existingUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

            // Check if loginId is being changed and if the new loginId already exists (exclude deleted users)
            if (loginId && loginId !== existingUser.loginId) {
                const loginIdConflict = await User.findOne({ 
                    loginId: loginId.toLowerCase().trim(), 
                    clinicId: realClinicId,
                    isDeleted: { $ne: true },
                    _id: { $ne: id } // Exclude current user
                });
                if (loginIdConflict) {
                    return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
                }
                existingUser.loginId = loginId.toLowerCase().trim();
            }

            if (fullName) existingUser.fullName = fullName;
            if (email) existingUser.email = email;
            if (phone !== undefined) existingUser.phone = phone;
            if (role) existingUser.role = role;

            await existingUser.save();
            return NextResponse.json({ success: true, user: { id: existingUser._id, fullName: existingUser.fullName } });
        } else {
            // Create new user (Simplified form: Name, Role, LoginId, Password)
            if (!fullName || !loginId || !password || !role) {
                return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
            }

            // Check if loginId already exists within this clinic (exclude deleted users)
            console.log('Checking for existing loginId:', loginId.toLowerCase().trim());
            console.log('Clinic ID:', realClinicId);
            
            const existing = await User.findOne({ 
                loginId: loginId.toLowerCase().trim(), 
                clinicId: realClinicId,
                isDeleted: { $ne: true }
            });
            
            console.log('Existing user found:', existing);
            
            if (existing) {
                console.log('Username conflict detected with user:', existing);
                return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            console.log('Password hashed successfully');

            const newUser = await User.create({
                clinicId: realClinicId,
                fullName,
                loginId: loginId.toLowerCase().trim(),
                // Don't set email field at all if not provided to avoid unique index issues
                ...(email && { email }),
                phone: phone || '',
                role,
                passwordHash: hashedPassword, // Fixed: user model uses passwordHash
                isActive: true,
            });
            console.log('User created successfully:', newUser._id);

            return NextResponse.json({ success: true, user: { id: newUser._id, fullName: newUser.fullName } });
        }

    } catch (error) {
        console.error('POST Error:', error);
        return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
}

export async function DELETE(req) {
    try {
        console.log('DELETE request received');
        await dbConnect();
        console.log('Database connected for DELETE');
        
        // Get the real clinic ID from the clinic collection
        const Clinic = require('@/lib/db/models/Clinic').default;
        const clinic = await Clinic.findOne();
        const realClinicId = clinic ? clinic._id : new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');
        console.log('DELETE - Using real clinic ID:', realClinicId);
        
        const body = await req.json();
        console.log('DELETE - Request body:', body);
        const { id } = body;

        const userToDelete = await User.findOne({ _id: id, clinicId: realClinicId });
        if (!userToDelete) return NextResponse.json({ error: 'User not found' }, { status: 404 });
        
        console.log('User to delete:', { id: userToDelete._id, role: userToDelete.role, fullName: userToDelete.fullName });

        // Prevent deletion of admin accounts
        if (userToDelete.role === 'ADMIN') {
            console.log('Attempting to delete admin user - checking admin count...');
            // Check if this is the last admin in the clinic
            const adminCount = await User.countDocuments({ 
                clinicId: realClinicId, 
                role: 'ADMIN', 
                isActive: true, 
                isDeleted: { $ne: true } 
            });
            
            console.log('Current admin count:', adminCount);
            
            if (adminCount <= 1) {
                return NextResponse.json({ 
                    error: 'Cannot delete the last admin account. At least one admin must exist.' 
                }, { status: 400 });
            }
            
            return NextResponse.json({ 
                error: 'Admin accounts cannot be deleted for security reasons.' 
            }, { status: 400 });
        }

        // Soft delete
        userToDelete.isDeleted = true;
        userToDelete.isActive = false;
        await userToDelete.save();
        
        console.log('User soft deleted successfully');

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('DELETE Error:', error);
        return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
}
