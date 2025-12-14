import { redirect } from 'next/navigation';
import Link from 'next/link';
import { stripe } from '@/lib/stripe';
import connectDB from '@/app/api/lib/models/db';
import User from '@/app/api/lib/models/user';
import ContactSupportButton from '@/components/ContactSupportButton';
import { sendEmail, generateWelcomeEmail } from '@/lib/email';

export default async function SuccessPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ session_id?: string }> 
}) {
  const params = await searchParams;
  const sessionId = params.session_id;

  if (!sessionId) {
    redirect('/?error=no_session');
  }

  try {
    // Verify the session with Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'payment_intent', 'customer']
    });

    // Verify payment was successful
    if (session.payment_status !== 'paid') {
      redirect('/?error=payment_not_completed');
    }

    // Update database to ensure it's marked as paid
    await connectDB();
    let user = null;
    if (session.client_reference_id) {
      // First, get the current user to check email status
      user = await User.findById(session.client_reference_id);
      
      // Update payment status
      user = await User.findByIdAndUpdate(
        session.client_reference_id,
        {
          paymentStatus: 'paid',
          stripeCheckoutId: session.id,
          stripeCustomerId: session.customer as string || undefined
        },
        { new: true }
      );
    }

    const customerEmail = session.customer_details?.email || session.customer_email || user?.email;

    // Validate email format before sending
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValidEmail = customerEmail && emailRegex.test(customerEmail);

    // Send confirmation email if not already sent (prevents duplicate on refresh)
    if (isValidEmail && user && !user.waitListEmailSent) {
      try {
        // Send email to the customer's email address
        const emailOptions = generateWelcomeEmail(customerEmail);
        const emailSent = await sendEmail(emailOptions);
        
        if (emailSent) {
          // Mark email as sent to prevent duplicate on refresh
          await User.findByIdAndUpdate(user._id, {
            waitListEmailSent: true
          });
          console.log(`✅ Confirmation email sent from success page to: ${customerEmail}`);
        } else {
          console.warn(`⚠️ Failed to send confirmation email to: ${customerEmail} - Check Gmail configuration in .env.local`);
        }
      } catch (emailError) {
        console.error('❌ Error sending confirmation email from success page:', emailError);
        // Don't fail the page if email fails
      }
    } else if (user?.waitListEmailSent) {
      console.log(`ℹ️ Confirmation email already sent to: ${customerEmail} (skipping to prevent duplicate)`);
    } else if (!customerEmail) {
      console.warn(`⚠️ No customer email found in session or user entry`);
    } else if (!isValidEmail) {
      console.error(`❌ Invalid email address format: ${customerEmail} - Email not sent`);
    }

    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="max-w-2xl w-full">
          <div className="glass-card rounded-3xl p-8 md:p-12 text-center">
            {/* Success Icon */}
            <div className="mb-6 flex justify-center">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>

            {/* Success Message */}
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 uppercase">
              Welcome to the{' '}
              <span className="text-orange-500">Waitlist!</span>
            </h1>

            <p className="text-gray-300 text-lg mb-6 leading-relaxed">
              Thank you for joining CelebFitLife! Your payment has been confirmed.
            </p>

            {customerEmail && (
              <p className="text-gray-400 text-sm mb-8">
                A confirmation email has been sent to{' '}
                <span className="text-orange-500 font-medium">{customerEmail}</span>
              </p>
            )}

            {/* What's Next */}
            <div className="bg-gray-900/50 rounded-2xl p-6 mb-8 text-left">
              <h2 className="text-xl font-bold text-white mb-4">
                What happens next?
              </h2>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="text-orange-500 font-bold">1.</span>
                  <span>You&apos;ll receive exclusive notifications about upcoming live sessions</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-orange-500 font-bold">2.</span>
                  <span>Get first access to book sessions with celebrity trainers</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-orange-500 font-bold">3.</span>
                  <span>Join our community of fitness enthusiasts</span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {customerEmail ? (
                user?.votedFor ? (
                  <Link
                    href={`/onboarding/options?email=${encodeURIComponent(customerEmail)}`}
                    className="bg-orange-500 text-black px-8 py-3 rounded-lg font-bold transition-all duration-300 hover:bg-orange-400 hover:scale-105 cursor-pointer"
                  >
                    Preview
                  </Link>
                ) : (
                  <Link
                    href={`/onboarding/vote?email=${encodeURIComponent(customerEmail)}`}
                    className="bg-orange-500 text-black px-8 py-3 rounded-lg font-bold transition-all duration-300 hover:bg-orange-400 hover:scale-105 cursor-pointer"
                  >
                    Vote Now
                  </Link>
                )
              ) : (
                <Link
                  href="/"
                  className="bg-white text-black px-8 py-3 rounded-lg font-medium transition-all duration-300 hover:bg-orange-500 hover:text-white hover:scale-105 cursor-pointer"
                >
                  Back to Home
                </Link>
              )}
              <ContactSupportButton userEmail={customerEmail || undefined} />
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Success page error:', error);
    redirect('/?error=verification_failed');
  }
}

