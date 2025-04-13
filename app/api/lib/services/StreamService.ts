import { adminDb, convertDocToObj } from "@/lib/firebase/admin"; // Correct path
import { Stream, StreamCreateDTO, StreamUpdateDTO } from "../models/Stream"; // Correct path
import { NotFoundError, InvalidDataError } from "../errors/apiErrors"; // Use API errors
import { nanoid } from "nanoid";
import { StreamApiUpdateData } from "@/lib/types/streaming";

/**
 * Service for managing streams in the database (API-specific)
 */
export class StreamService {
  private streamsCollection = adminDb.collection("streams");

  /**
   * Find stream by ID
   */
  async findById(id: string): Promise<Stream | null> {
    try {
      const doc = await this.streamsCollection.doc(id).get();
      if (!doc.exists) {
        return null;
      }
      return convertDocToObj<Stream>(doc);
    } catch (error) {
      console.error("[API StreamService] Error finding stream by ID:", error);
      // Throw generic error for internal DB issues
      throw new Error("Database error finding stream by ID.");
    }
  }

  /**
   * Find stream by slug
   */
  async findBySlug(slug: string): Promise<Stream | null> {
    try {
      const snapshot = await this.streamsCollection
        .where("slug", "==", slug)
        .limit(1)
        .get();
      if (snapshot.empty) {
        return null;
      }
      return convertDocToObj<Stream>(snapshot.docs[0]);
    } catch (error) {
      console.error("[API StreamService] Error finding stream by slug:", error);
      throw new Error("Database error finding stream by slug.");
    }
  }

  /**
   * List streams for a user
   */
  async findByUser(userId: string): Promise<Stream[]> {
    try {
      const snapshot = await this.streamsCollection
        .where("createdBy", "==", userId)
        .get();
      return snapshot.docs
        .map((doc) => convertDocToObj<Stream>(doc))
        .filter((stream): stream is Stream => stream !== null);
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
  async findActiveStreams(): Promise<Stream[]> {
    try {
      const snapshot = await this.streamsCollection
        .where("hasStarted", "==", true)
        .where("hasEnded", "==", false)
        .get();
      return snapshot.docs
        .map((doc) => convertDocToObj<Stream>(doc))
        .filter((stream): stream is Stream => stream !== null);
    } catch (error) {
      console.error("[API StreamService] Error finding active streams:", error);
      throw new Error("Database error finding active streams.");
    }
  }

  /**
   * Create a new stream
   */
  async create(streamData: StreamCreateDTO): Promise<Stream> {
    try {
      if (!streamData.createdBy) {
        throw new InvalidDataError(
          "createdBy field (user ID) is required to create a stream."
        );
      }
      const slug = await this.generateUniqueSlug();

      const newStream: Omit<Stream, "id"> = {
        slug,
        createdBy: streamData.createdBy,
        createdAt: new Date().toISOString(),
        title: streamData.title || "Untitled Stream",
        description: streamData.description || "",
        scheduledAt: streamData.scheduledAt || new Date().toISOString(), // Default to now if not provided
        hasStarted: false,
        hasEnded: false,
        audioMuted: false,
        cameraOff: false,
        isCameraOff: false, // Legacy field
        isMuted: false, // Legacy field
        lastUpdated: new Date().toISOString(),
      };

      const docRef = await this.streamsCollection.add(newStream);
      const doc = await docRef.get();
      const result = convertDocToObj<Stream>(doc);
      if (!result) {
        // This indicates an internal issue, post-creation retrieval failed
        throw new Error(
          "Failed to retrieve created stream data after creation."
        );
      }
      return result;
    } catch (error) {
      console.error("[API StreamService] Error creating stream:", error);
      if (error instanceof InvalidDataError) {
        throw error; // Re-throw specific validation errors
      }
      // Throw generic error for other internal issues
      throw new Error("Failed to create stream due to a database error.");
    }
  }

  /**
   * Update a stream
   */
  async update(id: string, streamData: StreamUpdateDTO): Promise<Stream> {
    const docRef = this.streamsCollection.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundError("Stream not found for update");
    }

    // Ensure sensitive/immutable fields are not updated accidentally
    const safeUpdateData = streamData as StreamApiUpdateData;
    if (Object.keys(safeUpdateData).length === 0) {
      throw new InvalidDataError("No valid fields provided for update.");
    }

    await docRef.update({
      ...safeUpdateData,
      lastUpdated: new Date().toISOString(),
    });

    const updatedDoc = await docRef.get();
    if (!updatedDoc.exists) {
      // Should exist, but safety check
      throw new Error("Failed to retrieve updated stream data after update.");
    }

    const updatedStream = convertDocToObj<Stream>(updatedDoc);
    if (!updatedStream) {
      throw new Error("Failed to convert updated stream document to object");
    }

    return updatedStream;
  }

  /**
   * Start a stream
   */
  async startStream(id: string): Promise<Stream> {
    try {
      const docRef = this.streamsCollection.doc(id);
      const doc = await docRef.get();
      if (!doc.exists) {
        throw new NotFoundError("Stream not found to start");
      }

      await docRef.update({
        hasStarted: true,
        hasEnded: false,
        startedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      });

      const updatedDoc = await docRef.get();
      if (!updatedDoc.exists) {
        // Should exist, but safety check
        throw new Error("Failed to retrieve stream data after starting.");
      }

      const startedStream = convertDocToObj<Stream>(updatedDoc);
      if (!startedStream) {
        throw new Error("Failed to convert started stream document to object");
      }

      return startedStream;
    } catch (error) {
      console.error("[API StreamService] Error starting stream:", error);
      if (error instanceof NotFoundError) {
        throw error; // Re-throw specific handled errors
      }
      throw new Error("Failed to start stream due to a database error.");
    }
  }

  /**
   * End a stream
   */
  async endStream(id: string): Promise<Stream> {
    try {
      const docRef = this.streamsCollection.doc(id);
      const doc = await docRef.get();
      if (!doc.exists) {
        throw new NotFoundError("Stream not found to end");
      }

      await docRef.update({
        hasEnded: true,
        endedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      });

      const updatedDoc = await docRef.get();
      if (!updatedDoc.exists) {
        // Should exist, but safety check
        throw new Error("Failed to retrieve stream data after ending.");
      }

      const endedStream = convertDocToObj<Stream>(updatedDoc);
      if (!endedStream) {
        throw new Error("Failed to convert ended stream document to object");
      }

      return endedStream;
    } catch (error) {
      console.error("[API StreamService] Error ending stream:", error);
      if (error instanceof NotFoundError) {
        throw error; // Re-throw specific handled errors
      }
      throw new Error("Failed to end stream due to a database error.");
    }
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
        throw error; // Re-throw specific handled errors
      }
      throw new Error("Failed to delete stream due to a database error.");
    }
  }

  /**
   * Generate a unique slug for a stream
   */
  private async generateUniqueSlug(length = 8): Promise<string> {
    let slug = nanoid(length);
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      const existing = await this.findBySlug(slug);
      if (!existing) {
        return slug;
      }
      // If exists, generate a new one
      slug = nanoid(length);
      attempts++;
    }

    console.error(
      `[API StreamService] Failed to generate a unique slug after ${maxAttempts} attempts.`
    );
    throw new Error("Failed to generate a unique stream identifier.");
  }
}
