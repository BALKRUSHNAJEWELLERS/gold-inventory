# Deployment Guide: Jewelry ERP (Next.js 15 on Vercel)

This application is optimized for deployment on Vercel for the frontend/backend (Next.js App Router) and Supabase for the PostgreSQL database.

## Prerequisites
1. A GitHub/GitLab/Bitbucket repository containing this codebase.
2. A Vercel Account.
3. A Supabase Account.

## Step 1: Database Setup (Supabase)
1. Create a new project in Supabase.
2. Go to **Project Settings -> Database** and copy the Connection String (URI).
3. Ensure you have the password.

## Step 2: Vercel Deployment
1. Import your Git repository into Vercel.
2. In the "Configure Project" step, open the **Environment Variables** section.
3. Add the following environment variables:
   - `DATABASE_URL`: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true`
   - `AUTH_SECRET`: Generate a random 32-character string (e.g., `openssl rand -base64 32`).
   - `NEXTAUTH_URL`: The production domain name (e.g., `https://my-jewelry-erp.vercel.app`).
4. Click **Deploy**. Vercel will automatically detect Next.js and run `npm run build`.

## Step 3: Database Migration
Since the Vercel build environment doesn't have direct access to your local dev setup, you need to migrate the database schema to Supabase.
1. On your local machine, ensure `.env` has the correct `DATABASE_URL`.
2. Run `npx prisma db push` or `npx prisma migrate deploy` to create the tables in Supabase.
3. Run your database seed script to create the Initial Branch and Owner Admin User.

## Production Security Checklist
- [ ] **Auth Secret**: Ensure `AUTH_SECRET` is complex and stored securely in Vercel.
- [ ] **Row Level Security (RLS)**: If using Supabase directly from the client (not the case here, as we use Prisma via Server Actions), ensure RLS is enabled.
- [ ] **HTTPS**: Vercel enforces HTTPS by default.
- [ ] **Database Connection Pooling**: Ensure `pgbouncer=true` is appended to the connection string to handle serverless connection spikes.
- [ ] **Rate Limiting**: Implement Vercel KV for rate limiting if the app goes public.
- [ ] **Backups**: Enable Point-In-Time-Recovery (PITR) in Supabase settings.

## Performance Checklist
- [ ] Vercel Edge Caching is automatically applied to static routes.
- [ ] Images should use the Next.js `<Image />` component for automatic WebP conversion and optimization.
- [ ] Database indexes are already applied via the Prisma schema for `branchId` and `code` fields.
