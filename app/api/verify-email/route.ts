/**
 * Email Verification API Route
 *
 * This route handles email verification via token.
 * It supports:
 * - Token validation and expiry checking
 * - User verification status update
 * - Redirect to options page after successful verification
 *
 * @module app/api/verify-email/route
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import * as User from "../lib/models/user";
import connectDB from "../lib/models/db";

/**
 * Main GET handler for email verification
 *
 * Flow:
 * 1. Parse and validate token from query parameters
 * 2. Connect to database
 * 3. Find user by verification token
 * 4. Check token expiry
 * 5. Update user verification status
 * 6. Redirect to options page or landing page with error
 */
export async function GET(req: NextRequest) {
  try {
    // ============================================================================
    // STEP 1: Parse and validate token from query parameters
    // ============================================================================
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      console.error("Verification token missing");
      const redirectUrl = new URL('/', req.url);
      redirectUrl.searchParams.set('error', 'invalid_token');
      redirectUrl.searchParams.set('message', 'Verification link is invalid. Please try again.');
      return NextResponse.redirect(redirectUrl);
    }

    // ============================================================================
    // STEP 2: Connect to database
    // ============================================================================
    await connectDB();

    // ============================================================================
    // STEP 3: Find user by verification token
    // ============================================================================
    const user = await User.findOneByVerificationToken(token);

    if (!user) {
      console.error(`User not found for token: ${token.substring(0, 8)}...`);
      const redirectUrl = new URL('/', req.url);
      redirectUrl.searchParams.set('error', 'invalid_token');
      redirectUrl.searchParams.set('message', 'Verification link is invalid or has expired. Please request a new verification email.');
      return NextResponse.redirect(redirectUrl);
    }

    // ============================================================================
    // STEP 4: Check token expiry
    // ============================================================================
    if (user.verificationTokenExpiry && new Date() > user.verificationTokenExpiry) {
      console.error(`Token expired for user: ${user.email}`);
      // Clear expired token
      await User.updateById(user._id, {
        verificationToken: null,
        verificationTokenExpiry: null
      });
      
      const redirectUrl = new URL('/', req.url);
      redirectUrl.searchParams.set('error', 'expired_token');
      redirectUrl.searchParams.set('message', 'Verification link has expired. Please request a new verification email.');
      return NextResponse.redirect(redirectUrl);
    }

    // ============================================================================
    // STEP 5: Update user verification status
    // ============================================================================
    await User.updateById(user._id, {
      isVerified: true,
      verificationToken: null, // Clear token after successful verification
      verificationTokenExpiry: null
    });

    console.log(`Email verified successfully for user: ${user.email}`);

    // ============================================================================
    // STEP 6: Redirect to options page with success indicator
    // ============================================================================
    const redirectUrl = new URL('/onboarding/options', req.url);
    redirectUrl.searchParams.set('email', user.email);
    redirectUrl.searchParams.set('verified', 'true');

    return NextResponse.redirect(redirectUrl);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Server Error';
    console.error("Email verification error:", errorMessage);
    
    const redirectUrl = new URL('/', req.url);
    redirectUrl.searchParams.set('error', 'server_error');
    redirectUrl.searchParams.set('message', 'An error occurred during verification. Please try again.');
    return NextResponse.redirect(redirectUrl);
  }
}
