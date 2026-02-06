# CelebFitLife

**Train with Your Idol. Live.**

A live-streaming fitness platform connecting enthusiasts with celebrity trainers for real-time workout experiences.

## 🛠️ Tech Stack

- **Framework:** Next.js 15.5.3 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4, GSAP (Animations)
- **Database:** Firebase Firestore
- **Payments:** Stripe (Checkout Sessions, Webhooks)
- **Email:** Nodemailer (Gmail SMTP)
- **Package Manager:** `pnpm`

## 📂 Project Structure

- **`app/`**: Next.js App Router.
    - **`api/`**: Backend API routes (Payment, Waitlist, Contact).
    - **`layout.tsx`**: Root layout.
    - **`page.tsx`**: Landing page.
- **`components/`**: React components.
    - **`ui/`**: Reusable UI components (buttons, skeletons).
    - **`seo/`**: SEO components.
- **`lib/`**: Utilities and helpers.
    - **`helpers/`**: API business logic.
    - **`utils/`**: Shared utilities.
    - **`stripe.ts`**: Stripe configuration.
- **`shared/types/`**: Shared TypeScript definitions (Frontend + Backend).

## 🚀 Building and Running

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Lint code
pnpm lint
```

## 📏 Engineering Standards

### TypeScript
- **Strict Typing:** No `any`. Use specific types.
- **Preference:** Use `type` over `interface`.
- **Location:** Shared types in `shared/types/`, component types in `lib/types/`.

### Components
- **Structure:** Keep `page.tsx` lean. Delegate logic to components/helpers.
- **Loading States:** **MANDATORY** specific skeleton loaders for async content. No generic "Loading..." text.
    - Skeletons must match the exact layout of the content.
    - Located in `components/ui/skeletons/`.

### API & Backend
- **Pattern:** Parse Params -> Auth/DB -> Logic -> Response.
- **Logic:** Complex logic (>20 lines) goes to `app/api/lib/helpers/`.
- **Database:** Use `findOne` (Firebase/Firestore) patterns.
- **Webhooks:** Stripe webhooks handle payment status updates (`unpaid` -> `pending` -> `paid`).

### Styling
- **Tailwind CSS:** Utility-first styling.
- **GSAP:** Used for complex animations (ScrollTrigger).

## 🔑 Key Workflows

### Payment System
1.  User enters Waitlist (Email).
2.  Stripe Checkout Session created.
3.  User pays.
4.  Stripe Webhook (`checkout.session.completed`) updates Firestore status to `paid`.
5.  Confirmation email sent.

### Rate Limiting
- implemented in `app/api/lib/rateLimit.ts`.
- 5 error attempts per 15 minutes per IP.

## 📝 Documentation References
- **`README.md`**: General overview and setup.
- **`.cursor/application-context.md`**: Detailed architectural context and business logic.
- **`nextjs-rules.mdc`**: Strict coding standards and rules.
