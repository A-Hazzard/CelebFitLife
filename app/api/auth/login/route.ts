import { NextResponse } from "next/server";
import { adminDb } from "@/lib/config/firebaseAdmin";
import bcrypt from "bcryptjs";
import { SessionManager } from "@/lib/session";
import { z } from "zod";
import { UserData } from "@/app/api/models/userData";

// Zod Schema for input validation
const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate request body using Zod
    const parsedBody = loginSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
          { success: false, error: parsedBody.error.errors[0].message },
          { status: 400 }
      );
    }

    const { email, password } = parsedBody.data;

    // Fetch user document from Firestore
    const userDoc = await adminDb.collection("users").doc(email).get();
    if (!userDoc.exists) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const userData = userDoc.data();
    if (!userData || !userData.password) {
      return NextResponse.json({ success: false, error: "Invalid user data" }, { status: 500 });
    }

    // Compare password with hashed password in Firestore
    const isValidPassword = await bcrypt.compare(password, userData.password);
    if (!isValidPassword) {
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 });
    }

    // Create a session token using SessionManager
    const sessionManager = new SessionManager();
    const token = await sessionManager.createSession({
      email,
      isStreamer: userData.isStreamer,
      isAdmin: userData.isAdmin,
    });

    const user: UserData = {
      uid: userDoc.id,
      email: userData.email,
      displayName: userData.displayName || "",
      phone: userData.phone || "",
      country: userData.country || "",
      city: userData.city || "",
      age: userData.age || 0,
    };

    // Set token in an HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      user, // Return user data
    });

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
        { success: false, error: "Internal Server Error. Please try again later." },
        { status: 500 }
    );
  }
}
