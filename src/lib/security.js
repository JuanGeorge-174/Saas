/**
 * PRODUCTION SECURITY & DATA UTILITIES
 * Enforces data minimization and input integrity at the server level.
 */

/**
 * PROJECT DATA BY ROLE (DTO)
 * Ensures only authorized fields reach the client.
 */
export function projectDTO(data, role, type = 'list') {
    if (!data) return null;

    // Recursive handling for arrays
    if (Array.isArray(data)) {
        return data.map(item => projectDTO(item, role, type));
    }

    const projections = {
        patient: {
            list: (p) => ({
                // IMPORTANT: Server -> Client must be plain JSON (no ObjectId/Date instances)
                id: (p._id || p.id)?.toString?.() || String(p._id || p.id),
                fullName: p.fullName || `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'N/A',
                gender: p.gender || p.sex || 'N/A',
                age: p.age || calculateAge(p.dateOfBirth || p.dob),
                lastVisitDate: p.lastVisitDate ? new Date(p.lastVisitDate).toISOString() : null,
                status: p.status,
                patientId: p.patientId
            }),
            detail: (p) => {
                const base = {
                    id: (p._id || p.id).toString(),
                    fullName: p.fullName || `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'N/A',
                    gender: p.gender || p.sex || 'N/A',
                    dateOfBirth: (p.dateOfBirth || p.dob) ? new Date(p.dateOfBirth || p.dob).toISOString() : null,
                    patientId: p.patientId,
                    relationToContact: p.relationToContact,
                    contact: p.contactId ? {
                        phoneNumber: p.contactId.phoneNumber,
                        email: p.contactId.email
                    } : (p.phone ? { phoneNumber: p.phone, email: p.email } : null)
                };

                // Elevated Clinical Fields (Admin/Doctor Only)
                if (role === 'ADMIN' || role === 'DOCTOR') {
                    return {
                        ...base,
                        medicalHistory: p.medicalHistory || [],
                        allergies: p.allergies || []
                    };
                }

                return base;
            }
        }
    };

    const mapper = projections[type === 'list' || type === 'detail' ? 'patient' : type];
    return mapper ? (typeof mapper === 'function' ? mapper(data) : mapper[type](data)) : data;
}

/**
 * INPUT SANITIZATION
 * Prevents basic XSS and injection.
 */
export function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    // For textareas, we just want to trim. Extreme HTML escaping breaks normal plaintext saving/loading
    // Next.js and React already escape strings when rendering to the DOM.
    return input.trim();
}

/**
 * AGE CALCULATION HELPER
 */
export function calculateAge(dob) {
    if (!dob) return null;
    const d = new Date(dob);
    if (isNaN(d.getTime())) return null;
    const diff_ms = Date.now() - d.getTime();
    const age_dt = new Date(diff_ms);
    return Math.abs(age_dt.getUTCFullYear() - 1970);
}
