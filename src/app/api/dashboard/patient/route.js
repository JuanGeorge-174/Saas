import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db/index';
import Patient from '@/lib/db/models/Patient';
import Visit from '@/lib/db/models/Visit';
import Clinic from '@/lib/db/models/Clinic';
import { authorize, getSession } from '@/lib/auth/session';
import { PERMISSIONS, hasPermission } from '@/lib/rbac/permissions';

export async function GET(req) {
    try {
        await dbConnect();
        const session = await authorize(PERMISSIONS.VIEW_PATIENTS);
        const { clinicId } = session;

        const { searchParams } = new URL(req.url);
        const skip = parseInt(searchParams.get('skip') || '0');
        const search = searchParams.get('search') || '';
        const sort = searchParams.get('sort') || 'fullName';
        const order = searchParams.get('order') || 'asc';
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // 1. Build Match Query (Multi-tenant scoped)
        const matchQuery = {
            clinicId: new mongoose.Types.ObjectId(clinicId),
            isDeleted: { $ne: true }
        };

        if (search) {
            matchQuery.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { patientId: { $regex: search, $options: 'i' } }
            ];
        }

        // Date Range Filtering
        if (startDate || endDate) {
            matchQuery.createdAt = {};
            if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                matchQuery.createdAt.$lte = end;
            }
        }

        // 2. Aggregation Pipeline
        const patients = await Patient.aggregate([
            { $match: matchQuery },
            // Join with Visits to find the latest
            {
                $lookup: {
                    from: 'visits',
                    localField: '_id',
                    foreignField: 'patientId',
                    as: 'allVisits'
                }
            },
            // Process extra data
            {
                $project: {
                    fullName: 1,
                    patientId: 1,
                    age: 1,
                    sex: 1,
                    phone: 1,
                    email: 1,
                    address: 1,
                    medicalHistory: 1,
                    allergies: 1,
                    status: 1,
                    registrationDate: 1,
                    lastVisit: { $max: "$allVisits.visitDate" },
                    createdAt: 1
                }
            },
            { $sort: { [sort]: order === 'asc' ? 1 : -1 } },
            { $skip: skip },
            { $limit: 20 }
        ]);

        const formattedPatients = patients.map(p => ({
            ...p,
            id: p._id.toString(),
            _id: undefined
        }));

        return NextResponse.json({ patients: formattedPatients });
    } catch (error) {
        console.error('Patient GET Error:', error);
        return NextResponse.json({
            error: error.message || 'Failed to fetch patients',
            patients: []
        }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        await dbConnect();

        // MOVE AUTHORIZE TO TOP (Fix for 401 in Next.js 15 POST routes)
        // Check if updating or creating to determine required permission
        const { searchParams } = new URL(req.url); // Use query param or peek body if possible
        // Since we can only read body once, we assume a generic 'WRITE' permission or peek the resource if needed.
        // For simplicity, we use REGISTER_PATIENT as a baseline or handle inside.
        // Actually, we can read req.json() after authorize.

        const session = await authorize(); // Basic auth first
        const { clinicId, userId } = session;

        const body = await req.json();
        const { id, fullName, age, sex, phone, email, address, medicalHistory, allergies, registrationDate } = body;

        // Domain-specific permission check
        const permission = id ? PERMISSIONS.UPDATE_PATIENT_INFO : PERMISSIONS.REGISTER_PATIENT;
        if (!hasPermission(session.role, permission)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (id) {
            // Update existing patient (Scoped by clinicId)
            const patient = await Patient.findOne({ _id: id, clinicId });
            if (!patient) {
                return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
            }

            patient.fullName = fullName || patient.fullName;
            patient.age = age || patient.age;
            patient.sex = sex || patient.sex;
            patient.phone = phone || patient.phone;
            patient.email = email || patient.email;
            patient.address = address || patient.address;
            patient.medicalHistory = medicalHistory || patient.medicalHistory;
            patient.allergies = allergies || patient.allergies;
            if (registrationDate) patient.registrationDate = new Date(registrationDate);

            await patient.save();

            return NextResponse.json({
                success: true,
                patient: {
                    id: patient._id,
                    fullName: patient.fullName,
                    patientId: patient.patientId
                }
            });
        } else {
            // Create new patient
            if (!fullName || !phone || !registrationDate) {
                return NextResponse.json({ error: 'Missing required fields (Name, Phone, Date of Visit)' }, { status: 400 });
            }

            // Generate clinic-scoped patient ID
            const patientCount = await Patient.countDocuments({ clinicId });
            const patientId = `P-${1000 + patientCount + 1}`;

            try {
                const patient = await Patient.create({
                    clinicId,
                    patientId,
                    fullName,
                    age,
                    sex,
                    phone,
                    email,
                    address,
                    medicalHistory: medicalHistory || [],
                    allergies: allergies || [],
                    dateOfBirth: new Date(dateOfBirth),
                    createdBy: userId
                });

                // Update clinic usage
                await Clinic.findByIdAndUpdate(clinicId, { $inc: { 'usage.patientCount': 1 } });

                return NextResponse.json({
                    success: true,
                    patient: {
                        id: patient._id,
                        fullName: patient.fullName,
                        patientId: patient.patientId
                    }
                });
            } catch (err) {
                if (err.code === 11000) {
                    return NextResponse.json({ error: 'A patient with this name and phone number already exists in this clinic.' }, { status: 409 });
                }
                throw err;
            }
        }
    } catch (error) {
        console.error('Patient POST Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to save patient' }, { status: error.status || 500 });
    }
}

export async function DELETE(req) {
    try {
        await dbConnect();
        const session = await authorize(PERMISSIONS.DELETE_PATIENT);
        const { clinicId } = session;

        const { id } = await req.json();

        // Soft delete (Privacy/Medical records usually kept)
        const result = await Patient.findOneAndUpdate(
            { _id: id, clinicId },
            { isDeleted: true },
            { new: true }
        );

        if (!result) {
            return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Patient DELETE Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to delete patient' }, { status: error.status || 500 });
    }
}
