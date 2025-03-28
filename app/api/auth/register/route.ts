import {adminDb} from "@/lib/config/firebaseAdmin";
import {SessionManager} from "@/lib/session";
import bcrypt from "bcryptjs";
import {NextRequest, NextResponse} from "next/server";

const SALT_ROUNDS = 10;

/**
 * Validate that none of the required fields are empty and that the Terms have been accepted.
 * Returns a NextResponse error if validation fails, or true if everything is okay.
 */
function validateInput(
  input: Record<string, string>,
  acceptedTnC: boolean
): NextResponse | true {
  const requiredFields = [
    "email",
    "password",
    "username",
    "phone",
    "country",
    "city",
    "age",
  ];

  for (const field of requiredFields) {
    const value = input[field];
    if (value === undefined || value === null) {
      return NextResponse.json(
        { message: `${field} is required` },
        { status: 400 }
      );
    }

    // Convert numbers to strings for length validation
    const strValue = String(value).trim();
    if (strValue.length === 0) {
      return NextResponse.json(
        { message: `${field} cannot be empty` },
        { status: 400 }
      );
    }
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(input.email)) {
    return NextResponse.json(
      { message: "Please enter a valid email address" },
      { status: 400 }
    );
  }

  // Password validation (at least 6 characters)
  if (input.password.length < 6) {
    return NextResponse.json(
      { message: "Password must be at least 6 characters long" },
      { status: 400 }
    );
  }

  if (!acceptedTnC) {
    return NextResponse.json(
      { message: "You must accept the Terms & Conditions." },
      { status: 400 }
    );
  }

  return true;
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Validate all fields
    const validationResult = validateInput(data, data.acceptedTnC);
    if (validationResult !== true) {
      return validationResult;
    }

    const { email, password, username, phone, country, city, age } = data;

    // Check if user exists
    const userDoc = await adminDb.collection("users").doc(email).get();
    if (userDoc.exists) {
      return NextResponse.json(
        { error: "User already exists." },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user object
    const userData = {
      username,
      email,
      password: hashedPassword,
      phone,
      country,
      city,
      age,
      isStreamer: false,
      isAdmin: false,
      createdAt: new Date().toISOString(),
    };

    // Save user in Firestore
    await adminDb.collection("users").doc(email).set(userData);
    console.log("Created user data object");

    // Create session token using SessionManager class
    const sessionManager = new SessionManager();
    const sessionData = {
      email,
      isStreamer: userData.isStreamer,
      isAdmin: userData.isAdmin,
    };
    const token = await sessionManager.createSession(sessionData);
    console.log(`Token created for ${userData.username}: ${token}`);

    // Create response and set token in an HTTP-only cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
    });

    return response;
  } catch (error: unknown) {
    console.error("Registration error:", error);
    const errorMessage =
        error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
