import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/config/firebaseAdmin";
import bcrypt from "bcryptjs";
import { SessionManager } from "@/lib/session";

const SALT_ROUNDS = 10;

function validateInput(input: string[], acceptedTnC: boolean): Promise<NextResponse> | boolean {
  input.forEach((field) => {
    if (field.length === 0)
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );

    if (!acceptedTnC)
      return NextResponse.json(
        { message: "You Must Accept The Terms & Conditions." },
        { status: 400 }
      );
  });

  return true
}

export async function POST(request: NextRequest, response: NextResponse) {
  try {
    const body = await request.json();
    const { email, password, username, phone, country, city, age, acceptedTnC } = body;
    const inputs = [email, password, username, phone, country, city, age];
    const isValidated = validateInput(inputs, acceptedTnC);

    if(isValidated){
      //Check if user exists
      const userDoc = await adminDb.collection("users").doc(email).get();

      if (userDoc.exists)
        return NextResponse.json(
          { error: "User already exists." },
          { status: 400 }
        );

      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      //Create user object
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
      console.log("created user data oject")
      //Create user in firebase
      await adminDb.collection("users").doc(email).set(userData)

      //Create session token using SessionManager Class
      const sessionManager = new SessionManager()
      const sessionData = {
        email, 
        isStreamer: userData.isStreamer,
        isAdmin: userData.isAdmin
      }
      const token = sessionManager.createSession(sessionData)
      console.log(`Token created for ${userData.username}: ${token}`)
      //Create response and set token in HTTP-only cookie
      const response = NextResponse.json({success: true})

      response.cookies.set("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV == "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
      });

      return response
    }
   

  } catch (error:any) {
    console.error("Registration error:", error)
    return NextResponse.json(
        { error: error.message || "Internal Server Error" },
        { status: 500 }
    )
  }
}
