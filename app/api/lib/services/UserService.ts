import { adminDb } from "@/lib/firebase/admin"; // Updated path
import { User, UserRegistrationData } from "@/lib/types/user"; // Import from consolidated types
import { hashPassword } from "../utils/authUtils"; // Updated path
import {
  NotFoundError,
  UserExistsError,
  InvalidDataError,
} from "../errors/apiErrors"; // Use API specific errors
import { convertDocToObj } from "@/lib/firebase/admin"; // Assuming convertDocToObj is here

// More specific type for user role
type UserRole = {
  admin?: boolean;
  streamer?: boolean;
  viewer?: boolean;
};

type UserUpdateData = {
  username?: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  age?: number;
  city?: string;
  country?: string;
  phone?: string;
  role?: UserRole;
  updatedAt?: string;
};

/**
 * Service for managing users in the database (API-specific)
 */
export class UserService {
  private usersCollection = adminDb.collection("users");

  async findById(id: string): Promise<User | null> {
    try {
      const doc = await this.usersCollection.doc(id).get();
      if (!doc.exists) {
        return null;
      }
      // Assuming convertDocToObj correctly adds the id
      return convertDocToObj<User>(doc);
    } catch (error) {
      console.error("Error finding user by ID:", error);
      throw new Error("Database error finding user by ID."); // Throw generic for internal issues
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      console.log(
        `[API UserService] Looking up user by email: ${email.substring(
          0,
          3
        )}...`
      );
      const doc = await this.usersCollection.doc(email).get();

      if (!doc.exists) {
        console.log(
          `[API UserService] No user found with email: ${email.substring(
            0,
            3
          )}...`
        );
        return null;
      }
      console.log(
        `[API UserService] Found user with email: ${email.substring(0, 3)}...`
      );
      const userData = doc.data();
      if (!userData) return null; // Should not happen if exists is true, but safety check

      // Construct the User object, ensuring id is set
      const user: User = {
        id: doc.id, // Use the document ID
        email: userData.email || doc.id, // Fallback to doc.id if email field missing
        username: userData.username || "",
        password: userData.password, // Keep password hash if present
        createdAt: userData.createdAt || new Date().toISOString(),
        age: userData.age,
        city: userData.city,
        country: userData.country,
        phone: userData.phone,
        role: userData.role || { admin: false, streamer: false, viewer: true },
      };
      return user;
    } catch (error) {
      console.error(`[API UserService] Error finding user by email:`, error);
      throw new Error("Database error finding user by email.");
    }
  }

  async findByUsername(username: string): Promise<User | null> {
    try {
      const snapshot = await this.usersCollection
        .where("username", "==", username)
        .limit(1)
        .get();
      if (snapshot.empty) {
        return null;
      }
      // Assuming convertDocToObj adds the id from snapshot.docs[0].id
      return convertDocToObj<User>(snapshot.docs[0]);
    } catch (error) {
      console.error("Error finding user by username:", error);
      throw new Error("Database error finding user by username.");
    }
  }

  async create(userData: UserRegistrationData): Promise<User> {
    try {
      // Check if email already exists (using email as ID)
      const existingEmailDoc = await this.usersCollection
        .doc(userData.email)
        .get();
      if (existingEmailDoc.exists) {
        throw new UserExistsError("Email already in use");
      }

      // Check if username already exists (using query)
      const existingUsername = await this.findByUsername(userData.username);
      if (existingUsername) {
        throw new UserExistsError("Username already taken");
      }

      // Hash password using the API-specific utility
      const hashedPassword = await hashPassword(userData.password);

      // Prepare user data for Firestore (without id)
      const newUserDbData: Omit<User, "id"> = {
        email: userData.email,
        username: userData.username,
        password: hashedPassword,
        createdAt: new Date().toISOString(),
        age: userData.age,
        city: userData.city,
        country: userData.country,
        phone: userData.phone,
        role: {
          admin: userData.role?.admin || false,
          streamer: userData.role?.streamer || false,
          viewer: userData.role?.viewer || true,
        },
      };

      // Save to database using email as document ID
      await this.usersCollection.doc(userData.email).set(newUserDbData);

      // Construct the final User object including the ID (which is the email)
      const createdUser: User = {
        id: userData.email,
        ...newUserDbData,
      };

      return createdUser;
    } catch (error) {
      console.error("Error creating user:", error);
      if (error instanceof UserExistsError) {
        throw error; // Re-throw specific errors
      }
      // Throw generic for other internal issues
      throw new Error("Failed to create user due to a database error.");
    }
  }

  async update(
    id: string,
    updateData: Partial<Omit<User, "id" | "email" | "password">>
  ): Promise<User> {
    const docRef = this.usersCollection.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundError("User not found for update");
    }

    // Explicitly exclude fields that shouldn't be updated this way
    const safeUpdateData = updateData as UserUpdateData;
    if (Object.keys(safeUpdateData).length === 0) {
      throw new InvalidDataError("No valid fields provided for update.");
    }

    await docRef.update({
      ...safeUpdateData,
      updatedAt: new Date().toISOString(),
    });

    // Get updated user data
    const updatedDoc = await docRef.get();
    if (!updatedDoc.exists) {
      // Should exist, but safety check
      throw new Error("Failed to retrieve updated user data after update.");
    }

    const updatedUser = convertDocToObj<User>(updatedDoc);
    if (!updatedUser) {
      throw new Error("Failed to convert updated user document to object");
    }

    return updatedUser;
  }

  async delete(id: string): Promise<void> {
    try {
      const docRef = this.usersCollection.doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new NotFoundError("User not found for deletion");
      }

      await docRef.delete();
    } catch (error) {
      console.error("Error deleting user:", error);
      if (error instanceof NotFoundError) {
        throw error; // Re-throw specific handled errors
      }
      throw new Error("Failed to delete user due to a database error.");
    }
  }
}
