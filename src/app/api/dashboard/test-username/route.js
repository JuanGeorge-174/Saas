import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db/index';
import User from '@/lib/db/models/User';

export async function POST(req) {
    try {
        await dbConnect();
        
        const body = await req.json();
        const { loginId } = body;
        
        // Get the real clinic ID
        const Clinic = require('@/lib/db/models/Clinic').default;
        const clinic = await Clinic.findOne();
        const realClinicId = clinic ? clinic._id : new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');
        
        console.log('Testing username:', loginId);
        console.log('Clinic ID:', realClinicId);
        
        // Check ALL users with this loginId
        const allUsers = await User.find({ 
            loginId: loginId.toLowerCase().trim(), 
            clinicId: realClinicId 
        }).select('loginId isDeleted isActive fullName');
        
        console.log('All users with this loginId:', allUsers);
        
        // Check only active users
        const activeUsers = await User.find({ 
            loginId: loginId.toLowerCase().trim(), 
            clinicId: realClinicId,
            isDeleted: { $ne: true }
        }).select('loginId isDeleted isActive fullName');
        
        console.log('Active users with this loginId:', activeUsers);
        
        return NextResponse.json({
            loginId: loginId,
            clinicId: realClinicId.toString(),
            allUsers: allUsers,
            activeUsers: activeUsers,
            canReuse: activeUsers.length === 0
        });
        
    } catch (error) {
        console.error('Test error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
