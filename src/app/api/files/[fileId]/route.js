import { NextResponse } from 'next/server';
import { authorize } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import dbConnect from '@/lib/db/index';
import File from '@/lib/db/models/File';
import path from 'path';
import fs from 'fs/promises';

/**
 * SECURE FILE ACCESS ROUTE
 * Prevents unauthorized access to medical documents.
 */
export async function GET(req, { params }) {
    try {
        await dbConnect();
        const session = await authorize(PERMISSIONS.VIEW_FILES);

        const { fileId } = await params;

        // 1. Fetch File Metadata
        const fileRecord = await File.findOne({ _id: fileId, clinicId: session.clinicId });
        if (!fileRecord) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        // 2. Stream File with correct headers
        const filePath = path.join(process.cwd(), fileRecord.filePath);
        const fileBuffer = await fs.readFile(filePath);

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': fileRecord.fileType || 'application/octet-stream',
                'Content-Disposition': `inline; filename="${fileRecord.fileName}"`,
                'Cache-Control': 'private, max-age=3600'
            }
        });

    } catch (error) {
        console.error('Secure File Route Error:', error);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}
