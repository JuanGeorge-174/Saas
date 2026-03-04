const mongoose = require('mongoose');
const passwordLib = require('../src/lib/auth/password'); // Use local lib
require('dotenv').config({ path: '.env.local' });

// We need to use the models as defined in your source, but since this is a standalone 
// node script, we'll redefine them briefly or import them if possible.
// Redefining them simply here to avoid path alias issues (@/lib/...) in a raw node script.

const Clinic = mongoose.models.Clinic || mongoose.model('Clinic', new mongoose.Schema({
    clinicName: String,
    clinicSlug: { type: String, unique: true },
    adminName: String,
    email: String,
    phone: String,
    subscriptionStatus: String,
    termsAccepted: Boolean,
    isActive: { type: Boolean, default: true },
    usage: { userCount: { type: Number, default: 0 } }
}));

const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
    clinicId: mongoose.Schema.Types.ObjectId,
    loginId: String,
    passwordHash: { type: String, select: false },
    fullName: String,
    email: String,
    role: String,
    isActive: { type: Boolean, default: true }
}));

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Please provide MONGODB_URI environment variable in .env.local');
    process.exit(1);
}

async function seed() {
    console.log('Connecting to:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB');

    // Clean up existing data to avoid unique constraint errors
    await Clinic.deleteMany({ clinicName: 'Smile Safe Demo Clinic' });
    await Clinic.deleteMany({ clinicSlug: null }); // Remove corrupted entries
    await User.deleteMany({ email: { $in: ['admin@demo.com', 'doctor@demo.com', 'frontdesk@demo.com'] } });

    // 1. Create a Test Clinic
    const clinic = await Clinic.create({
        clinicName: 'Smile Safe Demo Clinic',
        clinicSlug: 'smile-safe-demo-clinic',
        adminName: 'Dr. Admin',
        email: 'admin@smilesafe.com',
        phone: '555-0100',
        subscriptionStatus: 'ACTIVE',
        termsAccepted: true
    });
    console.log('Created Clinic:', clinic._id);

    // 2. Create Users
    const passwordHash = await passwordLib.hashPassword('Password123!');

    const admin = await User.create({
        clinicId: clinic._id,
        loginId: 'admin',
        email: 'admin@demo.com',
        passwordHash,
        fullName: 'Dr. Admin',
        role: 'ADMIN'
    });

    const doctor = await User.create({
        clinicId: clinic._id,
        loginId: 'doctor',
        email: 'doctor@demo.com',
        passwordHash,
        fullName: 'Dr. Smith',
        role: 'DOCTOR'
    });

    const receptionist = await User.create({
        clinicId: clinic._id,
        loginId: 'reception',
        email: 'frontdesk@demo.com',
        passwordHash,
        fullName: 'Sarah Jones',
        role: 'RECEPTIONIST'
    });

    console.log('Created Users (Password: Password123!)');
    console.log('- Admin Login ID: admin');
    console.log('- Doctor Login ID: doctor');
    console.log('- Reception Login ID: reception');
    console.log('Clinic Name: Smile Safe Demo Clinic');

    await mongoose.disconnect();
}

seed().catch(err => {
    console.error(err);
    process.exit(1);
});
