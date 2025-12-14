const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/celebfitlife";

async function check() {
    try {
        await mongoose.connect(MONGODB_URI);
        const db = mongoose.connection.db;

        const users = await db.collection('users').countDocuments();
        const oldWaitlist = await db.collection('waitlist').countDocuments(); // Legacy collection

        console.log(`Users count: ${users}`);
        console.log(`Legacy waitlist count: ${oldWaitlist}`);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
