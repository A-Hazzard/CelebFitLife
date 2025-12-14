
require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/celebfitlife";

const CELEBS = ["Alex Sterling", "Elena Velez", "Marcus J."];
const LOCATIONS = [
    { country: "United States", cities: ["New York", "Los Angeles", "Chicago", "Houston", "Miami"] },
    { country: "United Kingdom", cities: ["London", "Manchester", "Birmingham", "Leeds"] },
    { country: "Canada", cities: ["Toronto", "Vancouver", "Montreal", "Ottawa"] },
    { country: "Australia", cities: ["Sydney", "Melbourne", "Brisbane", "Perth"] },
    { country: "Germany", cities: ["Berlin", "Munich", "Hamburg", "Frankfurt"] },
    { country: "France", cities: ["Paris", "Lyon", "Marseille", "Toulouse"] },
    { country: "Japan", cities: ["Tokyo", "Osaka", "Kyoto", "Yokohama"] },
    { country: "Brazil", cities: ["Sao Paulo", "Rio de Janeiro", "Brasilia"] },
    { country: "Italy", cities: ["Rome", "Milan", "Naples", "Turin"] },
    { country: "Spain", cities: ["Madrid", "Barcelona", "Valencia", "Seville"] },
    { country: "Trinidad and Tobago", cities: ["Port of Spain", "San Fernando", "Chaguanas", "Scarborough"] }
];

async function updateUsers() {
    try {
        console.log("Connecting to DB...");
        await mongoose.connect(MONGODB_URI);
        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');

        console.log("Fetching users...");
        const users = await usersCollection.find({}).toArray();
        console.log(`Found ${users.length} users.`);

        for (const user of users) {
            // 1. Remove votes field
            // 2. Add votedFor (Random)
            const randomCeleb = CELEBS[Math.floor(Math.random() * CELEBS.length)];

            // 3. Random Country/City
            const randomLoc = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
            const randomCity = randomLoc.cities[Math.floor(Math.random() * randomLoc.cities.length)];

            // 4. Ensure paidAt
            let paidAt = user.paidAt;
            if (!paidAt && user.paymentStatus === 'paid') {
                // Random date in last 30 days
                const now = new Date();
                const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                paidAt = new Date(thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime()));
            } else if (!paidAt) {
                // Even for unpaid, user wanted "ensure paidAt isnt null on anyone". 
                // Note: Normally unpaid users don't have paidAt. But user instruction: "ensure paidAt isnt null on anyone, if it is then update it to a random date"
                // I will follow instruction literally.
                const now = new Date();
                const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                paidAt = new Date(thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime()));
            }

            const updateDoc = {
                $unset: { votes: "" },
                $set: {
                    votedFor: randomCeleb,
                    country: randomLoc.country,
                    city: randomCity,
                    paidAt: paidAt
                }
            };

            if (user.role === 'admin') {
                // Keep admin data somewhat clean, but still apply required fields logic if missing
                // Maybe don't randomize admin vote? user says "for each user apply a vote". I'll apply it.
            }

            await usersCollection.updateOne({ _id: user._id }, updateDoc);
        }

        console.log("Users updated successfully.");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

updateUsers();
