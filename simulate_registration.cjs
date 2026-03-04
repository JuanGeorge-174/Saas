const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

// Mocking models to avoid import issues in this script
const VisitSchema = new mongoose.Schema({
    clinicId: mongoose.Schema.Types.ObjectId,
    patientId: mongoose.Schema.Types.ObjectId,
    visitType: String,
    visitDate: Date,
    arrivalTime: Date,
    status: String
});
const Visit = mongoose.models.Visit || mongoose.model('Visit', VisitSchema);

const PatientSchema = new mongoose.Schema({
    clinicId: mongoose.Schema.Types.ObjectId,
    fullName: String
});
const Patient = mongoose.models.Patient || mongoose.model('Patient', PatientSchema);

async function test() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB');

        const clinicId = new mongoose.Types.ObjectId("60d0fe4f5311236168a109ca"); // Sample ID
        const userId = new mongoose.Types.ObjectId("60d0fe4f5311236168a109ca");

        console.log('Creating Patient...');
        const patient = await Patient.create({
            clinicId,
            fullName: 'Test Verification Patient'
        });
        console.log('Patient Created:', patient._id);

        console.log('Creating Visit...');
        const now = new Date();
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const v = await Visit.create({
            clinicId,
            patientId: patient._id,
            visitType: 'WALK_IN',
            visitDate: startOfDay,
            arrivalTime: now,
            status: 'WAITING'
        });
        console.log('Visit Created:', v._id);

        process.exit(0);
    } catch (err) {
        console.error('Test Failed:', err);
        process.exit(1);
    }
}

test();
