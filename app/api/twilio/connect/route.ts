import { NextResponse } from "next/server";
import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const apiKey = process.env.TWILIO_API_KEY_SID;
const apiSecret = process.env.TWILIO_API_KEY_SECRET;

// Validate Twilio credentials
const validateTwilioCredentials = () => {
  console.log(acccountSid, apiKey, apiSecret)
  if (!accountSid || !apiKey || !apiSecret) {
    throw new Error("Missing required Twilio credentials");
  }

  // Validate SID format
  const sidPattern = /^[A-Z]{2}[a-f0-9]{32}$/i;
  if (!sidPattern.test(accountSid) || !sidPattern.test(apiKey)) {
    throw new Error("Invalid Twilio Account SID or API Key format");
  }
};

export async function POST(req: Request) {
  try {
    let body;
    try {
      body = await req.json();
    } catch (error) {
      console.error("Failed to parse request body:", error);
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { roomName, userName } = body;

    if (!roomName || !userName) {
      return NextResponse.json(
        { error: "roomName and userName are required" },
        { status: 400 }
      );
    }

    // Validate Twilio credentials before proceeding
    try {
      validateTwilioCredentials();
    } catch (error) {
      console.error("❌ Twilio credentials error:", error);
      return NextResponse.json(
        { error: "Invalid Twilio configuration" },
        { status: 500 }
      );
    }
    // Create an Access Token with the API Key as the issuer
    if (!accountSid || !apiKey || !apiSecret) {
      throw new Error("Missing required Twilio credentials");
    }
    const token = new twilio.jwt.AccessToken(accountSid, apiKey, apiSecret, {
      identity: userName,
      ttl: 14400, // Token expires in 4 hours
    });

    // Create a Video grant and add it to the token
    const videoGrant = new twilio.jwt.AccessToken.VideoGrant({
      room: roomName,
    });
    token.addGrant(videoGrant);

    // Generate the token
    const jwt = token.toJwt();

    // Log success (but not the actual token)
    console.log(`✅ Successfully generated token for user: ${userName}`);

    return NextResponse.json({
      token: jwt,
      identity: userName,
    });
  } catch (error) {
    console.error("Token generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate access token" },
      { status: 500 }
    );
  }
}
