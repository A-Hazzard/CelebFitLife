import { db } from '@/config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { User } from '@/lib/models/User';

export async function searchUserByUsername(username: string) {
  try {
    // Create a query to find users by username
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username));

    // Execute the query
    const querySnapshot = await getDocs(q);

    // If no user found, return null
    if (querySnapshot.empty) {
      return null;
    }

    // Get the first matching user (assuming usernames are unique)
    const userData = querySnapshot.docs[0].data();

    // Create a User instance
    const user = new User({
      uid: userData.uid,
      email: userData.email,
      displayName: userData.username,
      phone: userData.phone,
      country: userData.country,
      city: userData.city,
      age: userData.age,
      isStreamer: userData.isStreamer,
    });

    return user.getProfile();
  } catch (error) {
    console.error('Error searching for user:', error);
    throw error;
  }
}