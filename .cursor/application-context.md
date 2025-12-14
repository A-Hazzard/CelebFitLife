# CelebFitLife - Application Context

**Last Updated:** January 2025

## 📚 Essential Documentation References

Before working on any part of the CelebFitLife platform, **always reference these documents:**

### Setup & Configuration Documentation

- **[SETUP.md](../SETUP.md)** - Complete setup guide including MongoDB, Stripe, Gmail configuration
- **[STRIPE_PRODUCTION_SETUP.md](../STRIPE_PRODUCTION_SETUP.md)** - Stripe test to production migration guide
- **[WEBHOOK_SETUP_EXPLAINED.md](../WEBHOOK_SETUP_EXPLAINED.md)** - Webhook setup for local vs production
- **[PAYMENT_TRACKING_IMPROVEMENTS.md](../PAYMENT_TRACKING_IMPROVEMENTS.md)** - Payment status tracking and cross-device support
- **[SEO_SETUP_GUIDE.md](../SEO_SETUP_GUIDE.md)** - SEO configuration and structured data

### Critical Guidelines

⚠️ **Before modifying Payment/Waitlist System:**

1. Read the payment tracking improvements document
2. Understand the webhook event flow
3. Check Stripe webhook configuration
4. Review rate limiting implementation
5. Understand payment status flow (unpaid → pending → paid)

⚠️ **Before modifying Database Models:**

1. Review user schema in `app/api/lib/models/user.ts`
2. Check TypeScript type definitions
3. Understand payment status enum values
4. Follow engineering guidelines for database operations

⚠️ **Before implementing Payment Features:**

1. Reference Stripe production setup guide
2. Verify webhook events are properly configured
3. Test payment flow in test mode first
4. Ensure email confirmation is working

## System Overview

CelebFitLife is a live-streaming fitness platform that connects fitness enthusiasts with celebrity trainers through exclusive, real-time workout experiences. The platform features a waitlist system with payment integration, email notifications, and webhook-based payment status tracking.

## Core Architecture

### Technology Stack

- **Frontend:** Next.js 15.5.3 with TypeScript, React 19
- **Backend:** Next.js API Routes with MongoDB
- **Database:** MongoDB with Mongoose ODM
- **Payments:** Stripe Checkout Sessions
- **Email:** Nodemailer with Gmail SMTP
- **Styling:** Tailwind CSS 4
- **Animations:** GSAP (GreenSock Animation Platform)
- **Build Tool:** pnpm for package management
- **Type System:** TypeScript with strict type checking

### Project Structure

```
celebfitlife/
├── app/                          # Next.js App Router
│   ├── api/                     # Backend API routes
│   │   ├── lib/                 # Shared backend utilities
│   │   │   ├── models/          # Mongoose schemas
│   │   │   │   ├── db.ts        # Database connection
│   │   │   │   └── waitlist.ts  # Waitlist model
│   │   │   └── rateLimit.ts     # Rate limiting implementation
│   │   ├── waitlist/            # Waitlist API endpoint
│   │   ├── contact/             # Contact form endpoint
│   │   └── webhooks/            # Stripe webhook handler
│   │       └── stripe/
│   ├── payment/                 # Payment pages
│   │   ├── page.tsx             # Payment checkout page
│   │   └── success/
│   │       └── page.tsx         # Payment success page
│   ├── page.tsx                 # Home page
│   └── layout.tsx               # Root layout
├── components/                   # React components
│   ├── WaitlistForm.tsx         # Waitlist signup form
│   ├── ContactSupportForm.tsx   # Contact form
│   ├── ContactSupportButton.tsx # Contact button component
│   ├── TiltCard.tsx             # 3D tilt card component
│   └── seo/
│       └── PageSEO.tsx          # SEO component
├── lib/                         # Shared utilities
│   ├── stripe.ts                # Stripe client configuration
│   ├── email.ts                 # Email sending utilities
│   └── seo/                     # SEO utilities
│       ├── config.ts            # SEO configuration
│       └── schema.ts            # Structured data schemas
└── public/                      # Static assets
```

## Core Business Logic

### Waitlist & Payment Flow

The system manages a waitlist with payment integration:

1. **User Submits Email** → **Waitlist Entry Created** → **Stripe Checkout Session** → **Payment** → **Webhook Updates Status** → **Email Confirmation**

### Payment Status Flow

```
unpaid → pending → paid ✅
   ↑         ↓
   └─────────┘ (expired/failed)
   ↓
failed ❌
   ↓
refunded ↩️
```

### Payment Status Meanings

- **`unpaid`**: Initial state, no checkout started
- **`pending`**: Checkout session created, waiting for payment
- **`paid`**: Payment completed successfully
- **`failed`**: Payment failed (async payments)
- **`refunded`**: Payment was refunded

## Database Models

### User Model

```typescript
interface IUser {
  email: string;                    // Unique, lowercase, trimmed
  paymentStatus: 'unpaid' | 'pending' | 'paid' | 'refunded' | 'failed';
  stripeCheckoutId?: string;        // Stripe checkout session ID
  stripeCustomerId?: string;        // Stripe customer ID
  waitListEmailSent?: boolean;      // Email confirmation flag
  createdAt: Date;
  updatedAt: Date;
}
```

### Key Relationships

- **User → Stripe Checkout**: One-to-one via `stripeCheckoutId`
- **User → Stripe Customer**: One-to-one via `stripeCustomerId`

## Engineering Guidelines

### TypeScript Discipline

- All types in `lib/types/` or inline type definitions
- Prefer `type` over `interface` for consistency
- No `any` types allowed - use proper type definitions
- Always check dependencies before deleting code
- Handle type conflicts properly with fallback logic

### Code Organization

- Keep page components lean, offload logic to helpers
- API logic in `app/api/lib/helpers/` or route files
- Shared utilities in `lib/utils/`
- Email templates in `lib/email.ts`
- SEO utilities in `lib/seo/`

### Build and Quality

- Use `pnpm` exclusively for package management
- Always run `pnpm build` after changes
- Never ignore ESLint violations
- Follow established code style

### Security

- Rate limiting: 5 requests per 15 minutes per IP for error attempts
- Email validation: Regex pattern matching
- Input sanitization: Trim and lowercase emails
- Webhook signature verification: Prevents fake webhook calls
- Database validation: Mongoose schema validation
- Error handling: Comprehensive try-catch blocks
- Type safety: Full TypeScript support

## Key Features

### Waitlist System

- Email-based waitlist signup
- Stripe payment integration ($1.00 USD)
- Payment status tracking
- Cross-device checkout resume
- Abandoned checkout handling
- Duplicate email prevention

### Payment Processing

- Stripe Checkout Sessions
- Webhook-based status updates
- Payment confirmation emails
- Automatic session expiration handling
- Refund support

### Email System

- Welcome emails on successful payment
- HTML email templates with branding
- Plain text fallback
- Gmail SMTP integration
- Error handling (won't fail webhook if email fails)

### Rate Limiting

- Error-based rate limiting (5 errors per 15 minutes)
- IP-based client identification
- Automatic timeout after repeated errors
- Success resets error count

## API Patterns

### Standard Endpoint Structure

```typescript
export async function POST(req: NextRequest) {
  try {
    // Rate limiting check
    const clientId = getClientIdentifier(req);
    const errorLimit = rateLimitErrors(clientId, 5);
    if (!errorLimit.allowed) {
      return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
    }

    // Input validation
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // Database operations
    const db = await connectDB();
    // ... business logic

    // Success response
    recordSuccess(clientId);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

### Error Handling

- Consistent error response format
- Proper HTTP status codes
- Detailed error logging
- Rate limit error responses
- Graceful degradation

## Performance Considerations

### Database Indexing

- Email field indexed (unique constraint)
- Optimized queries for email lookups
- Timestamp indexes for createdAt/updatedAt

### Frontend Optimization

- GSAP animations for smooth UX
- Code splitting and lazy loading
- Image optimization with Next.js Image
- Efficient form handling

## Webhook System

### Stripe Webhook Events

The system handles the following Stripe webhook events:

- ✅ `checkout.session.completed` - Payment successful
- ✅ `checkout.session.async_payment_succeeded` - Async payment succeeded
- ✅ `checkout.session.async_payment_failed` - Async payment failed
- ✅ `checkout.session.expired` - Session expired (resets to unpaid)
- ✅ `charge.refunded` - Payment refunded

### Webhook Flow

1. Stripe sends event to webhook endpoint
2. Webhook verifies signature
3. Updates user status
4. Sends confirmation email (if paid)
5. Returns 200 OK to Stripe

## Development Workflow

1. **Feature Development:**
   - Create types first
   - Implement backend API
   - Build frontend components
   - Add proper error handling
   - Test with Stripe test mode

2. **Code Review Checklist:**
   - TypeScript types are correct
   - No ESLint violations
   - Proper error handling
   - Security considerations (rate limiting, validation)
   - Webhook signature verification

3. **Testing:**
   - Manual testing of payment flow
   - API endpoint validation
   - Frontend component testing
   - Stripe webhook testing (use Stripe CLI for local)

## Environment Variables

### Required Variables

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/celebfitlife

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... or sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_WAITLIST_PRICE_ID=price_... (optional, auto-created if not set)

# Gmail Configuration
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000 or https://yourdomain.com
```

## Current System Status

### Build System Status ✅

- **TypeScript Compilation**: ✅ Clean (no errors)
- **ESLint**: ✅ Clean (no warnings)
- **Production Build**: ✅ Optimized and working
- **Type Safety**: ✅ Comprehensive coverage

### Payment System Status ✅

- **Stripe Integration**: ✅ Complete
- **Webhook Handling**: ✅ All events handled
- **Email Notifications**: ✅ Working
- **Rate Limiting**: ✅ Implemented
- **Cross-Device Support**: ✅ Checkout resume working
- **Payment Tracking**: ✅ Complete status flow

### UI/UX System ✅

- **Responsive Design**: ✅ Mobile-optimized layouts
- **Animations**: ✅ GSAP animations implemented
- **SEO**: ✅ Structured data and meta tags
- **Error Handling**: ✅ User-friendly error messages
- **Loading States**: ✅ Proper loading indicators

## Troubleshooting

### Common Issues

1. **"Payment system not configured"**
   - Check `STRIPE_SECRET_KEY` is set in environment variables
   - Restart dev server after adding env variables

2. **"Webhook signature verification failed"**
   - Ensure `STRIPE_WEBHOOK_SECRET` matches your webhook endpoint secret
   - For local dev, use the secret from `stripe listen` command
   - For production, use the secret from Stripe Dashboard

3. **"Email already exists"**
   - User already signed up
   - Check database for existing entry
   - Verify payment status

4. **Rate limit errors**
   - Wait 15 minutes or clear rate limit store (restart server)
   - Check error count in rate limiting implementation

5. **Webhook not receiving events**
   - Check endpoint URL is correct and accessible
   - Verify HTTPS is working (Stripe requires HTTPS for production)
   - Check server logs for errors
   - Verify webhook secret matches

## Future Considerations

### Planned Enhancements

- Admin dashboard to view waitlist
- Redis for production rate limiting
- Analytics tracking
- Monitoring and error tracking (Sentry)
- Email reminder for abandoned checkouts
- Session scheduling system
- Live streaming integration

### Technical Debt

- ✅ **Payment Tracking**: Complete implementation with cross-device support
- ✅ **Webhook System**: All events handled correctly
- ✅ **Email System**: Working with proper error handling
- **Rate Limiting**: Currently in-memory, consider Redis for production
- **Error Monitoring**: Add comprehensive error tracking
- **Testing**: Enhance automated testing coverage

## Key Documentation Files

### Setup & Configuration

- **[SETUP.md](../SETUP.md)** - Complete setup guide
- **[STRIPE_PRODUCTION_SETUP.md](../STRIPE_PRODUCTION_SETUP.md)** - Production deployment guide
- **[WEBHOOK_SETUP_EXPLAINED.md](../WEBHOOK_SETUP_EXPLAINED.md)** - Webhook configuration
- **[PAYMENT_TRACKING_IMPROVEMENTS.md](../PAYMENT_TRACKING_IMPROVEMENTS.md)** - Payment tracking features
- **[SEO_SETUP_GUIDE.md](../SEO_SETUP_GUIDE.md)** - SEO configuration

### Project Documentation

- **[introduction.md](../introduction.md)** - Project overview and mission
- **[README.md](../README.md)** - Project README
- **[`.cursor/rules/nextjs-rules.mdc`](./rules/nextjs-rules.mdc)** - Engineering rules and best practices

### Best Practices

- **Always test in Stripe test mode first** before going to production
- **Verify webhook events** are properly configured in Stripe Dashboard
- **Check environment variables** are set correctly
- **Monitor webhook logs** in Stripe Dashboard for delivery status
- **Use rate limiting** to prevent abuse
- **Validate all inputs** on both client and server side

---

This context file provides a comprehensive overview of the CelebFitLife platform. Use this as reference when working on any part of the system to maintain consistency and understand the broader context of your changes.

**Last Major Update:** January 2025 - Initial documentation for CelebFitLife platform
