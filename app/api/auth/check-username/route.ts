import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { createLogger } from "@/lib/utils/logger";

const logger = createLogger("API:check-username");

export async function GET(request: NextRequest) {
  try {
    // Get the username from query params
    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get("username");

    // Validate input
    if (!username) {
      return NextResponse.json(
        { error: "Username parameter is required" },
        { status: 400 }
      );
    }

    // Check if username exists in the Firebase database
    const usersRef = adminDb.collection("users");
    const query = usersRef.where("username", "==", username);
    const snapshot = await query.get();

    // Return availability status
    return NextResponse.json({
      available: snapshot.empty
    });
  } catch (error) {
    logger.error("Error checking username availability:", error as Error);
    return NextResponse.json(
      { error: "Failed to check username availability" },
      { status: 500 }
    );
  }
} 