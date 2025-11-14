# CelebFitLife Payment Setup Guide

## 🔐 Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/celebfitlife

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... # Get from Stripe Dashboard
STRIPE_WEBHOOK_SECRET=whsec_... # Get from Stripe Webhook settings
STRIPE_WAITLIST_PRICE_ID=price_... # Optional - will auto-create if not set

# Gmail Configuration (for sending confirmation emails)
GMAIL_USER=your-email@gmail.com # Your Gmail address
GMAIL_APP_PASSWORD=your-app-password # Gmail App Password (not regular password)

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000 # Your app URL
```

## 📋 Setup Steps

### 1. MongoDB Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Get your connection string
4. Add it to `.env.local` as `MONGODB_URI`

### 2. Stripe Setup

#### A. Create Stripe Account
1. Sign up at [stripe.com](https://stripe.com)
2. Get your **Secret Key** from Dashboard → Developers → API keys
3. Add to `.env.local` as `STRIPE_SECRET_KEY`

#### B. Create Product & Price (Optional)
If you want to use a specific price ID:

1. Go to Stripe Dashboard → Products
2. Create a new product: "CelebFitLife Waitlist Access"
3. Set price to **$1.00 USD**
4. Copy the Price ID (starts with `price_`)
5. Add to `.env.local` as `STRIPE_WAITLIST_PRICE_ID`

**Note:** If you don't set this, the app will automatically create the product and price on first use.

#### C. Setup Webhook (IMPORTANT for Production)

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Set endpoint URL to: `https://yourdomain.com/api/webhooks/stripe`
4. Select events to listen to:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
   - `charge.refunded`
5. Copy the **Signing secret** (starts with `whsec_`)
6. Add to `.env.local` as `STRIPE_WEBHOOK_SECRET`

#### D. Test Webhook Locally (Development)

For local development, use Stripe CLI:

```bash
# Install Stripe CLI
# macOS: brew install stripe/stripe-cli/stripe
# Windows: Download from https://github.com/stripe/stripe-cli/releases

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

This will give you a webhook secret starting with `whsec_` - use this in your `.env.local` for local testing.

### 3. Gmail Setup (for Confirmation Emails)

1. **Enable 2-Factor Authentication** on your Gmail account
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable 2-Step Verification

2. **Generate App Password**
   - Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and "Other (Custom name)"
   - Enter "CelebFitLife" as the name
   - Click "Generate"
   - Copy the 16-character password (no spaces)

3. **Add to `.env.local`**
   ```env
   GMAIL_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=your-16-char-app-password
   ```

**Note:** Use your Gmail address and the App Password (not your regular Gmail password).

### 4. Run the Application

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev
```

## 🔒 Security Features Implemented

✅ **Rate Limiting**: 5 requests per 15 minutes per IP  
✅ **Email Validation**: Regex pattern matching  
✅ **Input Sanitization**: Trim and lowercase emails  
✅ **Webhook Signature Verification**: Prevents fake webhook calls  
✅ **Database Validation**: Mongoose schema validation  
✅ **Error Handling**: Comprehensive try-catch blocks  
✅ **Type Safety**: Full TypeScript support  

## 🧪 Testing

### Test the Flow

1. **Join Waitlist**
   ```bash
   curl -X POST http://localhost:3000/api/waitlist \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com"}'
   ```

2. **Complete Payment**
   - Use Stripe test card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any 3-digit CVC

3. **Verify in Database**
   - Check MongoDB to see entry marked as `paid`
   - Verify `stripeCheckoutId` and `stripeCustomerId` are set

### Test Webhook Locally

```bash
# In one terminal, forward webhooks
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# In another terminal, trigger test event
stripe trigger checkout.session.completed
```

## 📊 Payment Status Flow

```
unpaid → pending → paid ✅
              ↓
           failed ❌
              ↓
         refunded ↩️
```

## 🚨 Important Notes

1. **Webhook Secret**: Never commit your webhook secret to git
2. **Stripe Keys**: Use test keys for development, live keys for production
3. **Rate Limiting**: Current implementation is in-memory. For production, use Redis
4. **Database**: Ensure MongoDB connection is secure (use connection string with credentials)

## 🐛 Troubleshooting

### "Payment system not configured"
- Check `STRIPE_SECRET_KEY` is set in `.env.local`
- Restart your dev server after adding env variables

### "Webhook signature verification failed"
- Ensure `STRIPE_WEBHOOK_SECRET` matches your webhook endpoint secret
- For local dev, use the secret from `stripe listen` command

### "Email already exists"
- User already signed up
- Check database for existing entry

### Rate limit errors
- Wait 15 minutes or clear the rate limit store (restart server)

## 📧 Email Configuration

Confirmation emails are automatically sent when users successfully join the waitlist. The system uses Gmail SMTP with App Passwords for secure authentication.

**Email Features:**
- ✅ Welcome email sent on successful payment
- ✅ HTML email templates with branding
- ✅ Plain text fallback
- ✅ Error handling (won't fail webhook if email fails)

## 📝 Next Steps

- [x] Set up email notifications (Gmail with Nodemailer)
- [ ] Add admin dashboard to view waitlist
- [ ] Implement Redis for production rate limiting
- [ ] Add analytics tracking
- [ ] Set up monitoring and error tracking (Sentry)

