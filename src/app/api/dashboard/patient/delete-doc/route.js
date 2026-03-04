import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/index';
import Patient from '@/lib/db/models/Patient';
import { unlink } from 'fs/promises';
import { join } from 'path';

export async function POST(req) {
    try {
        await dbConnect();

        const { id, doc } = await req.json();

        const patient = await Patient.findById(id);
        if (!patient) {
            return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
        }

        // Remove from database
        patient.documents = patient.documents.filter(d => d !== doc);
        await patient.save();

        // Delete file from filesystem
        try {
            const filename = doc.split('/').pop();
            const filepath = join(process.cwd(), 'public', 'uploads', filename);
            await unlink(filepath);
        } catch (err) {
            console.error('File deletion error:', err);
        }

        return NextResponse.json({
            ...patient.toObject(),
            id: patient._id.toString(),
            _id: undefined
        });
    } catch (error) {
        console.error('Delete Document Error:', error);
        return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
    }
}
