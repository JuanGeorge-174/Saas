'use server';

import dbConnect from '@/lib/db/index';
import Patient from '@/lib/db/models/Patient';
import Clinic from '@/lib/db/models/Clinic';
import Contact from '@/lib/db/models/Contact';
import { authorize } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';

/**
 * SYSTEM HEALTH CHECK
 * Verifies DB connectivity and returns counts for the authorized clinic.
 */
export async function getSystemHealth() {
    try {
        await dbConnect();
        const session = await authorize(PERMISSIONS.VIEW_DASHBOARD);
        const { clinicId } = session;

        const [patients, clinics, contacts] = await Promise.all([
            Patient.countDocuments({ clinicId }),
            Clinic.countDocuments({ _id: clinicId }),
            Contact.countDocuments({ clinicId })
        ]);

        return {
            success: true,
            stats: {
                patients,
                clinicExists: clinics > 0,
                contacts,
                mongodbStatus: 'CONNECTED',
                clinicId: clinicId.toString()
            }
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}
