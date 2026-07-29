# GLOWGRAM

GLOWGRAM is a mobile-first Nigerian marketplace built with Next.js 14, TypeScript, Tailwind CSS, Supabase, and Web Push. It is designed to feel like WhatsApp on the vendor discovery side, with premium Instagram-style store pages and seller tooling in the same app.

## Features

- WhatsApp-style vendor discovery feed with search and pagination
- Single app for buyers and sellers with role switching
- Two-field signup (email + password) at `/signup`, with `/login` and `?next=` redirects
- Phone number collected at first checkout instead of at signup
- Vendor store pages with product grid, order-first cart flow, and reviews
- Buyer and seller orders views
- Seller onboarding and product management
- PWA manifest, install prompt support, service worker, offline banner, and order sync queue
- Direct-to-vendor payment flow with optional pay-on-delivery
- Supabase schema and Row Level Security policies
- Responsive: phone layout with bottom nav, desktop storefront with top nav from `lg` up

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` from `.env.example`.
3. Add your Supabase and VAPID credentials.
4. Run the app:

```bash
npm run dev
```

## Supabase

Apply [supabase/schema.sql](supabase/schema.sql) in your Supabase SQL editor. The schema includes enums, tables, indexes, triggers, storage buckets, and RLS policies for buyers, sellers, and push subscriptions.

### Required migration for the simplified signup

If your project was created from an older copy of the schema, run
[supabase/signup-simplify.sql](supabase/signup-simplify.sql) once. It:

1. makes `public.users.phone` optional,
2. converts blank phone strings to `NULL` (blank strings collide on the unique
   index the moment two people sign up without a number),
3. restores `handle_new_user` as a non-blocking trigger so every auth user
   always gets a profile row.

Without it, signup fails for the second user who joins without a phone number.

## Signup flow

`POST /api/auth/signup` takes `{ email, password }` and optional
`{ fullName, phone, accountType }`.

- With `SUPABASE_SERVICE_ROLE_KEY` set, it creates a pre-confirmed user, writes
  the profile row with the service role, signs them in server-side, and returns
  the session — the browser makes one round trip.
- Without that key it falls back to the public `auth.signUp` API instead of
  failing, and reports `needsEmailConfirmation` when Supabase requires it.
- Requests are throttled per IP (10/minute per instance) and every Postgres
  error is mapped to human copy before it reaches a shopper.

The display name is derived from the email handle and the phone number is asked
for at first checkout, where the seller actually needs it.

## Banner imagery

Home page hero and category art lives in `public/banners` (Pexels licence: free
for commercial use, no attribution required). Swap the files and keep the names,
or edit [src/lib/banners.ts](src/lib/banners.ts) to change copy and links.

## Launch

Use [PRODUCTION-LAUNCH.md](PRODUCTION-LAUNCH.md) before onboarding real users. It covers:

- live environment variables
- email/password auth setup and phone collection at checkout
- vendor-direct payment details and pay-on-delivery setup
- storage and multi-image product uploads
- push notifications
- launch checks for the first 500 users
