# Freelance Fix Architecture

Welcome to **Freelance Fix**, a localized service marketplace divided into a rigorous 3-Tier Architecture cleanly separated by folders.

## Project Description

The "Freelance Fix" project addresses the lack of a localized, accessible platform for freelancers and small businesses in the Rio Grande Valley. While global platforms exist, they often overlook the specific needs and community trust of local markets. Freelance Fix provides a structured marketplace where local professionals, such as graphic designers and bakery owners, can connect through a "Gig-based" model. The system allows freelancers to list services and clients to browse, purchase, and review those services in a secure environment.

## Folder Overview

### 1. `/frontend` (Interface Module)
Powered by Next.js, NextAuth.js, and Tailwind CSS (v4).
- **Purpose**: Handles rendering, client-side routing, and displaying the marketplace interfaces. Authentication is managed via NextAuth.js using a JWT session strategy.
- **Environment Variables** — create a `.env.local` file inside `frontend`:
  ```
  NEXTAUTH_SECRET=your_random_secret
  NEXTAUTH_URL=http://localhost:3000
  API_URL=http://localhost:3001
  NEXT_PUBLIC_API_URL=http://localhost:3001
  ```
- **Run Instructions**: 
  1. Open a terminal inside `frontend`
  2. Run `npm install`
  3. Create `.env.local` and fill in the variables above
  4. Run `npm run dev` to access the App at `http://localhost:3000`

### 2. `/backend` (Processing Module)
Built on lightweight Node.js/Express scaffolding with Prisma ORM.
- **Purpose**: A strictly logical Middle Tier meant to validate User inputs and shield the DataStore. It acts entirely independently of the Interface layer. Handles user registration and login, issuing sessions via NextAuth on the frontend.
- **Structure**:
  - `server.js`: The root server entry file.
  - `/src/routes`: Where endpoint path matching lives.
  - `/src/controllers`: Where the actual business logic & DB execution runs.
  - `/prisma/schema.prisma`: Prisma schema — maps all 13 DB tables and enums.
  - `/openapi.yaml`: The official API route specifications.
- **Auth Endpoints**:
  - `POST /api/auth/register` — creates a new user (email + password)
  - `POST /api/auth/login` — validates credentials, returns user info to NextAuth
- **Environment Variables** — create a `.env` file inside `backend`:
  ```
  DATABASE_URL=your_supabase_transaction_pooler_url
  DIRECT_URL=your_supabase_direct_connection_url
  ```
- **Run Instructions**: 
  1. Open a terminal inside `backend`
  2. Run `npm install`
  3. Create `.env` and fill in your Supabase connection strings
  4. Run `npm run db:generate` to generate the Prisma client
  5. Run `npm run dev` to access the processing node at `http://localhost:3001`
- **Prisma Scripts**:
  - `npm run db:generate` — regenerate Prisma client after schema changes
  - `npm run db:push` — push schema changes directly to the DB (dev only)
  - `npm run db:studio` — open Prisma Studio to browse data visually

### 3. DataStore (Supabase & PostgreSQL)
- Housed natively in the Cloud via Supabase. **Note**: Supabase Auth is not used — authentication is handled by NextAuth.js with bcrypt password hashing in the backend.
- Migration files can be found in `backend/supabase/migrations/`. Run them in order against your hosted Supabase instance:
  - `01_initial_schema.sql` — full DB schema
  - `02_switch_to_jwt_auth.sql` — drops Supabase Auth FK, adds `password_hash`, disables RLS
- Prisma connects via two URLs (both found in your Supabase project settings under **Connect → ORM**):
  - `DATABASE_URL` — transaction pooler (port 6543), used for all queries
  - `DIRECT_URL` — direct connection (port 5432), used by Prisma migrations
