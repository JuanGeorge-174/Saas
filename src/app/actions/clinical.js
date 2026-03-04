'use server';

import mongoose from 'mongoose';
import dbConnect from '@/lib/db/index';
import Visit from '@/lib/db/models/Visit';
import { authorize } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { logAction } from '@/lib/audit';
import { revalidatePath } from 'next/cache';
import { sanitizeInput } from '@/lib/security';

/**
 * SAVE CLINICAL NOTES
 * Post-closure notes are immutable (PRD Rule).
 */
export async function saveClinicalNotes(visitId, data) {
    try {
        await dbConnect();
        const session = await authorize(PERMISSIONS.UPDATE_VISIT);
        const { clinicId, userId } = session;

        const visit = await Visit.findOne({ _id: visitId, clinicId });
        if (!visit) return { success: false, error: 'Visit not found' };

        // IMMUTABILITY CHECK (PRD RULE)
        if (visit.status === 'COMPLETED' || visit.status === 'CANCELLED') {
            return { success: false, error: 'Cannot edit notes for a closed or cancelled visit' };
        }

        const changes = {
            chiefComplaint: sanitizeInput(data.chiefComplaint),
            diagnosis: sanitizeInput(data.diagnosis),
            treatment: sanitizeInput(data.treatment),
            prescription: sanitizeInput(data.prescription),
            doctorNotes: sanitizeInput(data.doctorNotes),
            updatedBy: userId
        };

        await Visit.findByIdAndUpdate(visitId, changes);

        await logAction({
            clinicId,
            userId,
            action: 'NOTES_UPDATED',
            moduleName: 'CLINICAL',
            resource: 'VISIT',
            resourceId: visitId,
            changes,
            severity: 'INFO'
        });

        revalidatePath('/admin');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Unauthorized' };
    }
}
