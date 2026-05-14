# LOLAGRAM Production Launch

Use this checklist before moving LOLAGRAM from local/demo testing to real users.

## 1. Environment Variables

Set these in Vercel production:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `NEXT_PUBLIC_APP_URL`

Optional:

- `NEXT_PUBLIC_ENABLE_DEMO_MODE=false`

For launch, leave demo mode off. The app now refuses fake orders, fake storage, and fake profile behavior in production.

## 2. Supabase Setup

Run [supabase/schema.sql](/C:/Users/HOME%20PC/Documents/LOLAGRAM/supabase/schema.sql).

Important launch checks:

- `users`, `vendor_profiles`, `products`, `orders`, `reviews`, and `push_subscriptions` tables exist
- `products.photo_urls` exists and stores product galleries as `jsonb`
- `store-assets` bucket exists and is public-read
- RLS policies are enabled
- storage upload policy allows authenticated users to upload store assets

## 3. Email + Password Auth

In Supabase Auth:

- enable email auth
- decide whether you want email confirmation on or off for launch day
- keep phone number required in your app signup flow
- use the same email for sign in and forgot-password links

Before launch, verify:

- sign up with email and password works
- returning login works
- phone number is collected during signup
- forgot password sends a reset link to the account email
- reset password opens `/reset-password` and updates the password successfully
- buyer to seller upgrade works
- session persists in the installed PWA

## 4. Order and Payment Setup

In seller onboarding or store edit:

- add WhatsApp number
- choose whether to rely on `Pay on Delivery` only or also enable `Pay Vendor Directly`
- if using direct payment, fill in:
  - bank name
  - account name
  - account number
  - optional payment note for buyers

Before launch, verify:

- buyers can place an order without paying the platform first
- `Pay on Delivery` works from cart to order confirmation
- `Pay Vendor Directly` only appears for sellers who added payment details
- sellers can confirm an order, mark direct payment received, dispatch, and deliver

## 5. Push Notifications

Generate live VAPID keys and add them to Vercel.

Before launch, verify:

- browser asks for notification permission
- subscriptions save into `push_subscriptions`
- seller gets `New Order on LOLAGRAM`
- buyer gets order status updates

## 6. Product Gallery

The app now supports:

- multiple product photos per item
- seller upload of up to 6 images per product
- buyer gallery browsing inside product details

Before launch, test:

- create product with 1 image
- create product with 4 to 6 images
- edit product and remove one image
- verify search, product grid, and store page all use the correct cover image

## 7. Storage and Images

Use compressed product images only. The app already compresses uploads client-side to max width/height 800px and ~1MB target.

Before launch, confirm:

- Supabase storage usage is monitored
- upload permissions work on mobile devices
- public image URLs load quickly on 4G

## 8. App Behavior for 500 Users

Recommended minimum production readiness:

- connect Vercel project to `main`
- enable Vercel Analytics and runtime logs
- monitor Supabase database usage, auth usage, and storage bandwidth
- set up one support WhatsApp number for launch-day issues
- keep one admin account ready to verify seller onboarding issues quickly

Operational checks:

- test buyer flow from search to order placement
- test seller flow from onboarding to order status update
- test offline order queue once on Android
- test add-to-home-screen install on Android Chrome
- test light mode and dark mode on a real phone

## 9. Launch-Day Runbook

Before opening onboarding:

1. Deploy latest `main` to Vercel.
2. Confirm env vars in production.
3. Run one real buyer order.
4. Confirm seller sees the order.
5. Confirm product gallery, cart removal, and order placement all work on mobile.

During launch:

1. Watch Vercel logs.
2. Watch Supabase auth and database dashboards.
3. Keep a support person available for store onboarding issues.

## 10. Nice-to-Have Next

After the first launch wave, prioritize:

- seller image reordering for product galleries
- image deletion from Supabase storage when product images are removed
- vendor and product analytics dashboards
- server-side search ranking improvements
- rate limiting for auth and order endpoints
