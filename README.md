# CelebFitLife
![CelebFitLife Logo](public/og-image.jpg)

CelebFitLife is a live-streaming fitness platform that connects fans with their favorite celebrities and top fitness instructors in real time. Our mission is to make fitness fun, engaging, and interactive—allowing users to work out alongside the stars while enjoying exclusive content and community features.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Folder Structure](#folder-structure)
- [Setup and Installation](#setup-and-installation)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Future Improvements](#future-improvements)

## Features

- **Live Streaming & Interaction:**  
  - Streamers host live workout sessions using Twilio Video.
  - Fans join live streams, participate in real‑time chat, polls, and reactions.
  - Free 1‑minute preview for non‑subscribers, with full access for paid subscribers.

- **Subscription Plans:**  
  - **Basic:** $9.99/month – Access to 1 streamer, live workouts & replays, 1-minute free previews, basic chat access.
  - **Plus:** $19.99/month – Access to 3 streamers, live workouts & replays, exclusive Q&A sessions, priority chat access.
  - **Unlimited:** $29.99/month – Unlimited streamers, exclusive fitness challenges, one-to-one coaching sessions, VIP chat access & badges.
  - 1‑day free trial is available.

- **User Authentication & Registration:**  
  - Multiple sign-in options including Email/Password, Magic Link, Google, and Facebook.
  - Email verification is required before accessing the platform.

- **Payment & Subscription Management:**  
  - Recurring billing via Stripe.
  - Subscription status tracked in Firestore.

- **Moderation & Notifications:**  
  - Moderators can ban/mute users, manage live polls, and enforce chat rules.
  - Streamers can schedule sessions and send notifications to subscribers.

- **Additional Interactive Features:**  
  - Integrated emoji support in chat using **emoji-picker-react**.
  - Responsive and modern UI for an engaging user experience.

## Tech Stack

- **Next.js 15**
- **React 18**
- **TypeScript**
- **Tailwind CSS** (with tailwindcss-animate and tailwind-merge)
- **Firebase** (Authentication & Firestore)
- **Stripe** (for recurring payments)
- **Twilio Video** (for live streaming)
- **Zustand** (for state management)
- **EmailJS** (for contact form handling)
- **emoji-picker-react** (for chat emoji support)

## Folder Structure

```
/CelebFitLife
├── app/                  # Next.js pages and API routes (using App Router)
│   ├── (auth)/          # Authentication-related pages (login, register, reset-password)
│   ├── api/             # API routes (Twilio token, room creation, etc.)
│   ├── dashboard/       # Dashboard for stream management and user interaction
│   ├── features/        # Explore More / Features pages
│   ├── learn-more/      # Informational pages about the platform
│   ├── streaming/       # Live streaming pages (e.g., live/[slug])
│   └── layout.tsx       # Global layout and metadata
├── components/          # Reusable UI components
│   ├── layout/         # Layout components (e.g., Header, Sidebar)
│   │   └── landing/    # Landing-page-specific components (e.g., Header.tsx)
│   └── ui/             # Custom UI elements (Button, Input, etc.)
├── config/             # Global configuration files (Firebase, Twilio, etc.)
├── lib/                # Business logic and utilities
│   ├── models/         # Data models (User, userData)
│   ├── services/       # Service layer (AuthService, ChatService, Twilio, etc.)
│   ├── twilioTrackUtils.ts
│   └── utils.ts
├── store/             # Zustand state management (useAuthStore.ts)
├── types/             # TypeScript type definitions (stream.ts, userData.ts)
└── public/            # Static assets (images, icons, etc.)
```

## Setup and Installation

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/A-Hazzard/CelebFitLife.git
   cd CelebFitLife
   ```

2. **Install Dependencies:**
   ```bash
   pnpm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the project root with the following variables (update with your actual values):
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_API_KEY_SID=your_twilio_api_key_sid
   TWILIO_API_KEY_SECRET=your_twilio_api_key_secret
   NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_emailjs_service_id
   NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_emailjs_template_id
   NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_emailjs_public_key
   ```

4. **Run the Development Server:**
   ```bash
   pnpm dev
   ```
   Open http://localhost:3000 in your browser.

## Environment Variables

The application relies on several environment variables for Firebase, Twilio, and EmailJS. Ensure the following are set in your `.env` file:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_API_KEY_SID`
- `TWILIO_API_KEY_SECRET`
- `NEXT_PUBLIC_EMAILJS_SERVICE_ID`
- `NEXT_PUBLIC_EMAILJS_TEMPLATE_ID`
- `NEXT_PUBLIC_EMAILJS_PUBLIC_KEY`

## Scripts

- **Development:**
  ```bash
  pnpm dev
  ```

- **Build:**
  ```bash
  pnpm build
  ```

- **Start:**
  ```bash
  pnpm start
  ```

- **Lint:**
  ```bash
  pnpm lint
  ```

## Future Improvements

- **Enhanced Moderation Tools:**
  - Implement advanced chat moderation features such as auto-filtering and machine learning-based content analysis.

- **Stream Recording & Replays:**
  - Integrate Twilio recording functionality to allow users to access past sessions and workout replays.

- **Real-Time Analytics:**
  - Develop dashboards for streamers to monitor live engagement metrics and viewer statistics.

- **Push Notifications:**
  - Implement push notifications for upcoming streams, session reminders, and real-time updates.

- **Advanced Payment Features:**
  - Enhance Stripe integration to handle upgrades, downgrades, and cancellations more gracefully.

- **Performance Optimizations:**
  - Further optimize database queries and streaming performance as the user base scales.
