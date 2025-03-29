import { db, convertDocToObj } from "../utils/firebaseAdmin";
import { Stream, StreamCreateDTO, StreamUpdateDTO } from "../models/Stream";
import { ApiError, ErrorTypes } from "../utils/errorHandler";
import { nanoid } from "nanoid";

/**
 * Service for managing streams in the database
 */
export class StreamService {
  private streamsCollection = db.collection("streams");

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
      console.error("Error finding stream by ID:", error);
      throw error;
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
      console.error("Error finding stream by slug:", error);
      throw error;
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
      console.error("Error finding streams by user ID:", error);
      throw error;
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
      console.error("Error finding active streams:", error);
      throw error;
    }
  }

  /**
   * Create a new stream
   */
  async create(streamData: StreamCreateDTO): Promise<Stream> {
    try {
      // Generate a unique slug
      const slug = await this.generateUniqueSlug();

      // Prepare stream data
      const newStream: Omit<Stream, "id"> = {
        slug,
        createdBy: streamData.createdBy,
        createdAt: new Date().toISOString(),
        title: streamData.title || "Untitled Stream",
        description: streamData.description || "",
        scheduledAt: streamData.scheduledAt,
        hasStarted: false,
        hasEnded: false,
        audioMuted: false,
        cameraOff: false,
        isCameraOff: false,
        isMuted: false,
        lastUpdated: new Date().toISOString(),
      };

      // Save to database
      const docRef = await this.streamsCollection.add(newStream);

      // Get the created stream
      const doc = await docRef.get();
      const result = convertDocToObj<Stream>(doc);
      if (!result) {
        throw ErrorTypes.INTERNAL_SERVER("Failed to retrieve created stream");
      }
      return result;
    } catch (error) {
      console.error("Error creating stream:", error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError("Failed to create stream", 500);
    }
  }

  /**
   * Update a stream
   */
  async update(id: string, streamData: StreamUpdateDTO): Promise<Stream> {
    try {
      // Check if stream exists
      const stream = await this.findById(id);
      if (!stream) {
        throw ErrorTypes.NOT_FOUND("Stream");
      }

      // Update stream
      await this.streamsCollection.doc(id).update({
        ...streamData,
        lastUpdated: new Date().toISOString(),
      });

      // Get updated stream
      const updatedStream = await this.findById(id);
      if (!updatedStream) {
        throw ErrorTypes.INTERNAL_SERVER("Failed to retrieve updated stream");
      }

      return updatedStream;
    } catch (error) {
      console.error("Error updating stream:", error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError("Failed to update stream", 500);
    }
  }

  /**
   * Start a stream
   */
  async startStream(id: string): Promise<Stream> {
    try {
      // Check if stream exists
      const stream = await this.findById(id);
      if (!stream) {
        throw ErrorTypes.NOT_FOUND("Stream");
      }

      // Update stream
      await this.streamsCollection.doc(id).update({
        hasStarted: true,
        hasEnded: false,
        startedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      });

      // Get updated stream
      const updatedStream = await this.findById(id);
      if (!updatedStream) {
        throw ErrorTypes.INTERNAL_SERVER("Failed to retrieve updated stream");
      }

      return updatedStream;
    } catch (error) {
      console.error("Error starting stream:", error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError("Failed to start stream", 500);
    }
  }

  /**
   * End a stream
   */
  async endStream(id: string): Promise<Stream> {
    try {
      // Check if stream exists
      const stream = await this.findById(id);
      if (!stream) {
        throw ErrorTypes.NOT_FOUND("Stream");
      }

      // Update stream
      await this.streamsCollection.doc(id).update({
        hasEnded: true,
        endedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      });

      // Get updated stream
      const updatedStream = await this.findById(id);
      if (!updatedStream) {
        throw ErrorTypes.INTERNAL_SERVER("Failed to retrieve updated stream");
      }

      return updatedStream;
    } catch (error) {
      console.error("Error ending stream:", error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError("Failed to end stream", 500);
    }
  }

  /**
   * Delete a stream
   */
  async delete(id: string): Promise<void> {
    try {
      // Check if stream exists
      const stream = await this.findById(id);
      if (!stream) {
        throw ErrorTypes.NOT_FOUND("Stream");
      }

      // Delete stream
      await this.streamsCollection.doc(id).delete();
    } catch (error) {
      console.error("Error deleting stream:", error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError("Failed to delete stream", 500);
    }
  }

  /**
   * Generate a unique slug for a stream
   */
  private async generateUniqueSlug(): Promise<string> {
    let isUnique = false;
    let slug = "";

    while (!isUnique) {
      // Generate a slug using nanoid
      slug = nanoid(16);

      // Check if slug exists
      const existingStream = await this.findBySlug(slug);
      if (!existingStream) {
        isUnique = true;
      }
    }

    return slug;
  }
}
