import { NextResponse } from "next/server";
import * as User from "@/app/api/lib/models/user";
import connectDB from "@/app/api/lib/models/db";

export async function POST(request: Request) {
  try {
    const { email, candidateId } = await request.json();
    const headers = request.headers;
    const ip = headers.get("x-forwarded-for") || "unknown";
    const userAgent = headers.get("user-agent") || "unknown";

    if (!email || !candidateId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOneByEmail(email);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user already voted
    if (user.votedFor) {
         return NextResponse.json({ error: "You have already voted." }, { status: 403 });
    }

    // Map ID to Name
    const CELEB_NAMES: Record<string, string> = {
        "celeb_a": "Alex Sterling",
        "celeb_b": "Elena Velez",
        "celeb_c": "Marcus J."
    };
    
    const votedName = CELEB_NAMES[candidateId] || candidateId;

    // Update user
    await User.updateById(user._id, {
        votedFor: votedName,
        ip: ip,
        userAgent: userAgent
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Vote Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
