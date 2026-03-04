import mongoose from 'mongoose';
import dbConnect from './src/lib/db/index.js';
import Patient from './src/lib/db/models/Patient.js';
import Contact from './src/lib/db/models/Contact.js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function diagnose() {
    try {
        await dbConnect();
        console.log('--- RAW DB DIAGNOSTIC ---');

        const patients = await Patient.find({}).populate('contactId').lean();
        console.log(`Total Patients in DB: ${patients.length}`);

        patients.forEach((p, i) => {
            console.log(`[${i + 1}] ID: ${p.patientId || 'N/A'}, Name: ${p.fullName}, Clinic: ${p.clinicId}, Deleted: ${p.isDeleted}`);
            console.log(`    Fields: phone=${p.phone}, sex=${p.sex}, age=${p.age}, gender=${p.gender}, dob=${p.dateOfBirth}`);
            console.log(`    Contact: ${p.contactId ? p.contactId.phoneNumber : 'NONE'}`);
        });

        const contacts = await Contact.find({}).lean();
        console.log(`Total Contacts in DB: ${contacts.length}`);

        console.log('-------------------------');
        process.exit(0);
    } catch (err) {
        console.error('Diagnostic failed:', err);
        process.exit(1);
    }
}

diagnose();
