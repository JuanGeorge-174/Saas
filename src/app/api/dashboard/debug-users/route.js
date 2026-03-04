import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db/index';
import User from '@/lib/db/models/User';

export async function GET() {
    try {
        await dbConnect();
        
        // Get the real clinic ID
        const Clinic = require('@/lib/db/models/Clinic').default;
        const clinic = await Clinic.findOne();
        const realClinicId = clinic ? clinic._id : new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');
        
        console.log('Debug - Using clinic ID:', realClinicId);
        
        // Get ALL users (including deleted) to see what exists
        const allUsers = await User.find({ clinicId: realClinicId })
            .select('loginId fullName email role isActive isDeleted createdAt')
            .sort({ createdAt: -1 });
        
        // Get only active users
        const activeUsers = await User.find({ 
            clinicId: realClinicId, 
            isDeleted: { $ne: true } 
        })
            .select('loginId fullName email role isActive createdAt')
            .sort({ createdAt: -1 });
        
        return NextResponse.json({
            clinicId: realClinicId.toString(),
            allUsers: allUsers.map(u => ({
                loginId: u.loginId,
                fullName: u.fullName,
                email: u.email,
                role: u.role,
                isActive: u.isActive,
                isDeleted: u.isDeleted,
                createdAt: u.createdAt
            })),
            activeUsers: activeUsers.map(u => ({
                loginId: u.loginId,
                fullName: u.fullName,
                email: u.email,
                role: u.role,
                isActive: u.isActive,
                createdAt: u.createdAt
            })),
            summary: {
                totalUsers: allUsers.length,
                activeUsers: activeUsers.length,
                deletedUsers: allUsers.length - activeUsers.length
            }
        });
        
    } catch (error) {
        console.error('Debug error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
