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
- [License](#license)

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

