require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Config
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/celebfitlife";
const ADMIN_EMAIL = "celebfitlife@gmail.com";
const ADMIN_PASSWORD = "CelebFitLife2025!";

async function migrateAndSeed() {
    try {
        console.log("Connecting to DB...");
        await mongoose.connect(MONGODB_URI);
        console.log("Connected.");

        const db = mongoose.connection.db;
        const oldWaitlistCollection = db.collection('waitlist'); // Old collection name for migration
        const usersCollection = db.collection('users');

        // 1. Fetch old data from legacy collection
        console.log("Fetching data from legacy waitlist collection...");
        const oldWaitlistDocs = await oldWaitlistCollection.find({}).toArray();
        console.log(`Found ${oldWaitlistDocs.length} documents in legacy waitlist collection.`);

        // 2. Migrate to users collection
        let migratedCount = 0;
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        for (const doc of oldWaitlistDocs) {
            // Skip if this doc is already the admin (we'll handle admin separately/explicitly)
            if (doc.email === ADMIN_EMAIL) continue;

            // Metadata generation for existing users who lack it
            const randomTime = thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime());
            const randomDate = new Date(randomTime);
            const isPaid = doc.paymentStatus === 'paid';

            const deviceTypes = ['Desktop', 'Mobile', 'Tablet'];
            const randomDevice = deviceTypes[Math.floor(Math.random() * deviceTypes.length)];
            const userAgents = [
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            ];
            const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)];

            // Construct User Object
            const newUser = {
                email: doc.email,
                paymentStatus: doc.paymentStatus,
                stripeCheckoutId: doc.stripeCheckoutId,
                stripeCustomerId: doc.stripeCustomerId,
                waitListEmailSent: doc.waitListEmailSent,
                votes: doc.votes || [],
                role: 'user',

                // New Metadata
                ip: doc.ip || `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
                country: doc.country || 'Unknown',
                city: doc.city || 'Unknown',
                userAgent: doc.userAgent || randomUA,
                deviceType: doc.deviceType || randomDevice, // Ensure device type is set
                paidAt: isPaid ? (doc.paidAt || randomDate) : null,

                createdAt: doc.createdAt || randomDate,
                updatedAt: new Date()
            };

            await usersCollection.updateOne(
                { email: doc.email },
                { $set: newUser },
                { upsert: true }
            );
            migratedCount++;
        }
        console.log(`Migrated ${migratedCount} users.`);

        // 3. Create/Update Admin User
        console.log("Ensuring Admin User...");
        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

        await usersCollection.updateOne(
            { email: ADMIN_EMAIL },
            {
                $set: {
                    email: ADMIN_EMAIL,
                    paymentStatus: 'paid',
                    role: 'admin',
                    password: hashedPassword,
                    votes: [],
                    ip: '127.0.0.1',
                    userAgent: 'Admin Script',
                    deviceType: 'Desktop',
                    country: 'AdminLand',
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            },
            { upsert: true }
        );
        console.log("Admin user seeded.");

        console.log("Migration and Seeding complete.");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrateAndSeed();
