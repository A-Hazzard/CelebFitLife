import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { generateTwilioToken } from '@/lib/twilio';

export async function POST(req: NextRequest) {
  try {
    const { roomName, userName } = await req.json();
    console.log(roomName, userName)
    if (!roomName) {
      return NextResponse.json({ error: 'roomName is required' }, { status: 400 });
    }

    // Generate the token using our helper
    const token = generateTwilioToken(roomName, userName);

    if (!token) {
      console.error('❌ Twilio token is undefined!');
      return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
    }

    // console.log('✅ Twilio token generated:', token);
    return NextResponse.json({ token });
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error('Error generating Twilio token:', err);
      return NextResponse.json({ error: 'Unable to generate token' }, { status: 500 });
    } else {
      console.error('Unknown error generating Twilio token:', err);
      return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
    }
  }
}
