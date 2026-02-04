import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import * as User from "@/app/api/lib/models/user";
import connectDB from "@/app/api/lib/models/db";

const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL as string;

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOneByEmail(email);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

     // Get or create $1 price
     const WAITLIST_PRICE_ID = process.env.STRIPE_WAITLIST_PRICE_ID;
     let priceId = WAITLIST_PRICE_ID;
 
     if (!priceId) {
        // Fallback: This part should logically be handled by a script or verifying env vars, 
        // but for robustness we can keep the create logic or just error out. 
        // For this task, assuming price might need creation if env is empty.
       const product = await stripe.products.create({
         name: "CelebFitLife Waitlist Access",
         description: "Priority access to live celebrity fitness sessions",
       });
 
       const price = await stripe.prices.create({
         product: product.id,
         unit_amount: 100,
         currency: "usd",
       });
       priceId = price.id;
     }

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${APP_BASE_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_BASE_URL}/onboarding/options?email=${email}&canceled=true`, // Return to options
      client_reference_id: String(user._id),
      customer_email: email,
      metadata: {
        user_id: String(user._id),
        email: email,
      },
    });

    await User.updateById(user._id, {
        stripeCheckoutId: session.id,
        paymentStatus: "pending",
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
