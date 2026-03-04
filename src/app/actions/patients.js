'use server';

import mongoose from 'mongoose';
import dbConnect from '@/lib/db/index';
import Patient from '@/lib/db/models/Patient';
import Contact from '@/lib/db/models/Contact';
import Clinic from '@/lib/db/models/Clinic';
import Visit from '@/lib/db/models/Visit';
import { authorize } from '@/lib/auth/session';
import { PERMISSIONS, hasPermission } from '@/lib/rbac/permissions';
import { sanitizeInput, projectDTO, calculateAge } from '@/lib/security';
import { revalidatePath } from 'next/cache';
import { logAction } from '@/lib/audit';

/**
 * REGISTER PATIENT (WITH DUPLICATE PREVENTION)
 */
export async function registerPatient(formData) {
    try {
        await dbConnect();
        const session = await authorize(PERMISSIONS.REGISTER_PATIENT);
        const { clinicId, userId } = session;

        // 1. Sanitize & Destructure
        const fullName = sanitizeInput(formData.fullName);
        const phoneNumber = sanitizeInput(formData.phoneNumber);
        const email = sanitizeInput(formData.email);

        // Robust Date Parsing
        const rawDob = formData.dateOfBirth;
        const dob = (rawDob && !isNaN(new Date(rawDob))) ? new Date(rawDob) : null;

        const relationToContact = formData.relationToContact || 'self';
        const address = sanitizeInput(formData.address);
        const medicalHistory = sanitizeInput(formData.medicalHistory);
        const allergies = sanitizeInput(formData.allergies);
        const forceCreate = formData.forceCreate || false;
        const createVisitToday = formData.createVisitToday !== false; // default true

        // 2. SEARCH FOR MATCHES (Before saving)
        if (!forceCreate) {
            // Find Contact(s) with this phone
            const contacts = await Contact.find({ clinicId, phoneNumber });
            const contactIds = contacts.map(c => c._id);

            // Find Patients linked to those contacts OR with same Name + DOB
            const matches = await Patient.find({
                clinicId,
                $or: [
                    { contactId: { $in: contactIds } },
                    { fullName: { $regex: new RegExp(`^${fullName}$`, 'i') }, dateOfBirth: dob }
                ],
                isDeleted: { $ne: true }
            }).populate('contactId');

            if (matches.length > 0) {
                // Determine match strength
                const results = matches.map(p => {
                    const isStrong = (p.contactId?.phoneNumber === phoneNumber && p.dateOfBirth.getTime() === dob.getTime());
                    const isMedium = (p.fullName.toLowerCase() === fullName.toLowerCase() && p.dateOfBirth.getTime() === dob.getTime());

                    return {
                        patient: projectDTO(p, session.role, 'detail'),
                        strength: isStrong ? 'STRONG' : isMedium ? 'MEDIUM' : 'WEAK'
                    };
                });

                return {
                    success: false,
                    type: 'DUPLICATE_FOUND',
                    matches: results
                };
            }
        }

        // 3. PERSISTENCE
        let contact = await Contact.findOne({ clinicId, phoneNumber });
        if (!contact) {
            contact = await Contact.create({ clinicId, phoneNumber, email });
        }

        const patientCount = await Patient.countDocuments({ clinicId });
        const patientId = `P-${1000 + patientCount + 1}`;

        // ... inside registerPatient ...
        const patient = await Patient.create({
            clinicId,
            patientId,
            fullName,
            dateOfBirth: dob,
            dob: dob, // Legacy fallback
            gender: formData.gender,
            sex: formData.gender, // Legacy fallback
            phone: phoneNumber, // Legacy fallback
            age: dob ? calculateAge(dob) : null, // Safety check
            contactId: contact._id,
            relationToContact,
            address,
            medicalHistory,
            allergies,
            createdBy: userId
        });

        // OPTIONAL: Create today's visit by default (matches workflow: patient comes -> new visit)
        // This is what drives dashboard metrics + queue.
        console.log(`[registerPatient] createVisitToday: ${createVisitToday}, patientId: ${patient._id}`);
        if (createVisitToday) {
            const now = new Date();
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);

            try {
                const clinicIdObj = new mongoose.Types.ObjectId(clinicId);
                const visitRecord = await Visit.create({
                    clinicId: clinicIdObj,
                    patientId: patient._id,
                    visitType: 'WALK_IN',
                    visitDate: startOfDay,
                    arrivalTime: now,
                    status: 'WAITING',
                    createdBy: userId
                });
                console.log(`[registerPatient] Visit created: ${visitRecord._id}`);

                // Keep patient rollup current for list sorting
                patient.lastVisitDate = startOfDay;
                await patient.save();
            } catch (vErr) {
                const fs = require('fs');
                fs.appendFileSync('error_log.txt', `[Visit Error] ${new Date().toISOString()}: ${vErr.message}\n${vErr.stack}\n`);
                console.error('[registerPatient] Visit creation failed:', vErr);
            }
        }

        // Audit Logging
        await logAction({
            clinicId,
            userId,
            action: 'PATIENT_REGISTERED',
            moduleName: 'PATIENTS',
            resource: 'PATIENT',
            resourceId: patient._id,
            changes: { fullName, patientId },
            severity: 'INFO'
        });

        // Update Clinic Metrics
        await Clinic.findByIdAndUpdate(clinicId, { $inc: { 'usage.patientCount': 1 } });

        revalidatePath('/admin');
        revalidatePath('/admin/patients');
        return { success: true, patientId: patient._id.toString() };

    } catch (error) {
        console.error('Registration Error:', error);
        return { success: false, error: error.message || 'Failed to register patient' };
    }
}

/**
 * EXPORT PATIENTS (SECURE CSV)
 * Enforces RBAC, max limits, and CSV injection protection.
 */
export async function exportPatients() {
    try {
        await dbConnect();
        const session = await authorize(PERMISSIONS.EXPORT_DATA);
        const { clinicId } = session;

        // 1. Fetch data (Max 5000 rows for performance/safety)
        const patients = await Patient.find({ clinicId, isDeleted: { $ne: true } })
            .limit(5000)
            .populate('contactId')
            .lean();

        // 2. CSV Generation with Hardening
        const headers = ['Patient ID', 'Full Name', 'Gender', 'DOB', 'Phone', 'Email', 'Relation', 'Status'];

        // Prevent CSV Injection (Excel/Google Sheets) by prepending a single quote if needed
        const escapeCSV = (val) => {
            const str = String(val || '');
            if (str.startsWith('=') || str.startsWith('+') || str.startsWith('-') || str.startsWith('@')) {
                return `'${str}`;
            }
            return str;
        };

        const rows = patients.map(p => {
            const gender = p.gender || p.sex || '';
            const dob = p.dateOfBirth || p.dob || null;
            const phone = p.contactId?.phoneNumber || p.phone || '';
            const email = p.contactId?.email || p.email || '';
            return [
                escapeCSV(p.patientId),
                escapeCSV(p.fullName),
                escapeCSV(gender),
                dob ? new Date(dob).toISOString().split('T')[0] : '',
                escapeCSV(phone),
                escapeCSV(email),
                escapeCSV(p.relationToContact || ''),
                escapeCSV(p.status || '')
            ];
        });

        const csvString = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        return { success: true, data: csvString, filename: `patients_${new Date().toISOString().split('T')[0]}.csv` };

    } catch (error) {
        console.error('Export Error:', error);
        return { success: false, error: 'Unauthorized or failed to export' };
    }
}

/**
 * GET PATIENT LIST (SERVER ACTION)
 */
export async function getPatients(query) {
    try {
        await dbConnect();
        const session = await authorize(PERMISSIONS.VIEW_PATIENTS);
        const { clinicId } = session;

        const { search, sort = 'fullName', order = 'asc', skip = 0, limit = 20, startDate, endDate } = query;

        // 1. Build Query
        const matchQuery = {
            clinicId: new mongoose.Types.ObjectId(clinicId),
            isDeleted: { $ne: true }
        };

        if (search) {
            const sanitizedSearch = sanitizeInput(search);
            // Search name (legacy & production), ID, or Phone (legacy & production)
            const contacts = await Contact.find({ clinicId, phoneNumber: { $regex: sanitizedSearch, $options: 'i' } });
            matchQuery.$or = [
                { fullName: { $regex: sanitizedSearch, $options: 'i' } },
                { firstName: { $regex: sanitizedSearch, $options: 'i' } },
                { lastName: { $regex: sanitizedSearch, $options: 'i' } },
                { patientId: { $regex: sanitizedSearch, $options: 'i' } },
                { phone: { $regex: sanitizedSearch, $options: 'i' } },
                { contactId: { $in: contacts.map(c => c._id) } }
            ];
        }

        // Date range filtering (registration date / createdAt)
        if (startDate || endDate) {
            matchQuery.createdAt = {};
            if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                matchQuery.createdAt.$lte = end;
            }
        }

        // 2. Fetch & Project (Strict RBAC DTO)
        const patients = await Patient.find(matchQuery)
            .sort({ [sort]: order === 'asc' ? 1 : -1 })
            .skip(skip)
            .limit(Math.min(limit, 100))
            .populate('contactId')
            .lean();

        console.log(`[getPatients] Clinic: ${clinicId}, Found: ${patients.length}`);

        return {
            success: true,
            patients: projectDTO(patients, session.role, 'list')
        };
    } catch (error) {
        return { success: false, error: 'Authorization failed' };
    }
}

/**
 * GET PATIENT DETAIL (ROLE-FILTERED)
 */
export async function getPatientDetail(id) {
    try {
        await dbConnect();
        const session = await authorize(PERMISSIONS.VIEW_PATIENTS);
        const { clinicId } = session;

        const patient = await Patient.findOne({ _id: id, clinicId, isDeleted: { $ne: true } })
            .populate('contactId')
            .lean();

        if (!patient) return { success: false, error: 'Patient not found' };

        return {
            success: true,
            patient: projectDTO(patient, session.role, 'detail')
        };
    } catch (error) {
        return { success: false, error: 'Unauthorized' };
    }
}
/**
 * BULK IMPORT PATIENTS
 */
export async function importPatients(data) {
    try {
        await dbConnect();
        const session = await authorize(PERMISSIONS.REGISTER_PATIENT);
        const { clinicId, userId } = session;

        const results = { count: 0, errors: [] };

        for (const item of data) {
            try {
                const fullName = sanitizeInput(item.fullName || item.name || item.fullName);
                const phoneNumber = sanitizeInput(item.phone || item.phoneNumber || item.Phone);
                if (!fullName || !phoneNumber) continue;

                let contact = await Contact.findOne({ clinicId, phoneNumber });
                if (!contact) {
                    contact = await Contact.create({ clinicId, phoneNumber, email: sanitizeInput(item.email || item.Email || '') });
                }

                const patientCount = await Patient.countDocuments({ clinicId });
                const patientId = `P-${1000 + patientCount + 1}`;

                await Patient.create({
                    clinicId,
                    patientId,
                    fullName,
                    dateOfBirth: item.dob || item.dateOfBirth ? new Date(item.dob || item.dateOfBirth) : new Date(),
                    gender: item.gender || item.sex || 'Other',
                    contactId: contact._id,
                    address: sanitizeInput(item.address || item.Address || ''),
                    medicalHistory: sanitizeInput(item.medicalHistory || item.History || ''),
                    allergies: sanitizeInput(item.allergies || item.Allergies || ''),
                    createdBy: userId
                });
                results.count++;
            } catch (err) {
                results.errors.push(`${item.fullName || 'Unknown'}: ${err.message}`);
            }
        }

        await logAction({
            clinicId,
            userId,
            action: 'PATIENTS_BULK_IMPORTED',
            moduleName: 'PATIENTS',
            resource: 'PATIENT',
            changes: { count: results.count },
            severity: 'INFO'
        });

        revalidatePath('/admin');
        revalidatePath('/admin/patients');
        return { success: true, count: results.count, errors: results.errors };
    } catch (error) {
        console.error('Import action error:', error);
        return { success: false, error: 'Unauthorized' };
    }
}
/**
 * LIVE DUPLICATE CHECK
 * (Used for background matching while typing)
 */
export async function checkDuplicates(data) {
    try {
        await dbConnect();
        const session = await authorize(PERMISSIONS.VIEW_PATIENTS);
        const { clinicId } = session;

        const fullName = sanitizeInput(data.fullName);
        const phoneNumber = sanitizeInput(data.phoneNumber);
        const dob = data.dateOfBirth ? new Date(data.dateOfBirth) : null;

        if (!fullName && !phoneNumber) return { success: true, matches: [] };

        const contacts = await Contact.find({ clinicId, phoneNumber });
        const contactIds = contacts.map(c => c._id);

        const matchQuery = {
            clinicId,
            $or: [],
            isDeleted: { $ne: true }
        };

        if (contactIds.length > 0) matchQuery.$or.push({ contactId: { $in: contactIds } });
        if (fullName) matchQuery.$or.push({ fullName: { $regex: new RegExp(`^${fullName}$`, 'i') } });

        if (matchQuery.$or.length === 0) return { success: true, matches: [] };

        const matches = await Patient.find(matchQuery).populate('contactId').lean();

        const results = matches.map(p => ({
            patient: projectDTO(p, session.role, 'detail'),
            strength: (p.contactId?.phoneNumber === phoneNumber && dob && p.dateOfBirth?.getTime() === dob.getTime()) ? 'STRONG' : 'MEDIUM'
        }));

        return { success: true, matches: results };
    } catch (error) {
        return { success: false, error: 'Check failed' };
    }
}
