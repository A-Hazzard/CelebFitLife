# 🔗 Stripe Webhook Setup: Local vs Production

## Understanding Webhooks

A webhook is Stripe's way of notifying your server when events happen (like a payment completing). You need different setups for local development vs production.

---

## 🖥️ Local Development (Your PC)

### Current Setup (What You're Using Now)

You're running Stripe CLI on your PC:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

**How it works:**
- Stripe CLI creates a tunnel from Stripe's servers to your localhost
- When events happen in Stripe, they get forwarded to your local server
- You get a webhook secret (starts with `whsec_`) that you use in `.env.local`

**When to use:**
- ✅ Testing on your local machine
- ✅ Development work
- ✅ Testing before deploying

**To stop it:**
- Just press `Ctrl+C` in the terminal where it's running
- Or close the terminal window

---

## 🌐 Production (Your Live Domain)

### What You Need to Do

Once your app is deployed (e.g., on Vercel at `https://celebfitlife.vercel.app`), you need to:

1. **Create a webhook endpoint in Stripe Dashboard**
   - Go to Stripe Dashboard → Developers → Webhooks
   - Click "+ Add endpoint"
   - Enter your production URL: `https://celebfitlife.vercel.app/api/webhooks/stripe`
   - Select the events you want to listen to
   - Copy the webhook signing secret

2. **Update your environment variables**
   - In your hosting platform (Vercel/Netlify), add the production webhook secret
   - This is different from your local webhook secret

3. **Stop using Stripe CLI**
   - You don't need it anymore for production
   - Only use it when testing locally

---

## 📋 Step-by-Step: Setting Up Production Webhook

### Step 1: Deploy Your App

Make sure your app is deployed and accessible at your domain:
- Example: `https://celebfitlife.vercel.app`
- Or your custom domain: `https://celebfitlife.com`

### Step 2: Create Webhook in Stripe Dashboard

1. **Go to Stripe Dashboard**
   - Log in at [dashboard.stripe.com](https://dashboard.stripe.com)
   - Make sure you're in **Live mode** (toggle in top right)

2. **Navigate to Webhooks**
   - Click **Developers** in the left sidebar
   - Click **Webhooks**

3. **Add New Endpoint**
   - Click **"+ Add endpoint"** button
   - **Endpoint URL**: Enter your production URL
     ```
     https://celebfitlife.vercel.app/api/webhooks/stripe
     ```
     (Replace with your actual domain)

4. **Select Events**
   - Click **"Select events"** or **"Add events"**
   - Check these events:
     - ✅ `checkout.session.completed`
     - ✅ `checkout.session.async_payment_succeeded`
     - ✅ `checkout.session.async_payment_failed`
     - ✅ `charge.refunded`
   - Click **"Add events"**

5. **Get the Signing Secret**
   - After creating, you'll see a **"Signing secret"**
   - It starts with `whsec_`
   - Click **"Reveal"** to see it
   - **⚠️ IMPORTANT: Copy this immediately!** You can only see it once
   - This is your production webhook secret

### Step 3: Add to Production Environment Variables

**For Vercel:**
1. Go to your project on [vercel.com](https://vercel.com)
2. Click **Settings** → **Environment Variables**
3. Add/Update:
   - Variable: `STRIPE_WEBHOOK_SECRET`
   - Value: `whsec_YOUR_PRODUCTION_SECRET_HERE` (the one you just copied)
   - Environment: Select **Production** (and Preview if you want)
4. Click **Save**
5. **Redeploy** your application (important!)

**For Netlify:**
1. Go to your site on [netlify.com](https://netlify.com)
2. Click **Site settings** → **Environment variables**
3. Add the same variable
4. Redeploy

**For other platforms:**
- Follow your platform's documentation for environment variables
- Make sure to set it for the production environment

### Step 4: Test the Production Webhook

1. **Make a test payment** on your live site
2. **Check Stripe Dashboard**:
   - Go to Developers → Webhooks
   - Click on your production webhook endpoint
   - Look at **"Recent events"**
   - You should see `checkout.session.completed` events
   - ✅ Green checkmark = webhook delivered successfully
   - ❌ Red X = webhook failed (check your logs)

3. **Check your server logs** (in Vercel/your hosting platform):
   - Look for webhook processing logs
   - Verify emails are being sent
   - Check database updates

---

## 🔄 Can You Stop Stripe CLI?

### Yes! Here's when:

**✅ You can stop Stripe CLI when:**
- Your app is deployed to production
- Production webhook is set up in Stripe Dashboard
- Production environment variables are configured
- You're not testing locally anymore

**❌ Keep using Stripe CLI when:**
- You're developing locally (`localhost:3000`)
- You want to test webhooks on your PC
- You're making changes and testing before deploying

---

## 🔀 Switching Between Local and Production

### For Local Development:
```env
# .env.local
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... (from stripe listen command)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Run Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### For Production:
```env
# Environment variables in Vercel/Netlify
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_... (from Stripe Dashboard webhook)
NEXT_PUBLIC_APP_URL=https://celebfitlife.vercel.app
```

**No Stripe CLI needed** - webhooks come directly from Stripe to your production URL.

---

## 📊 Summary

| Aspect | Local Development | Production |
|--------|------------------|------------|
| **Webhook URL** | `localhost:3000/api/webhooks/stripe` | `https://yourdomain.com/api/webhooks/stripe` |
| **How it works** | Stripe CLI tunnels to localhost | Stripe sends directly to your domain |
| **Webhook Secret** | From `stripe listen` command | From Stripe Dashboard |
| **Stripe CLI** | ✅ Required | ❌ Not needed |
| **Environment** | `.env.local` | Hosting platform env vars |

---

## ⚠️ Important Notes

1. **Different Secrets**: Your local webhook secret and production webhook secret are **different**. Don't mix them up!

2. **HTTPS Required**: Production webhooks **must** use HTTPS. Stripe won't send to HTTP URLs.

3. **Redeploy After Changes**: After updating environment variables, you **must redeploy** your app for changes to take effect.

4. **Test First**: Always test your production webhook with a small payment before going fully live.

5. **Monitor Webhooks**: Check Stripe Dashboard → Webhooks regularly to ensure they're being delivered successfully.

---

## 🐛 Troubleshooting

### Webhook not receiving events in production:
- ✅ Check webhook URL is correct and accessible
- ✅ Verify HTTPS is working
- ✅ Check environment variables are set correctly
- ✅ Make sure you redeployed after adding env vars
- ✅ Check server logs for errors

### "Webhook signature verification failed":
- ✅ Ensure you're using the correct webhook secret (production secret for production, local secret for local)
- ✅ Verify the secret matches what's in Stripe Dashboard

### Still getting local webhook events in production:
- ✅ Make sure you're using production Stripe keys (`sk_live_...`)
- ✅ Verify production webhook secret is set in your hosting platform
- ✅ Check you're not accidentally using local environment variables

---

## ✅ Quick Checklist

Before going live:
- [ ] App is deployed and accessible via HTTPS
- [ ] Production webhook endpoint created in Stripe Dashboard
- [ ] Production webhook secret copied and added to hosting platform
- [ ] Environment variables updated in hosting platform
- [ ] App redeployed with new environment variables
- [ ] Test payment completed successfully
- [ ] Webhook events showing as delivered in Stripe Dashboard
- [ ] Database updating correctly
- [ ] Emails sending correctly

**You're all set! 🚀**

