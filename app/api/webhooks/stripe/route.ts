import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import connectDB from '../../lib/models/db';
import * as User from '../../lib/models/user';
import Stripe from 'stripe';
import { sendEmail, generateWelcomeEmail } from '@/lib/email';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature for security
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook signature verification failed:', errorMessage);
    return NextResponse.json(
      { error: `Webhook Error: ${errorMessage}` },
      { status: 400 }
    );
  }

  try {
    await connectDB();

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Update user to paid
        if (session.client_reference_id) {
          const updatedUser = await User.updateById(
            session.client_reference_id,
            {
              paymentStatus: 'paid',
              stripeCheckoutId: session.id,
              stripeCustomerId: (session.customer as string) || undefined
            }
          );
          
          console.log(`✅ Payment successful for user: ${session.client_reference_id}`);
          
          // Send welcome email (only if not already sent)
          const customerEmail = session.customer_details?.email || session.customer_email || updatedUser?.email;
          if (customerEmail && updatedUser && !updatedUser.waitListEmailSent) {
            try {
              // Send email to the customer's email address
              const emailOptions = generateWelcomeEmail(customerEmail);
              const emailSent = await sendEmail(emailOptions);
              if (emailSent && updatedUser) {
                // Mark email as sent
                await User.updateById(updatedUser._id, {
                  waitListEmailSent: true
                });
                console.log(`✅ Welcome email sent to: ${customerEmail}`);
              } else {
                console.error(`❌ Failed to send welcome email to: ${customerEmail} - Check Gmail configuration in .env.local`);
              }
            } catch (emailError) {
              console.error('❌ Error sending welcome email:', emailError);
              // Don't fail the webhook if email fails
            }
          } else if (updatedUser?.waitListEmailSent) {
            console.log(`ℹ️ Confirmation email already sent to: ${customerEmail} (skipping duplicate)`);
          } else {
            console.warn(`⚠️ Cannot send email: customerEmail=${customerEmail}, updatedUser=${!!updatedUser}, emailSent=${updatedUser?.waitListEmailSent}`);
          }
        }
        break;
      }

      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.client_reference_id) {
          const updatedUser = await User.updateById(
            session.client_reference_id,
            {
              paymentStatus: 'paid',
              stripeCheckoutId: session.id,
              stripeCustomerId: (session.customer as string) || undefined
            }
          );
          
          // Send welcome email for async payments too (only if not already sent)
          const customerEmail = session.customer_details?.email || session.customer_email || updatedUser?.email;
          if (customerEmail && updatedUser && !updatedUser.waitListEmailSent) {
            try {
              // Send email to the customer's email address
              const emailOptions = generateWelcomeEmail(customerEmail);
              const emailSent = await sendEmail(emailOptions);
              if (emailSent && updatedUser) {
                // Mark email as sent
                await User.updateById(updatedUser._id, {
                  waitListEmailSent: true
                });
                console.log(`✅ Welcome email sent to: ${customerEmail}`);
              } else {
                console.error(`❌ Failed to send welcome email to: ${customerEmail} - Check Gmail configuration`);
              }
            } catch (emailError) {
              console.error('❌ Error sending welcome email:', emailError);
            }
          }
        }
        break;
      }

      case 'checkout.session.async_payment_failed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.client_reference_id) {
          await User.updateById(session.client_reference_id, {
            paymentStatus: 'failed'
          });
          console.log(`❌ Async payment failed for user: ${session.client_reference_id}`);
        }
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.client_reference_id) {
          await User.updateById(session.client_reference_id, {
            paymentStatus: 'unpaid',
            stripeCheckoutId: null // Clear expired checkout ID
          });
          console.log(`⏰ Checkout session expired for user: ${session.client_reference_id}`);
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        
        // Find user by customer ID
        if (charge.customer) {
          const refundUser = await User.findOneByStripeCustomerId(charge.customer as string);
          if (refundUser) {
            await User.updateById(refundUser._id, {
              paymentStatus: 'refunded'
            });
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Webhook handler error:', errorMessage);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

