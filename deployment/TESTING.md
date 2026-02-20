# Local Testing Guide for StatWoX

This guide explains how to run StatWoX locally while connected to your free-tier Supabase and Pusher instances.

## Prerequisites

1.  **Supabase Account**: Create a project at [supabase.com](https://supabase.com).
2.  **Pusher Account**: Create a Channels app at [pusher.com](https://pusher.com).

## Step 1: Configure Environment Variables

1.  Copy the example environment file:
    ```bash
    cp deployment/env-templates/.env.example .env.local
    ```

2.  **Supabase Settings**:
    -   Go to your Supabase Project Settings -> API.
    -   Copy `Project URL` to `NEXT_PUBLIC_SUPABASE_URL`.
    -   Copy `anon` public key to `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
    -   Copy `service_role` secret key to `SUPABASE_SERVICE_ROLE_KEY`.

3.  **Database Connection**:
    -   Go to Supabase Project Settings -> Database -> Connection String -> URI.
    -   Copy the connection string (replace `[YOUR-PASSWORD]` with your actual db password).
    -   Paste it into `DATABASE_URL` and `DIRECT_URL` in `.env.local`.
    -   **Important**: Add `?pgbouncer=true` to `DATABASE_URL` if using the transaction pooler (recommended), but keep `DIRECT_URL` pointing directly to port 5432.

4.  **Pusher Settings**:
    -   Go to your Pusher App -> App Keys.
    -   Copy `app_id`, `key`, `secret`, and `cluster` to the corresponding variables in `.env.local`.

## Step 2: Push Database Schema

Since we switched to Prisma with PostgreSQL, we need to push our schema to the remote Supabase database.

Run this command in your terminal:

```bash
bun run db:push
```

*Note: This will create all the tables defined in `prisma/schema.postgres.prisma` in your Supabase project.*

## Step 3: Seed Database (Optional)

If you have a seed script (defined in `prisma/seed.ts`), you can run:

```bash
bun run db:seed
```

## Step 4: Run Development Server

Start the local server:

```bash
bun run dev
```

Visit `http://localhost:3000`.

## Step 5: Verify Functionality

1.  **Auth**: Try signing up with an email/password. You should see a new user in your Supabase Auth dashboard and a new row in the `public.profiles` table.
2.  **Real-time**: Open the app in two different browsers (or an Incognito window).
    -   Log in as different users (if possible) or use the public features.
    -   Perform an action that triggers a notification or update (like submitting a survey response).
    -   Switch to the other window and verify the update appears instantly without refreshing.

## Troubleshooting

-   **Database Connection Errors**: Double-check your database password. If it contains special characters, make sure they are URL-encoded.
-   **Pusher Errors**: Check the browser console. If you see 404s on `/api/pusher/auth`, ensure you are logged in, as private channels require authentication.
