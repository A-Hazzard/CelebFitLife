import { NextResponse } from "next/server";
import { TwilioService } from "@/app/api/lib/services/TwilioService";

export async function POST(req: Request) {
  try {
    const { roomName, identity } = await req.json();
    if (!roomName || !identity) {
      return NextResponse.json(
        { error: "Missing roomName or identity" },
        { status: 400 }
      );
    }
    const twilioService = new TwilioService();
    const token = await twilioService.generateToken(roomName, identity);
    return NextResponse.json({ token });
  } catch (error: unknown) {
    let message = "Internal server error";
    if (
      typeof error === "object" &&
      error &&
      "message" in error &&
      typeof (error as { message: unknown }).message === "string"
    ) {
      message = (error as { message: string }).message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
