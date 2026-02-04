import { NextResponse } from "next/server";
import * as User from "../lib/models/user";
import connectDB from "../lib/models/db";
import { rateLimitErrors, recordError, recordSuccess, getClientIdentifier } from "../lib/rateLimit";
import { sendEmail, generateVerificationEmail } from "@/lib/email";
import crypto from "crypto";

const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL as string;

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    const clientId = getClientIdentifier(request);

    // Check rate limit before processing
    const errorLimit = rateLimitErrors(clientId);
    if (!errorLimit.allowed) {
      return NextResponse.json(
        {
          error: "Too many error attempts. Please try again later.",
          retryAfter: Math.ceil((errorLimit.resetTime - Date.now()) / 1000),
          timeoutMinutes: errorLimit.timeoutMinutes,
        },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil((errorLimit.resetTime - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    if (!email) {
      console.log("Email Required");
      const errorResult = recordError(clientId);
      if (errorResult.shouldTimeout) {
        return NextResponse.json(
          {
            error: "Email Required",
            rateLimited: true,
            retryAfter: Math.ceil((errorResult.resetTime - Date.now()) / 1000),
            timeoutMinutes: errorResult.timeoutMinutes,
          },
          { 
            status: 429,
            headers: {
              "Retry-After": Math.ceil((errorResult.resetTime - Date.now()) / 1000).toString(),
            }
          }
        );
      }
      return NextResponse.json({ error: "Email Required" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error("Invalid Email Format");
      const errorResult = recordError(clientId);
      if (errorResult.shouldTimeout) {
        return NextResponse.json(
          {
            error: "Invalid Email Format",
            rateLimited: true,
            retryAfter: Math.ceil((errorResult.resetTime - Date.now()) / 1000),
            timeoutMinutes: errorResult.timeoutMinutes,
          },
          { 
            status: 429,
            headers: {
              "Retry-After": Math.ceil((errorResult.resetTime - Date.now()) / 1000).toString(),
            }
          }
        );
      }
      return NextResponse.json(
        { error: "Invalid Email Format" },
        { status: 400 }
      );
    }

    const sanitizedEmail = email.trim().toLowerCase();

    await connectDB();

    // Get origin from request headers for dynamic link generation
    const origin = request.headers.get('origin') || 
                   request.headers.get('referer')?.split('/').slice(0, 3).join('/') ||
                   APP_BASE_URL?.trim() ||
                   'https://celebfitlife.vercel.app';

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date();
    verificationTokenExpiry.setHours(verificationTokenExpiry.getHours() + 24); // 24 hour expiry

    const existingUser = await User.findOneByEmail(sanitizedEmail);
    const isNewUser = !existingUser;

    // Use existing entry if it exists, otherwise create new
    let user = existingUser;
    
    if (!user) {
      // Create new user with isVerified: false
      user = await User.createUser({
        email: sanitizedEmail,
        paymentStatus: "unpaid",
        isVerified: false,
        verificationToken,
        verificationTokenExpiry,
        ip: (request.headers.get("x-forwarded-for") ?? "127.0.0.1").split(",")[0],
        userAgent: request.headers.get("user-agent") || "Unknown",
        country: "Unknown", // Placeholder for GeoIP
        city: "Unknown",
        deviceType: (request.headers.get("user-agent") || "").toLowerCase().includes("mobile") ? "Mobile" : "Desktop"
      });
      console.log(`Created new user: ${sanitizedEmail}`);
    } else {
      // For existing users, always send verification email (re-verification)
      // Update verification token even if already verified (allows re-verification)
      const updated = await User.updateById(user._id, {
        verificationToken,
        verificationTokenExpiry,
        // Reset payment status to unpaid if not paid (allows retrying)
        ...(user.paymentStatus !== 'paid' && { paymentStatus: "unpaid" as const })
      });
      user = updated ?? user;
      console.log(`Sending verification email to existing user: ${sanitizedEmail}`);
    }

    // Send verification email
    try {
      const emailOptions = generateVerificationEmail(sanitizedEmail, verificationToken, origin, isNewUser);
      const emailSent = await sendEmail(emailOptions);
      
      if (!emailSent) {
        console.error(`Failed to send verification email to: ${sanitizedEmail}`);
        // Don't fail the request, but log the error
      } else {
        console.log(`Verification email sent to: ${sanitizedEmail}`);
      }
    } catch (error) {
      console.error(`Error sending verification email to ${sanitizedEmail}:`, error);
      // Don't fail the request, but log the error
    }

    // Ensure user exists before returning
    if (!user) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    recordSuccess(clientId);
    return NextResponse.json(
      {
        success: true,
        message: isNewUser 
          ? "Verification email sent. Please check your inbox to complete your registration."
          : "Verification email sent. Please check your inbox to verify your email address.",
        data: {
            id: user._id,
            email: user.email,
            isVerified: user.isVerified,
            isNewUser: isNewUser
        }
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("User API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectDB();

    const [allUsers, count] = await Promise.all([
      User.findAll(),
      User.countDocuments(),
    ]);

    console.log("Got Users");
    return NextResponse.json(
      {
        success: true,
        data: {
          allUsers,
          count,
        },
      },
      { status: 200 }
    );
  } catch {
    console.log("Internal Server Error");
    return NextResponse.json(
      {
        error: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
