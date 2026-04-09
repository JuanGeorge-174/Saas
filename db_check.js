const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');

async function run() {
    await mongoose.connect('mongodb://127.0.0.1:27017/saas-db');
    
    const Clinic = mongoose.connection.collection('clinics');
    const Users = mongoose.connection.collection('users');
    
    const clinicNames = ['anashwara', 'anu', 'aa'];
    const clinicIds = {};
    
    for (const name of clinicNames) {
        let clinic = await Clinic.findOne({ clinicName: name });
        if (!clinic) {
            const res = await Clinic.insertOne({ 
                clinicName: name, 
                clinicSlug: name.toLowerCase(), 
                isActive: true, 
                createdAt: new Date() 
            });
            clinicIds[name] = res.insertedId;
        } else {
            clinicIds[name] = clinic._id;
        }
    }
    
    await Users.updateOne({ loginId: 'anashwar' }, { $set: { clinicId: clinicIds['anashwara'] } });
    await Users.updateOne({ loginId: 'anu' }, { $set: { clinicId: clinicIds['anu'] } });
    await Users.updateOne({ loginId: 'a' }, { $set: { clinicId: clinicIds['aa'] } }); 
    await Users.updateOne({ loginId: 'aa' }, { $set: { clinicId: clinicIds['aa'] } }); 

    console.log("Successfully separated users into distinctive clinics!");
    process.exit();
}
run().catch(console.error);
