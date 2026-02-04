import { NextResponse } from "next/server";
import * as User from "../../lib/models/user";
import connectDB from "../../lib/models/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }
    
    await connectDB();
    const user = await User.findOneByEmail(email.toLowerCase().trim());
    
    if (!user) {
      return NextResponse.json({ 
        status: 'new',
        votedFor: null 
      });
    }
    
    let status = 'new';
    if (user.paymentStatus === 'paid') status = 'paid';
    else if (user.votedFor) status = 'voted';
    else status = 'existing_unpaid';
    
    return NextResponse.json({
      status,
      votedFor: user.votedFor,
      email: user.email,
      isVerified: user.isVerified || false
    });
  } catch (error) {
    console.error("User status API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
