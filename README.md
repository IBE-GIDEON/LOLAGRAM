# LOLAGRAM

LOLAGRAM is a mobile-first Nigerian marketplace built with Next.js 14, TypeScript, Tailwind CSS, Supabase, Paystack, and Web Push. It is designed to feel like WhatsApp on the vendor discovery side, with premium Instagram-style store pages and seller tooling in the same app.

## Features

- WhatsApp-style vendor discovery feed with search and pagination
- Single app for buyers and sellers with role switching
- Phone-plus-password auth with recovery email for password reset
- Vendor store pages with product grid, cart, checkout CTA, and reviews
- Buyer and seller orders views
- Seller onboarding and product management
- PWA manifest, install prompt support, service worker, offline banner, and order sync queue
- Paystack initialization and webhook route handlers
- Supabase schema and Row Level Security policies

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` from `.env.example`.
3. Add your Supabase, Paystack, and VAPID credentials.
4. Run the app:

```bash
npm run dev
```

## Supabase

Apply [supabase/schema.sql](/C:/Users/HOME%20PC/Documents/LOLAGRAM/supabase/schema.sql) in your Supabase SQL editor. The schema includes enums, tables, indexes, triggers, storage buckets, and RLS policies for buyers, sellers, and push subscriptions.

## Launch

Use [PRODUCTION-LAUNCH.md](/C:/Users/HOME%20PC/Documents/LOLAGRAM/PRODUCTION-LAUNCH.md) before onboarding real users. It covers:

- live environment variables
- phone auth and OTP setup
- Paystack webhook and production payments
- storage and multi-image product uploads
- push notifications
- launch checks for the first 500 users
