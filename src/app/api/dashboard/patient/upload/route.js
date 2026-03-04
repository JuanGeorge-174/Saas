import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/index';
import Patient from '@/lib/db/models/Patient';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(req) {
    try {
        await dbConnect();

        const formData = await req.formData();
        const file = formData.get('file');
        const id = formData.get('id');

        if (!file || !id) {
            return NextResponse.json({ error: 'Missing file or patient ID' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create unique filename
        const filename = `${Date.now()}-${file.name}`;
        const uploadDir = join(process.cwd(), 'public', 'uploads');
        const filepath = join(uploadDir, filename);

        // Ensure directory exists
        const fs = require('fs');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        await writeFile(filepath, buffer);

        const fileUrl = `/uploads/${filename}`;

        // Update patient document
        const patient = await Patient.findById(id);
        if (!patient) {
            return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
        }

        patient.documents = patient.documents || [];
        patient.documents.push(fileUrl);
        await patient.save();

        return NextResponse.json({
            ...patient.toObject(),
            id: patient._id.toString(),
            _id: undefined
        });
    } catch (error) {
        console.error('Upload Error:', error);
        return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }
}
