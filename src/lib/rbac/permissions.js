export const ROLES = {
    ADMIN: 'ADMIN',
    DOCTOR: 'DOCTOR',
    RECEPTIONIST: 'RECEPTIONIST',
};

export const PERMISSIONS = {
    // --- Admin Only ---
    MANAGE_CLINIC: 'manage:clinic',
    VIEW_REVENUE: 'view:revenue',
    MANAGE_PAYMENTS: 'manage:payments',
    MANAGE_BILLING: 'manage:billing',
    MANAGE_USERS: 'manage:users',
    DELETE_PATIENT: 'delete:patient',
    EXPORT_DATA: 'export:data',

    // --- Doctor (Clinical) ---
    VIEW_MEDICAL_RECORDS: 'view:medical_records',
    ADD_VISIT_NOTES: 'add:visit_notes',
    UPLOAD_FILES: 'upload:files',
    VIEW_FILES: 'view:files',

    // --- Reception (Operational) ---
    MANAGE_APPOINTMENTS: 'manage:appointments',
    CHECK_IN_PATIENTS: 'check_in:patients',
    REGISTER_PATIENT: 'register:patient',
    UPDATE_PATIENT_INFO: 'update:patient_info',
    VIEW_RECALLS: 'view:recalls',

    // --- Shared ---
    VIEW_DASHBOARD: 'view:dashboard',
    VIEW_PATIENTS: 'view:patients',
    VIEW_APPOINTMENTS: 'view:appointments',
    VIEW_TREATMENT_PLANS: 'view:treatment_plans',
    MANAGE_TREATMENT_PLANS: 'manage:treatment_plans',
    VIEW_INVENTORY: 'view:inventory',
    MANAGE_INVENTORY: 'manage:inventory',
};

export const ROLE_PERMISSIONS = {
    [ROLES.ADMIN]: Object.values(PERMISSIONS),

    [ROLES.DOCTOR]: [
        PERMISSIONS.VIEW_DASHBOARD,
        PERMISSIONS.VIEW_PATIENTS,
        PERMISSIONS.VIEW_APPOINTMENTS,
        PERMISSIONS.MANAGE_APPOINTMENTS,
        PERMISSIONS.CHECK_IN_PATIENTS,
        PERMISSIONS.VIEW_MEDICAL_RECORDS,
        PERMISSIONS.ADD_VISIT_NOTES,
        PERMISSIONS.UPLOAD_FILES,
        PERMISSIONS.VIEW_FILES,
        PERMISSIONS.UPDATE_PATIENT_INFO,
        PERMISSIONS.VIEW_TREATMENT_PLANS,
        PERMISSIONS.MANAGE_TREATMENT_PLANS,
        PERMISSIONS.VIEW_INVENTORY,
    ],

    [ROLES.RECEPTIONIST]: [
        PERMISSIONS.VIEW_DASHBOARD,
        PERMISSIONS.VIEW_PATIENTS,
        PERMISSIONS.VIEW_APPOINTMENTS,
        PERMISSIONS.MANAGE_APPOINTMENTS,
        PERMISSIONS.CHECK_IN_PATIENTS,
        PERMISSIONS.REGISTER_PATIENT,
        PERMISSIONS.UPDATE_PATIENT_INFO,
        PERMISSIONS.VIEW_RECALLS,
        PERMISSIONS.VIEW_INVENTORY,
        PERMISSIONS.MANAGE_INVENTORY,
        PERMISSIONS.VIEW_MEDICAL_RECORDS,
        PERMISSIONS.VIEW_FILES,
        PERMISSIONS.VIEW_REVENUE,
        PERMISSIONS.MANAGE_PAYMENTS,
        PERMISSIONS.MANAGE_BILLING,
    ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role, permission) {
    if (!role || !ROLE_PERMISSIONS[role]) return false;
    return ROLE_PERMISSIONS[role].includes(permission);
}
