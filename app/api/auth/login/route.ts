import { NextResponse } from "next/server";
import { adminDb } from "@/lib/config/firebaseAdmin";
import bcrypt from "bcryptjs";
import { SessionManager } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Missing email or password" },
        { status: 400 }
      );
    }

    // Fetch the user document from Firestore
    const userDoc = await adminDb.collection("users").doc(email).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const userData = userDoc.data();
    if (!userData || !userData.password) {
      return NextResponse.json({ error: "Invalid user data" }, { status: 500 });
    }

    // Compare password with stored hash
    const isValidPassword = await bcrypt.compare(password, userData.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Create a session token using SessionManager
    const sessionManager = new SessionManager();
    const token = await sessionManager.createSession({
      email,
      isStreamer: userData.isStreamer,
      isAdmin: userData.isAdmin,
    });

    // Set the token in an HTTP-only cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
