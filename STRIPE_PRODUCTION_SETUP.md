# 🚀 Stripe Test to Production Migration Guide

## Overview
This guide will help you switch from Stripe test mode to live/production mode.

## ⚠️ Important Notes Before Starting

1. **Test thoroughly in test mode first** - Make sure everything works perfectly before going live
2. **Real money** - Production mode processes real payments
3. **No refunds for mistakes** - Double-check all settings
4. **Webhook endpoint** - Must be publicly accessible (HTTPS required)

---

## Step 1: Get Your Production Stripe Keys

1. **Log into Stripe Dashboard**
   - Go to [dashboard.stripe.com](https://dashboard.stripe.com)
   - Make sure you're logged into your account

2. **Switch to Live Mode**
   - In the top right corner, toggle from "Test mode" to **"Live mode"**
   - You'll see a warning - click "Activate live mode" if prompted

3. **Get Your Live API Keys**
   - Go to **Developers → API keys**
   - You'll see two keys:
     - **Publishable key** (starts with `pk_live_...`) - Not needed for your setup
     - **Secret key** (starts with `sk_live_...`) - **This is what you need**
   - Click "Reveal test key" or "Reveal live key" to see the full key
   - Copy the **Secret key** (starts with `sk_live_`)

---

## Step 2: Create Production Product & Price

1. **Go to Products**
   - In Stripe Dashboard (Live mode), go to **Products**
   - Click **"+ Add product"**

2. **Create Product**
   - **Name**: "CelebFitLife Waitlist Access" (or your preferred name)
   - **Description**: "Join the exclusive waitlist for live celebrity fitness sessions"
   - **Pricing**: 
     - Set to **$1.00 USD** (or your desired amount)
     - Billing: **One time**
   - Click **"Save product"**

3. **Copy Price ID**
   - After creating, you'll see a **Price ID** (starts with `price_`)
   - Copy this ID - you'll need it for `STRIPE_WAITLIST_PRICE_ID`

**Note**: If you don't set `STRIPE_WAITLIST_PRICE_ID`, the app will auto-create it, but it's better to create it manually in production.

---

## Step 3: Set Up Production Webhook

⚠️ **CRITICAL**: This is the most important step for production!

1. **Get Your Production URL**
   - Your app must be deployed and accessible via HTTPS
   - Example: `https://celebfitlife.com` or `https://www.celebfitlife.com`
   - The webhook endpoint will be: `https://yourdomain.com/api/webhooks/stripe`

2. **Create Webhook Endpoint in Stripe**
   - In Stripe Dashboard (Live mode), go to **Developers → Webhooks**
   - Click **"+ Add endpoint"**
   - **Endpoint URL**: Enter `https://yourdomain.com/api/webhooks/stripe`
     - Replace `yourdomain.com` with your actual domain
   - **Description**: "CelebFitLife Production Webhook"
   - Click **"Add endpoint"**

3. **Select Events to Listen To**
   - Click on your newly created webhook endpoint
   - Click **"Select events"** or **"Add events"**
   - Select these events:
     - ✅ `checkout.session.completed`
     - ✅ `checkout.session.async_payment_succeeded`
     - ✅ `checkout.session.async_payment_failed`
     - ✅ `charge.refunded`
   - Click **"Add events"**

4. **Get Webhook Signing Secret**
   - After creating the endpoint, you'll see a **"Signing secret"**
   - It starts with `whsec_`
   - Click **"Reveal"** to see the full secret
   - **Copy this immediately** - you can only see it once!
   - This is your `STRIPE_WEBHOOK_SECRET` for production

---

## Step 4: Update Environment Variables

### For Local Development (Testing Production)

Update your `.env.local` file:

```env
# MongoDB Connection (same as before)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/celebfitlife

# Stripe Production Keys
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_PRODUCTION_WEBHOOK_SECRET_HERE
STRIPE_WAITLIST_PRICE_ID=price_YOUR_PRODUCTION_PRICE_ID_HERE

# Gmail Configuration (same as before)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password

# Production App URL
NEXT_PUBLIC_APP_URL=https://celebfitlife.com
```

### For Production Deployment (Vercel/Netlify/etc.)

Add these same environment variables in your hosting platform:

**Vercel:**
1. Go to your project → Settings → Environment Variables
2. Add each variable:
   - `STRIPE_SECRET_KEY` = `sk_live_...`
   - `STRIPE_WEBHOOK_SECRET` = `whsec_...`
   - `STRIPE_WAITLIST_PRICE_ID` = `price_...`
   - `MONGODB_URI` = `mongodb+srv://...`
   - `GMAIL_USER` = `your-email@gmail.com`
   - `GMAIL_APP_PASSWORD` = `your-app-password`
   - `NEXT_PUBLIC_APP_URL` = `https://yourdomain.com`
3. Make sure to select **"Production"** environment for all
4. Click **"Save"**
5. **Redeploy** your application

**Netlify:**
1. Go to Site settings → Environment variables
2. Add all the same variables
3. Redeploy

**Other Platforms:**
- Follow your platform's documentation for adding environment variables
- Make sure they're set for production environment

---

## Step 5: Test Production Setup

### ⚠️ IMPORTANT: Test with Small Amount First!

1. **Test Payment Flow**
   - Use a real credit card (start with a small test payment)
   - Complete the checkout process
   - Verify payment appears in Stripe Dashboard → Payments

2. **Verify Webhook is Working**
   - Go to Stripe Dashboard → Developers → Webhooks
   - Click on your production webhook endpoint
   - Check the **"Recent events"** section
   - You should see `checkout.session.completed` events
   - Green checkmark = successful delivery
   - Red X = failed (check your endpoint URL and server logs)

3. **Check Database**
   - Verify the waitlist entry is marked as `paid`
   - Check that `stripeCheckoutId` and `stripeCustomerId` are set

4. **Verify Email**
   - Check that confirmation email was sent to the customer
   - Check your server logs for email sending status

---

## Step 6: Monitor & Troubleshoot

### Check Webhook Logs

1. **In Stripe Dashboard**
   - Go to Developers → Webhooks
   - Click on your endpoint
   - View "Recent events" to see delivery status
   - Click on any event to see request/response details

2. **Common Issues**

   **Webhook not receiving events:**
   - ✅ Check endpoint URL is correct and accessible
   - ✅ Verify HTTPS is working (Stripe requires HTTPS)
   - ✅ Check server logs for errors
   - ✅ Verify webhook secret matches

   **"Webhook signature verification failed":**
   - ✅ Ensure `STRIPE_WEBHOOK_SECRET` matches the signing secret from Stripe
   - ✅ Make sure you're using the production webhook secret, not test

   **Payments not updating in database:**
   - ✅ Check webhook is receiving events (see webhook logs)
   - ✅ Check server logs for errors
   - ✅ Verify MongoDB connection is working
   - ✅ Check webhook endpoint code is deployed correctly

---

## Step 7: Security Checklist

Before going fully live, ensure:

- [ ] All environment variables are set correctly
- [ ] Webhook endpoint is using HTTPS
- [ ] Webhook secret is kept secure (never commit to git)
- [ ] Test payment completed successfully
- [ ] Email confirmation is working
- [ ] Database is updating correctly
- [ ] Error logging is in place
- [ ] Rate limiting is working
- [ ] You have monitoring/alerts set up

---

## Quick Reference: Environment Variables

| Variable | Test Mode | Production Mode |
|----------|-----------|-----------------|
| `STRIPE_SECRET_KEY` | `sk_test_...` | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (from `stripe listen`) | `whsec_...` (from Stripe Dashboard) |
| `STRIPE_WAITLIST_PRICE_ID` | `price_...` (test) | `price_...` (live) |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | `https://yourdomain.com` |

---

## Switching Back to Test Mode

If you need to switch back to test mode:

1. In Stripe Dashboard, toggle back to "Test mode"
2. Update `.env.local` with test keys
3. Use test webhook secret (from `stripe listen` command)
4. Restart your server

---

## Support

- **Stripe Documentation**: [stripe.com/docs](https://stripe.com/docs)
- **Stripe Support**: [support.stripe.com](https://support.stripe.com)
- **Webhook Testing**: Use Stripe Dashboard → Webhooks → Recent events

---

## Final Checklist

Before accepting real payments:

- [ ] Production Stripe keys are set
- [ ] Production webhook is configured and tested
- [ ] Webhook endpoint is accessible via HTTPS
- [ ] Test payment completed successfully
- [ ] Email confirmation working
- [ ] Database updating correctly
- [ ] All environment variables set in production
- [ ] Application redeployed with new variables
- [ ] Monitoring/alerting set up

**Good luck! 🚀**

