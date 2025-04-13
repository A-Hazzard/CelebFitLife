import { TwilioError, connect } from "twilio-video";
import { ClientTwilioService } from "@/lib/services/ClientTwilioService";
import { TwilioConnectionResult } from "@/lib/types/streaming.types";

/**
 * Manages connection to a Twilio Video room with comprehensive error handling
 * @param slug - The stream identifier
 * @param userId - The current user's ID
 * @param maxAttempts - Maximum number of connection attempts allowed
 * @param currentAttempts - Current number of connection attempts made
 * @returns A promise resolving to a TwilioConnectionResult
 */
export const connectToTwilioRoom = async (
  slug: string,
  userId: string,
  maxAttempts: number = 5,
  currentAttempts: number = 0
): Promise<TwilioConnectionResult> => {
  // Check if we've already hit the max attempts limit
  if (currentAttempts >= maxAttempts) {
    return {
      success: false,
      error: `Too many connection attempts (${currentAttempts}/${maxAttempts})`,
      errorCode: "MAX_ATTEMPTS_EXCEEDED",
    };
  }

  try {
    // Create unique viewer identity
    const viewerIdentity = generateUniqueIdentity("viewer", userId);

    // Get Twilio token for the room
    const clientTwilioService = new ClientTwilioService();
    const token = await clientTwilioService.getToken(slug, viewerIdentity);

    if (!token) {
      return {
        success: false,
        error: "Failed to obtain Twilio token",
        errorCode: "TOKEN_FAILURE",
      };
    }

    // Connect to the Twilio room
    const twilioRoom = await connect(token, {
      audio: false, // Viewers don't send audio
      video: false, // Viewers don't send video
      networkQuality: {
        local: 1, // Local participant gets minimal network quality updates
        remote: 2, // Remote participants get more detailed network quality info
      },
      dominantSpeaker: true, // Enable dominant speaker detection
      maxAudioBitrate: 16000, // Optimize for voice audio
      preferredVideoCodecs: [{ codec: "VP8", simulcast: true }], // Use VP8 with simulcast for adaptiveness
    });

    return {
      success: true,
      room: twilioRoom,
    };
  } catch (error) {
    let errorMessage = "Unknown connection error";
    let errorCode = "UNKNOWN_ERROR";

    if (error instanceof TwilioError) {
      switch (error.code) {
        case 20101:
          errorMessage =
            "Invalid Access Token. The stream may have ended or restarted.";
          errorCode = "INVALID_TOKEN";
          break;
        case 20103:
          errorMessage =
            "Invalid Access Token issuer/subject. Please try refreshing the page.";
          errorCode = "INVALID_TOKEN_ISSUER";
          break;
        case 20104:
          errorMessage =
            "Access Token expired. Please refresh the page to get a new token.";
          errorCode = "EXPIRED_TOKEN";
          break;
        case 53000:
          errorMessage =
            "Room not found or has ended. The streamer may have stopped streaming.";
          errorCode = "ROOM_NOT_FOUND";
          break;
        case 53205:
          errorMessage = "Room is full. Please try again later.";
          errorCode = "ROOM_FULL";
          break;
        default:
          errorMessage = `Twilio error: ${error.message} (Code: ${error.code})`;
          errorCode = `TWILIO_ERROR_${error.code}`;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;

      if (error.message.includes("token")) {
        errorCode = "TOKEN_ERROR";
      } else if (
        error.message.includes("network") ||
        error.message.includes("timeout")
      ) {
        errorCode = "NETWORK_ERROR";
      } else {
        errorCode = "GENERIC_ERROR";
      }
    }

    return {
      success: false,
      error: errorMessage,
      errorCode,
      originalError: error,
    };
  }
};

/**
 * Generates a unique identity for viewers that includes a timestamp and random value
 * @param prefix - String prefix for the identity (e.g., 'viewer')
 * @param userId - User ID to include in the identity
 * @returns A unique identity string
 */
const generateUniqueIdentity = (prefix: string, userId: string): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `${prefix}_${userId}_${timestamp}_${random}`;
};
