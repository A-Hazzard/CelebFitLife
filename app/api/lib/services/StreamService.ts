import { adminDb, convertDocToObj } from "@/lib/firebase/admin"; // Correct path
import {
  StreamData,
  CreateStreamRequestBody,
} from "@/lib/types/streaming.types"; // Import from consolidated types
import { NotFoundError, InvalidDataError } from "../errors/apiErrors"; // Use API errors
import { nanoid } from "nanoid";

/**
 * Service for managing streams in the database (API-specific)
 */
export class StreamService {
  private streamsCollection = adminDb.collection("streams");

  /**
   * Find stream by ID
   */
  async findById(id: string): Promise<StreamData | null> {
    try {
      const doc = await this.streamsCollection.doc(id).get();
      if (!doc.exists) {
        return null;
      }
      return convertDocToObj<StreamData>(doc);
    } catch (error) {
      console.error("[API StreamService] Error finding stream by ID:", error);
      // Throw generic error for internal DB issues
      throw new Error("Database error finding stream by ID.");
    }
  }

  /**
   * Find stream by slug
   */
  async findBySlug(slug: string): Promise<StreamData | null> {
    try {
      const snapshot = await this.streamsCollection
        .where("slug", "==", slug)
        .limit(1)
        .get();
      if (snapshot.empty) {
        return null;
      }
      return convertDocToObj<StreamData>(snapshot.docs[0]);
    } catch (error) {
      console.error("[API StreamService] Error finding stream by slug:", error);
      throw new Error("Database error finding stream by slug.");
    }
  }

  /**
   * List streams for a user
   */
  async findByUser(userId: string): Promise<StreamData[]> {
    try {
      const snapshot = await this.streamsCollection
        .where("streamerId", "==", userId)
        .get();
      return snapshot.docs
        .map((doc) => convertDocToObj<StreamData>(doc))
        .filter((stream): stream is StreamData => stream !== null);
    } catch (error) {
      console.error(
        "[API StreamService] Error finding streams by user ID:",
        error
      );
      throw new Error("Database error finding streams by user.");
    }
  }

  /**
   * List all active streams
   */
  async findActiveStreams(): Promise<StreamData[]> {
    try {
      const snapshot = await this.streamsCollection
        .where("isLive", "==", true)
        .get();
      return snapshot.docs
        .map((doc) => convertDocToObj<StreamData>(doc))
        .filter((stream): stream is StreamData => stream !== null);
    } catch (error) {
      console.error("[API StreamService] Error finding active streams:", error);
      throw new Error("Database error finding active streams.");
    }
  }

  /**
   * Create a new stream
   */
  async create(
    streamData: CreateStreamRequestBody & { streamerId: string }
  ): Promise<StreamData> {
    try {
      if (!streamData.streamerId) {
        throw new InvalidDataError(
          "streamerId field (user ID) is required to create a stream."
        );
      }

      const slug = await this.generateUniqueSlug();
      const now = new Date().toISOString();

      const newStream: Omit<StreamData, "id"> = {
        slug,
        streamerId: streamData.streamerId,
        streamerName: "", // Will be populated from user data
        title: streamData.title || "Untitled Stream",
        description: streamData.description || "",
        isLive: false,
        createdAt: now,
        updatedAt: now,
        scheduledAt: streamData.scheduledAt || null,
        tags: streamData.tags || [],
        category: streamData.category || "Fitness",
        viewerCount: 0,
        hasStarted: false,
        hasEnded: false,
        isPrivate: streamData.isPrivate || false,
        requiresSubscription: streamData.requiresSubscription || false,
        language: streamData.language || "en",
        commentCount: 0,
        likeCount: 0,
        thumbnail: streamData.thumbnail || "",
        userId: streamData.userId || streamData.streamerId,
        userPhotoURL: streamData.userPhotoURL || "",
        username: streamData.username || "",
      };

      const docRef = await this.streamsCollection.add(newStream);
      const doc = await docRef.get();
      const result = convertDocToObj<StreamData>(doc);

      if (!result) {
        throw new Error(
          "Failed to retrieve created stream data after creation."
        );
      }

      return result;
    } catch (error) {
      console.error("[API StreamService] Error creating stream:", error);
      if (error instanceof InvalidDataError) {
        throw error;
      }
      throw new Error("Failed to create stream due to a database error.");
    }
  }

  /**
   * Update a stream
   */
  async update(
    id: string,
    updateData: Partial<StreamData>
  ): Promise<StreamData> {
    try {
      const docRef = this.streamsCollection.doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new NotFoundError("Stream not found for update");
      }

      const dataToUpdate = {
        ...updateData,
        updatedAt: new Date().toISOString(),
      };

      await docRef.update(dataToUpdate);

      const updatedDoc = await docRef.get();
      const updatedStream = convertDocToObj<StreamData>(updatedDoc);

      if (!updatedStream) {
        throw new Error("Failed to convert updated stream document to object");
      }

      return updatedStream;
    } catch (error) {
      console.error("[API StreamService] Error updating stream:", error);
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new Error("Failed to update stream due to a database error.");
    }
  }

  /**
   * Start a stream
   */
  async startStream(id: string): Promise<StreamData> {
    return this.update(id, {
      isLive: true,
    });
  }

  /**
   * End a stream
   */
  async endStream(id: string): Promise<StreamData> {
    return this.update(id, {
      isLive: false,
    });
  }

  /**
   * Delete a stream
   */
  async delete(id: string): Promise<void> {
    try {
      const docRef = this.streamsCollection.doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new NotFoundError("Stream not found for deletion");
      }

      await docRef.delete();
    } catch (error) {
      console.error("[API StreamService] Error deleting stream:", error);
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new Error("Failed to delete stream due to a database error.");
    }
  }

  /**
   * Generate a unique slug for a stream
   */
  private async generateUniqueSlug(length = 8): Promise<string> {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const slug = nanoid(length);
      const existingStream = await this.findBySlug(slug);

      if (!existingStream) {
        return slug;
      }

      attempts++;
      length++; // Increase length if collision occurs
    }

    throw new Error("Failed to generate unique slug after maximum attempts");
  }
}
