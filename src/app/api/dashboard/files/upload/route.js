import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/index';
import Patient from '@/lib/db/models/Patient';
import Visit from '@/lib/db/models/Visit';
import FileModel from '@/lib/db/models/File';
import Clinic from '@/lib/db/models/Clinic';
import { authorize } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req) {
    try {
        await dbConnect();

        // 1. Authorize
        const session = await authorize(PERMISSIONS.UPLOAD_FILES);
        const { clinicId, userId } = session;

        const formData = await req.formData();
        const file = formData.get('file');
        const patientId = formData.get('patientId');
        const visitId = formData.get('visitId'); // Optional, link to specific visit
        const category = formData.get('category') || 'OTHER';

        if (!file || !patientId) {
            return NextResponse.json({ error: 'Missing file or patient ID' }, { status: 400 });
        }

        // 2. Validate File
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json({ error: 'Invalid file type. Only JPG, PNG, and PDF are allowed.' }, { status: 400 });
        }
        if (file.size > MAX_SIZE) {
            return NextResponse.json({ error: 'File too large. Max 5MB allowed.' }, { status: 400 });
        }

        // 3. Check Clinic Storage Limits
        const clinic = await Clinic.findById(clinicId);
        if (!clinic.hasStorageSpace(file.size / (1024 * 1024))) {
            return NextResponse.json({ error: 'Storage limit reached for your clinic' }, { status: 403 });
        }

        // 4. Save to Disk (In production, use S3/GridFS)
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const relativePath = `/uploads/${clinicId}/${filename}`;
        const uploadDir = join(process.cwd(), 'public', 'uploads', clinicId.toString());
        const fullPath = join(uploadDir, filename);

        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        await writeFile(fullPath, buffer);

        // 5. Create File Record
        const newFile = await FileModel.create({
            clinicId,
            patientId,
            visitId: visitId || null,
            uploadedBy: userId,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            filePath: relativePath,
            category,
            accessibleBy: ['ADMIN', 'DOCTOR'] // Security: Receptionist cannot view by default
        });

        // Update Clinic usage
        await Clinic.findByIdAndUpdate(clinicId, {
            $inc: { 'usage.storageUsedMB': file.size / (1024 * 1024) }
        });

        // If visitId provided, link file to visit
        if (visitId) {
            await Visit.findByIdAndUpdate(visitId, { $push: { files: newFile._id } });
        }

        return NextResponse.json({
            success: true,
            file: {
                id: newFile._id,
                name: newFile.fileName,
                url: newFile.filePath,
                category: newFile.category
            }
        });

    } catch (error) {
        console.error('File Upload API Error:', error);
        return NextResponse.json({
            error: error.message || 'Failed to upload file'
        }, { status: error.status || 500 });
    }
}
