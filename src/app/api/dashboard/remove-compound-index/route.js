import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db/index';

export async function POST() {
    try {
        await dbConnect();
        
        const db = mongoose.connection.db;
        const collection = db.collection('users');
        
        // Get all indexes
        const indexes = await collection.indexes();
        console.log('Current indexes:', indexes.map(i => ({ name: i.name, key: i.key, unique: i.unique })));
        
        // Find and drop the compound index on clinicId and loginId
        const compoundIndex = indexes.find(index => 
            index.key && 
            index.key.clinicId === 1 && 
            index.key.loginId === 1
        );
        
        if (compoundIndex) {
            await collection.dropIndex(compoundIndex.name);
            console.log('Dropped compound index:', compoundIndex.name);
            
            return NextResponse.json({ 
                success: true, 
                message: 'Compound clinicId+loginId index removed',
                droppedIndex: compoundIndex.name
            });
        } else {
            return NextResponse.json({ 
                success: true, 
                message: 'No compound clinicId+loginId index found'
            });
        }
        
    } catch (error) {
        console.error('Error removing compound index:', error);
        return NextResponse.json({ 
            error: error.message 
        }, { status: 500 });
    }
}
