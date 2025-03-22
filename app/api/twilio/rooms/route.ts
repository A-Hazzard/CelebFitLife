import { NextResponse } from "next/server";
import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

if (!accountSid || !authToken) {
  console.error("❌ Missing Twilio credentials in environment variables!");
}

const client = twilio(accountSid, authToken);

export async function POST(req: Request) {
  try {
    const { roomName } = await req.json();

    if (!roomName) {
      return NextResponse.json({ error: "roomName is required" }, { status: 400 });
    }

    // Check if the room already exists
    try {
      const existingRoom = await client.video.rooms(roomName).fetch();
      console.log("✅ Room already exists:", existingRoom.uniqueName);
      return NextResponse.json({ room: existingRoom });
    } catch (err) {
      // If fetch fails, the room doesn't exist. We'll create it below
      console.log("🚀 Creating new Twilio room:", roomName);
    }

    // Create new Twilio room
    const room = await client.video.rooms.create({
      uniqueName: roomName,
      type: "group",
    });

    return NextResponse.json({ room });
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("Error creating room:", err);
      return NextResponse.json({ error: "Unable to create room" }, { status: 500 });
    } else {
      console.error("Unknown error creating room:", err);
      return NextResponse.json({ error: "An unknown error occurred" }, { status: 500 });
    }
  }
}
