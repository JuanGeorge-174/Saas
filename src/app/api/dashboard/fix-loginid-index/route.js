import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db/index';
import User from '@/lib/db/models/User';

export async function POST() {
    try {
        await dbConnect();
        
        const db = mongoose.connection.db;
        const collection = db.collection('users');
        
        // Get all indexes
        const indexes = await collection.indexes();
        console.log('Current indexes:', indexes.map(i => ({ name: i.name, key: i.key, unique: i.unique, sparse: i.sparse })));
        
        // Find the compound index on clinicId and loginId
        const loginIdIndex = indexes.find(index => 
            index.key && 
            index.key.clinicId === 1 && 
            index.key.loginId === 1
        );
        
        if (loginIdIndex) {
            // Drop the existing index
            await collection.dropIndex(loginIdIndex.name);
            console.log('Dropped loginId compound index:', loginIdIndex.name);
            
            // Create a new sparse index that excludes deleted users
            await collection.createIndex(
                { clinicId: 1, loginId: 1 },
                { 
                    unique: true,
                    sparse: true,
                    partialFilterExpression: { isDeleted: { $ne: true } }
                }
            );
            console.log('Created new sparse loginId index with partial filter');
            
            return NextResponse.json({ 
                success: true, 
                message: 'LoginId index updated to exclude deleted users',
                droppedIndex: loginIdIndex.name,
                newIndex: 'clinicId_1_loginId_1_sparse'
            });
        } else {
            return NextResponse.json({ 
                success: true, 
                message: 'No clinicId+loginId compound index found'
            });
        }
        
    } catch (error) {
        console.error('Error fixing loginId index:', error);
        return NextResponse.json({ 
            error: error.message 
        }, { status: 500 });
    }
}
