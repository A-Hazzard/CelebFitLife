import { NextResponse } from "next/server";
import Waitlist from "../lib/models/waitlist";
import connectDB from "../lib/models/db";
import { stripe } from "@/lib/stripe";
import { rateLimit, getClientIdentifier } from "../lib/rateLimit";

const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL as string;

export async function POST(request: Request) {
  try {
    // Rate limiting - 5 requests per 15 minutes per IP
    const clientId = getClientIdentifier(request);
    const limit = rateLimit(clientId, 5, 15 * 60 * 1000);

    if (!limit.allowed) {
      return NextResponse.json(
        {
          error: "Too many requests. Please try again later.",
          retryAfter: Math.ceil((limit.resetTime - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil(
              (limit.resetTime - Date.now()) / 1000
            ).toString(),
            "X-RateLimit-Limit": "5",
            "X-RateLimit-Remaining": limit.remaining.toString(),
            "X-RateLimit-Reset": limit.resetTime.toString(),
          },
        }
      );
    }

    const { email } = await request.json();

    if (!email) {
      console.log("Email Required");
      return NextResponse.json({ error: "Email Required" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error("Invalid Email Format");
      return NextResponse.json(
        { error: "Invalid Email Format" },
        { status: 400 }
      );
    }

    const sanitizedEmail = email.trim().toLowerCase();

    const db = await connectDB();

    if (!db) {
      console.error("Network Error, Please Try Again Later.");
      return NextResponse.json(
        {
          error: "Network Error, Please Try Again Later.",
        },
        { status: 200 }
      );
    }

    const existingUser = await Waitlist.findOne({ email: sanitizedEmail });

    if (existingUser) {
      console.error("Email already registered");
      return Response.json(
        {
          error: "Email Already Registered",
        },
        { status: 409 }
      );
    }

    // Check if Stripe is configured
    const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
    if (!STRIPE_SECRET_KEY) {
      console.error("STRIPE_SECRET_KEY is not configured");
      return NextResponse.json(
        {
          error: "Payment system not configured",
        },
        { status: 500 }
      );
    }

    const newEntry = await Waitlist.create({
      email: sanitizedEmail,
      paymentStatus: "unpaid",
    });

    const baseUrl = APP_BASE_URL?.trim();
    if (!baseUrl || !baseUrl.startsWith("http")) {
      console.error(
        "NEXT_PUBLIC_APP_URL must be a valid URL starting with http:// or https://"
      );
      return NextResponse.json(
        {
          error: "Server configuration error",
        },
        { status: 500 }
      );
    }

    // Get or create $1 price
    const WAITLIST_PRICE_ID = process.env.STRIPE_WAITLIST_PRICE_ID;

    if (!WAITLIST_PRICE_ID) {
      // Create product and price if not exists
      const product = await stripe.products.create({
        name: "CelebFitLife Waitlist Access",
        description:
          "Join the exclusive waitlist for live celebrity fitness sessions",
      });

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: 100, // $1.00 in cents
        currency: "usd",
      });

      // Use the created price ID
      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price: price.id,
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${APP_BASE_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${APP_BASE_URL}/?canceled=true`,
        client_reference_id: String(newEntry._id),
        customer_email: sanitizedEmail,
        metadata: {
          waitlist_id: String(newEntry._id),
          email: sanitizedEmail,
        },
      });

      // Update entry with checkout session ID
      await Waitlist.findByIdAndUpdate(newEntry._id, {
        stripeCheckoutId: session.id,
        paymentStatus: "pending",
      });

      return NextResponse.json(
        {
          success: true,
          url: session.url,
        },
        { status: 201 }
      );
    }

    // Create Checkout Session with existing price
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: WAITLIST_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${APP_BASE_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_BASE_URL}/?canceled=true`,
      client_reference_id: String(newEntry._id),
      customer_email: sanitizedEmail,
      metadata: {
        waitlist_id: String(newEntry._id),
        email: sanitizedEmail,
      },
    });

    // Update entry with checkout session ID
    await Waitlist.findByIdAndUpdate(newEntry._id, {
      stripeCheckoutId: session.id,
      paymentStatus: "pending",
    });

    return NextResponse.json(
      {
        success: true,
        url: session.url,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Waitlist API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const db = await connectDB();

    if (!db) {
      console.log("Network Error, Please Try Again Later.");
      return NextResponse.json(
        {
          error: "Network Error, Please Try Again Later.",
        },
        { status: 500 }
      );
    }

    const [allWaitlists, count] = await Promise.all([
      Waitlist.find({}),
      Waitlist.countDocuments({}),
    ]);

    console.log("Got Waitlist");
    return NextResponse.json(
      {
        success: true,
        data: {
          allWaitlists,
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
