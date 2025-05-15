import Twilio from "twilio";

const { AccessToken } = Twilio.jwt;
const { VideoGrant } = AccessToken;

export class TwilioService {
  private readonly tokenTTL = 3600; // 1 hour in seconds

  generateToken(roomName: string, identity: string): string {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const apiKey = process.env.TWILIO_API_KEY_SID;
    const apiSecret = process.env.TWILIO_API_KEY_SECRET;
    if (!accountSid || !apiKey || !apiSecret) {
      throw new Error("Twilio credentials missing in environment variables");
    }
    const token = new AccessToken(accountSid, apiKey, apiSecret, {
      identity,
      ttl: this.tokenTTL,
    });
    const videoGrant = new VideoGrant({ room: roomName });
    token.addGrant(videoGrant);
    return token.toJwt();
  }

  getTokenExpiration(): number {
    return Date.now() + this.tokenTTL * 1000;
  }
}
