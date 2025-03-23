import { NextResponse } from "next/server";
import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const apiKey = process.env.TWILIO_API_KEY_SID;
const apiSecret = process.env.TWILIO_API_KEY_SECRET;



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

    if (!accountSid || !apiKey || !apiSecret) {
      console.error("❌ Missing Twilio credentials in environment variables");
      throw new Error("Twilio credentials not configured");
    }

    // Create a Twilio Access Token
    const token = new twilio.jwt.AccessToken(accountSid, apiKey, apiSecret, {
      identity: userName,
    });

    // Grant access to the specified Video room
    const videoGrant = new twilio.jwt.AccessToken.VideoGrant({ room: roomName });
    token.addGrant(videoGrant);

    return NextResponse.json({
      token: token.toJwt(),
      identity: userName,
    });
  } catch (error) {
    console.error("Token generation error:", error);
    return NextResponse.json({ error: "Failed to generate access token" }, { status: 500 });
  }
}
