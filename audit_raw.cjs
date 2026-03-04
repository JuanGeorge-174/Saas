const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

async function audit() {
    try {
        await mongoose.connect(MONGODB_URI);
        const db = mongoose.connection.db;
        const patient = await db.collection('patients').findOne({});
        console.log('--- SINGLE PATIENT JSON ---');
        console.log(JSON.stringify(patient, null, 2));
        console.log('---------------------------');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

audit();
