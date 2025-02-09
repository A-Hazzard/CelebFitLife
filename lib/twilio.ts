import { jwt } from 'twilio';
import { randomUUID } from 'crypto';

const { AccessToken } = jwt;
const { VideoGrant } = AccessToken;

/**
 * Generate a Twilio Video Access Token.
 * @param roomName - The name (or slug) of the Twilio room
 * @param userName - Unique identity for the user
 */
export function generateTwilioToken(roomName: string, userName: string) {
  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioApiKey = process.env.TWILIO_API_KEY_SID;
  const twilioApiSecret = process.env.TWILIO_API_KEY_SECRET;

  switch (true) {
    case !twilioAccountSid:
      throw new Error('TWILIO_ACCOUNT_SID is not set.');
    case !twilioApiKey:
      throw new Error('TWILIO_API_KEY_SID is not set.');
    case !twilioApiSecret:
      throw new Error('TWILIO_API_SECRET is not set.');
  }

  // If no userName is provided, generate one
  const identity = userName || `user-${randomUUID()}`;

  // Create the token
  const token = new AccessToken(twilioAccountSid, twilioApiKey, twilioApiSecret, {
    identity,
  });

  // Grant the token Twilio Video capabilities
  const videoGrant = new VideoGrant({
    room: roomName,
  });
  token.addGrant(videoGrant);

  return token.toJwt(); // Return the JWT string
}
