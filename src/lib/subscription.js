export function checkSubscription(clinic) {
    if (!clinic) return { active: false, reason: 'Clinic not found' };

    // Check if isActive flag is false
    if (!clinic.isActive) return { active: false, reason: 'Clinic suspended' };

    const now = new Date();

    // Logic for grace period (e.g., 7 days after expiry)
    if (clinic.subscriptionEndDate && now > clinic.subscriptionEndDate) {
        const gracePeriodDays = 7;
        const graceEnd = new Date(clinic.subscriptionEndDate);
        graceEnd.setDate(graceEnd.getDate() + gracePeriodDays);

        if (now > graceEnd) {
            return { active: false, reason: 'Subscription expired' };
        }
        return { active: true, status: 'GRACE_PERIOD' };
    }

    if (clinic.subscriptionStatus !== 'ACTIVE' && clinic.subscriptionStatus !== 'TRIAL') {
        return { active: false, reason: 'Subscription inactive' };
    }

    return { active: true, status: clinic.subscriptionStatus };
}

/**
 * Checks if a feature is available on the current plan
 * @param {string} plan - FREE, BASIC, PRO, ENTERPRISE
 * @param {string} feature - e.g., "ADVANCED_REPORTS"
 */
export function isFeatureAllowed(plan, feature) {
    const PLAN_FEATURES = {
        'FREE': ['PATIENTS_BASIC', 'APPOINTMENTS_BASIC'],
        'BASIC': ['PATIENTS_BASIC', 'APPOINTMENTS_BASIC', 'REPORTS_BASIC'],
        'PRO': ['PATIENTS_FULL', 'APPOINTMENTS_FULL', 'REPORTS_FULL', 'FILE_UPLOAD', 'RECALLS'],
        'ENTERPRISE': ['ALL']
    };

    if (PLAN_FEATURES[plan]?.includes('ALL')) return true;
    return PLAN_FEATURES[plan]?.includes(feature) || false;
}
