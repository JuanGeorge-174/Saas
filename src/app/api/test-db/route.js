import dbConnect from '@/lib/db/index';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        await dbConnect();
        return NextResponse.json({ message: 'Connected to MongoDB successfully!' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to connect to MongoDB', details: error.message }, { status: 500 });
    }
}
