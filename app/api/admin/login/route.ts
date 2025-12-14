import { NextResponse } from "next/server";
import User from "@/app/api/lib/models/user";
import connectDB from "@/app/api/lib/models/db";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    await connectDB();

    const user = await User.findOne({ email }).select('+password');

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password || "");

    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Set cookie (In a real app use JWT/Sessions, for MVP we use a simple secure cookie)
    const cookieStore = await cookies();
    cookieStore.set('admin_session', 'true', { secure: true, httpOnly: true, path: '/' });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
