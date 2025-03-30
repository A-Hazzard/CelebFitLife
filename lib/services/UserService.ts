import { db, convertDocToObj } from "../utils/firebaseAdmin";
import { User, UserCreateDTO } from "../models/User";
import { ApiError, ErrorTypes } from "../utils/errorHandler";
import { hashPassword } from "../utils/authUtils";
import { getAuth } from "firebase/auth"; // Import Firebase Auth

/**
 * Service for managing users in the database
 */
export class UserService {
  private usersCollection = db.collection("users");


  async findById(id: string): Promise<User | null> {
    try {
      const doc = await this.usersCollection.doc(id).get();
      if (!doc.exists) {
        return null;
      }
      return convertDocToObj<User>(doc);
    } catch (error) {
      console.error("Error finding user by ID:", error);
      throw error;
    }
  }


  async findByEmail(email: string): Promise<User | null> {
    const auth = getAuth(); // Get the current authentication instance
    const user = auth.currentUser; // Get the currently logged-in user

    if (!user) {
      throw new Error("User is not authenticated");
    }

    const snapshot = await this.usersCollection
      .where("email", "==", email)
      .limit(1)
      .get(); // Remove the headers argument

    if (snapshot.empty) return null;

    return convertDocToObj<User>(snapshot.docs[0]);
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
      return convertDocToObj<User>(snapshot.docs[0]);
    } catch (error) {
      console.error("Error finding user by username:", error);
      throw error;
    }
  }

  async create(userData: UserCreateDTO): Promise<User> {
    try {
      // Check if email already exists
      const existingEmail = await this.findByEmail(userData.email);
      if (existingEmail) {
        throw ErrorTypes.CONFLICT("Email already in use");
      }

      // Check if username already exists
      const existingUsername = await this.findByUsername(userData.username);
      if (existingUsername) {
        throw ErrorTypes.CONFLICT("Username already taken");
      }

      // Hash password
      const hashedPassword = await hashPassword(userData.password);

      // Prepare user data
      const newUser: Omit<User, "id"> = {
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
          viewer: userData.role?.viewer || true, // Default to viewer
        },
        isAdmin: userData.role?.admin || false,
      };

      // Save to database
      const docRef = await this.usersCollection.add(newUser);

      // Get the created user
      const doc = await docRef.get();
      return convertDocToObj<User>(doc) as User;
    } catch (error) {
      console.error("Error creating user:", error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError("Failed to create user", 500);
    }
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    try {
      // Check if user exists
      const user = await this.findById(id);
      if (!user) {
        throw ErrorTypes.NOT_FOUND("User");
      }

      // Remove id and password from update data using object rest
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _, password: __, ...updateData } = userData;

      // Update user
      await this.usersCollection.doc(id).update({
        ...updateData,
        updatedAt: new Date().toISOString(),
      });

      // Get updated user
      const updatedUser = await this.findById(id);
      if (!updatedUser) {
        throw ErrorTypes.INTERNAL_SERVER("Failed to retrieve updated user");
      }

      return updatedUser;
    } catch (error) {
      console.error("Error updating user:", error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError("Failed to update user", 500);
    }
  }


  async delete(id: string): Promise<void> {
    try {
      // Check if user exists
      const user = await this.findById(id);
      if (!user) {
        throw ErrorTypes.NOT_FOUND("User");
      }

      // Delete user
      await this.usersCollection.doc(id).delete();
    } catch (error) {
      console.error("Error deleting user:", error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError("Failed to delete user", 500);
    }
  }

}
