/**
 * Admin Logout API Route
 *
 * This route handles admin logout by clearing the admin_session cookie.
 *
 * @module app/api/admin/logout/route
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * POST handler for admin logout
 *
 * Flow:
 * 1. Clear admin_session cookie
 * 2. Return success response
 */
export async function POST() {
  try {
    // ============================================================================
    // STEP 1: Clear admin_session cookie
    // ============================================================================
    const cookieStore = await cookies();
    cookieStore.delete('admin_session');

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Server Error';
    console.error("Logout error:", errorMessage);
    return NextResponse.json({ 
      error: errorMessage 
    }, { status: 500 });
  }
}
