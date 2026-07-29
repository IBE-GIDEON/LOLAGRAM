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

## Keeping Supabase awake

Supabase **Free** projects pause after roughly 7 days without activity, and a
paused project makes signup and checkout fail until someone restores it by hand.
There is no setting that disables this — only a paid plan removes pausing. What
this repo does instead is make sure the project is never idle:

1. Run [supabase/keep-alive.sql](supabase/keep-alive.sql) once. It creates a
   single-row `keep_alive` table with RLS on and no policies, so only the
   service role can touch it.
2. `GET /api/keep-alive` writes a timestamp to that row (falling back to a cheap
   read if the table or service role key is missing).
3. Two independent schedules call it, so one failing does not pause the project:
   - Vercel cron, daily at 06:00 UTC ([vercel.json](vercel.json))
   - GitHub Actions, every second day at 07:15 UTC
     ([.github/workflows/keep-alive.yml](.github/workflows/keep-alive.yml))

Optional: set `CRON_SECRET` in the environment to require a bearer token.
Vercel cron sends it automatically once the variable exists; add the same value
as a `CRON_SECRET` repository secret so the GitHub Action keeps working. Set
`APP_URL` as a repository secret too if the production domain changes.

Caveats worth knowing: this only prevents *inactivity* pausing. It does not help
with a project disabled for exceeding Free tier quotas (database size, egress)
or for billing reasons. GitHub also disables scheduled workflows in a repository
that has had no activity for 60 days — push anything, or hit "Run workflow", to
re-enable it. With real traffic every day, none of this is load-bearing; it is
insurance for quiet stretches.

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
