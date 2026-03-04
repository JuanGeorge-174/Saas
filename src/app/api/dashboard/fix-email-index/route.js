import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db/index';
import User from '@/lib/db/models/User';

export async function POST() {
    try {
        await dbConnect();
        
        // Drop the unique index on email field if it exists
        const db = mongoose.connection.db;
        const collection = db.collection('users');
        
        // Get all indexes
        const indexes = await collection.indexes();
        console.log('Current indexes:', indexes);
        
        // Find and drop the email unique index
        const emailIndex = indexes.find(index => 
            index.key && index.key.email === 1 && index.unique
        );
        
        if (emailIndex) {
            await collection.dropIndex(emailIndex.name);
            console.log('Dropped email unique index:', emailIndex.name);
            return NextResponse.json({ 
                success: true, 
                message: 'Email unique index dropped successfully',
                droppedIndex: emailIndex.name
            });
        } else {
            console.log('No unique email index found');
            return NextResponse.json({ 
                success: true, 
                message: 'No unique email index found to drop'
            });
        }
        
    } catch (error) {
        console.error('Error fixing email index:', error);
        return NextResponse.json({ 
            error: error.message 
        }, { status: 500 });
    }
}
