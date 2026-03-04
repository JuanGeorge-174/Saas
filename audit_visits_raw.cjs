const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

async function audit() {
    try {
        await mongoose.connect(MONGODB_URI);
        const db = mongoose.connection.db;

        const allVisits = await db.collection('visits').find({}).toArray();
        console.log(`Total Visits in DB: ${allVisits.length}`);

        allVisits.forEach(v => {
            console.log(`Visit: ID=${v._id}, Date=${v.visitDate}, Type=${typeof v.visitDate}, Status=${v.status}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

audit();
