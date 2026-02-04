/**
 * Update Users - Firebase
 *
 * Updates user fields (votedFor, country, city, paidAt) in Firestore.
 * Run with: node scripts/update-users.js
 */

require('dotenv').config();
const admin = require('firebase-admin');

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL;
const FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

const CELEBS = ['Alex Sterling', 'Elena Velez', 'Marcus J.'];
const LOCATIONS = [
  { country: 'United States', cities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Miami'] },
  { country: 'United Kingdom', cities: ['London', 'Manchester', 'Birmingham', 'Leeds'] },
  { country: 'Canada', cities: ['Toronto', 'Vancouver', 'Montreal', 'Ottawa'] },
  { country: 'Australia', cities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth'] },
  { country: 'Germany', cities: ['Berlin', 'Munich', 'Hamburg', 'Frankfurt'] },
  { country: 'France', cities: ['Paris', 'Lyon', 'Marseille', 'Toulouse'] },
  { country: 'Japan', cities: ['Tokyo', 'Osaka', 'Kyoto', 'Yokohama'] },
  { country: 'Brazil', cities: ['Sao Paulo', 'Rio de Janeiro', 'Brasilia'] },
  { country: 'Italy', cities: ['Rome', 'Milan', 'Naples', 'Turin'] },
  { country: 'Spain', cities: ['Madrid', 'Barcelona', 'Valencia', 'Seville'] },
  { country: 'Trinidad and Tobago', cities: ['Port of Spain', 'San Fernando', 'Chaguanas', 'Scarborough'] },
];

async function updateUsers() {
  try {
    if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
      throw new Error('Missing FIREBASE_* env vars in .env');
    }

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: FIREBASE_PROJECT_ID,
          clientEmail: FIREBASE_CLIENT_EMAIL,
          privateKey: FIREBASE_PRIVATE_KEY,
        }),
      });
    }

    const db = admin.firestore();
    const usersRef = db.collection('users');
    const snapshot = await usersRef.get();

    console.log('Found', snapshot.size, 'users.');

    const batch = db.batch();
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    for (const doc of snapshot.docs) {
      const user = doc.data();

      const randomCeleb = CELEBS[Math.floor(Math.random() * CELEBS.length)];
      const randomLoc = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
      const randomCity = randomLoc.cities[Math.floor(Math.random() * randomLoc.cities.length)];

      let paidAt = user.paidAt?.toDate?.() ?? user.paidAt;
      if (!paidAt) {
        paidAt = new Date(
          thirtyDaysAgo.getTime() +
            Math.random() * (now.getTime() - thirtyDaysAgo.getTime())
        );
      }

      batch.update(doc.ref, {
        votedFor: randomCeleb,
        country: randomLoc.country,
        city: randomCity,
        paidAt: admin.firestore.Timestamp.fromDate(paidAt),
        updatedAt: admin.firestore.Timestamp.now(),
      });
    }

    await batch.commit();
    console.log('Users updated successfully.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

updateUsers();
