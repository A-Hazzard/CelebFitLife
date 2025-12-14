/**
 * Admin Auth Check API Route
 *
 * This route checks if the current user is authenticated as admin.
 * Returns authentication status without requiring full login.
 *
 * @module app/api/admin/auth-check/route
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * GET handler for checking admin authentication status
 *
 * Flow:
 * 1. Check for admin_session cookie
 * 2. Return authentication status
 */
export async function GET() {
  try {
    // ============================================================================
    // STEP 1: Check for admin_session cookie
    // ============================================================================
    const cookieStore = await cookies();
    const adminSession = cookieStore.get('admin_session');

    const isAuthenticated = adminSession?.value === 'true';

    return NextResponse.json({ 
      authenticated: isAuthenticated 
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Server Error';
    console.error("Auth check error:", errorMessage);
    return NextResponse.json({ 
      authenticated: false,
      error: errorMessage 
    }, { status: 500 });
  }
}
