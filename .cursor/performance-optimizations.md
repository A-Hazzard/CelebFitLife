# Performance Optimization Guidelines

**Last Updated:** January 2025  
**Version:** 1.0.0

---

## 🎯 Overview

This document summarizes performance optimization patterns and best practices for Next.js applications, specifically tailored for the CelebFitLife platform.

---

## 🚀 Optimization Patterns

### 1. Database Query Optimization

**Problem:** Fetching unnecessary data or inefficient queries

**Best Practices:**

- Use MongoDB indexes on frequently queried fields (email, timestamps)
- Project only needed fields in queries
- Use `.lean()` for read-only operations to get plain JavaScript objects
- Batch queries when possible instead of sequential queries

**Example:**

```typescript
// ✅ GOOD - Use lean() for read-only queries
const waitlistEntries = await Waitlist.find({ paymentStatus: 'paid' })
  .select('email createdAt')
  .lean();

// ❌ BAD - Full documents when not needed
const waitlistEntries = await Waitlist.find({ paymentStatus: 'paid' });
```

---

### 2. Rate Limiting Pattern

**Problem:** API abuse and excessive requests

**Solution:**

- Implement rate limiting based on client IP
- Track error attempts separately from successful requests
- Use exponential backoff for repeated errors
- Store rate limit data efficiently (in-memory for small apps, Redis for production)

**Current Implementation:**

- 5 error attempts per 15 minutes per IP
- Automatic timeout after repeated errors
- Success resets error count

---

### 3. Webhook Processing Optimization

**Problem:** Slow webhook processing can cause Stripe to retry

**Best Practices:**

- Return 200 OK immediately after receiving webhook
- Process webhook data asynchronously if possible
- Use database transactions for atomic updates
- Log webhook processing time for monitoring

**Example:**

```typescript
// ✅ GOOD - Fast response, async processing
export async function POST(req: NextRequest) {
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();
  
  // Verify signature quickly
  const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  
  // Return 200 OK immediately
  // Process event asynchronously (don't await)
  processWebhookEvent(event).catch(console.error);
  
  return NextResponse.json({ received: true });
}
```

---

### 4. Email Sending Optimization

**Problem:** Email sending can block webhook responses

**Solution:**

- Don't await email sending in webhook handler
- Use background job queue for email processing (future enhancement)
- Handle email failures gracefully
- Cache email templates to avoid re-parsing

**Current Implementation:**

```typescript
// ✅ GOOD - Email doesn't block webhook response
await Waitlist.findByIdAndUpdate(waitlistId, { paymentStatus: 'paid' });

// Send email asynchronously (don't await)
sendWelcomeEmail(email).catch(error => {
  console.error('Email sending failed:', error);
  // Log error but don't fail webhook
});
```

---

### 5. Frontend Performance Optimization

**Best Practices:**

#### Image Optimization

- Use Next.js `Image` component for automatic optimization
- Set appropriate `priority` flag for above-the-fold images
- Use responsive images with proper `sizes` attribute

```typescript
// ✅ GOOD - Optimized image loading
<Image
  src={heroImage}
  alt="Hero"
  fill
  priority
  className="object-cover"
/>
```

#### Code Splitting

- Use dynamic imports for heavy components
- Lazy load modals and non-critical components
- Split routes automatically with Next.js App Router

#### Animation Performance

- Use GSAP for smooth, performant animations
- Use `will-change` CSS property sparingly
- Debounce scroll event handlers
- Use `requestAnimationFrame` for animations

```typescript
// ✅ GOOD - Efficient animation with GSAP
gsap.fromTo(element, 
  { opacity: 0, y: 20 },
  { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
);
```

---

### 6. API Response Optimization

**Best Practices:**

- Return only necessary data in API responses
- Use compression middleware (Next.js handles this automatically)
- Set appropriate cache headers for static data
- Paginate large result sets

**Example:**

```typescript
// ✅ GOOD - Paginated response
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Waitlist.find({}).skip(skip).limit(limit).lean(),
    Waitlist.countDocuments({})
  ]);

  return NextResponse.json({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
}
```

---

### 7. Database Connection Optimization

**Problem:** Creating new database connections on every request

**Solution:**

- Reuse database connections (Mongoose handles this automatically)
- Use connection pooling
- Handle connection errors gracefully
- Monitor connection pool status

**Current Implementation:**

```typescript
// ✅ GOOD - Reused connection
import connectDB from './lib/models/db';

export async function POST(req: NextRequest) {
  const db = await connectDB(); // Reuses existing connection if available
  // ... rest of code
}
```

---

## 📊 Performance Monitoring

### Metrics to Track

- **API Response Times**: Track p50, p95, p99 response times
- **Database Query Times**: Monitor slow queries
- **Webhook Processing Time**: Ensure quick responses to Stripe
- **Email Sending Success Rate**: Track email delivery failures
- **Rate Limit Hits**: Monitor how often rate limits are triggered

### Logging Best Practices

```typescript
// ✅ GOOD - Structured logging
const startTime = Date.now();
// ... operation
const duration = Date.now() - startTime;
console.log(`[API] POST /api/waitlist - ${duration}ms - Success: ${success}`);
```

---

## 🔧 Optimization Checklist

When building new features, ask:

### Backend

- ✅ Are database queries optimized? (indexes, lean, projections)
- ✅ Is rate limiting implemented?
- ✅ Are error responses fast and efficient?
- ✅ Is webhook processing non-blocking?
- ✅ Are email operations asynchronous?

### Frontend

- ✅ Are images optimized? (Next.js Image component)
- ✅ Is code split appropriately?
- ✅ Are animations performant? (GSAP, requestAnimationFrame)
- ✅ Are large lists paginated?
- ✅ Are API calls debounced/throttled when appropriate?

### Database

- ✅ Are frequently queried fields indexed?
- ✅ Are queries using appropriate indexes?
- ✅ Are connections pooled efficiently?
- ✅ Are unnecessary fields excluded from queries?

---

## 🎓 Key Learnings

### ✅ What Works:

1. **Use lean() for read operations** - Plain objects are faster
2. **Index frequently queried fields** - Email, timestamps
3. **Async email sending** - Don't block webhook responses
4. **Next.js Image component** - Automatic optimization
5. **GSAP animations** - Smooth and performant
6. **Rate limiting** - Prevents abuse and ensures fair usage

### ❌ What Doesn't Work:

1. **Awaiting email in webhook handler** - Blocks Stripe retries
2. **Fetching full documents unnecessarily** - Use projections
3. **No indexes on query fields** - Slow queries
4. **Synchronous heavy operations** - Blocks event loop
5. **Unoptimized images** - Slow page loads

---

## 📁 Key Files

### Performance-Critical Files:

- `app/api/waitlist/route.ts` - Main API endpoint with rate limiting
- `app/api/webhooks/stripe/route.ts` - Webhook handler (must be fast)
- `app/api/lib/rateLimit.ts` - Rate limiting implementation
- `lib/email.ts` - Email sending (should be async)
- `app/page.tsx` - Home page with animations

---

## 🎯 Success Criteria

**All endpoints should:**

- ✅ Respond in <500ms for simple operations
- ✅ Handle rate limiting appropriately
- ✅ Use database indexes efficiently
- ✅ Return optimized responses
- ✅ Handle errors gracefully

---

**For specific implementation details, see:**

- Setup guide: `SETUP.md`
- Stripe setup: `STRIPE_PRODUCTION_SETUP.md`
- Webhook guide: `WEBHOOK_SETUP_EXPLAINED.md`
- Application context: `.cursor/application-context.md`
