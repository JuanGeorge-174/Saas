const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

async function audit() {
    try {
        await mongoose.connect(MONGODB_URI);
        const db = mongoose.connection.db;

        const now = new Date();
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        console.log(`Auditing Visits for today: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);

        const allVisits = await db.collection('visits').find({}).toArray();
        console.log(`Total Visits in Collection: ${allVisits.length}`);

        const todayVisits = await db.collection('visits').find({
            visitDate: { $gte: startOfDay, $lte: endOfDay }
        }).toArray();
        console.log(`Visits matched for today: ${todayVisits.length}`);

        todayVisits.forEach(v => {
            console.log(`- Visit ID: ${v._id}, ClinicId: ${v.clinicId}, Status: ${v.status}, Date: ${v.visitDate.toISOString()}`);
        });

        const users = await db.collection('users').find({}).toArray();
        console.log('Clinics in use:');
        users.forEach(u => console.log(`  User: ${u.email}, ClinicId: ${u.clinicId}`));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

audit();
