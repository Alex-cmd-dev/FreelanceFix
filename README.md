# Freelance Fix Architecture

Welcome to **Freelance Fix**, a localized service marketplace divided into a rigorous 3-Tier Architecture cleanly separated by folders.

## Project Description

The "Freelance Fix" project addresses the lack of a localized, accessible platform for freelancers and small businesses in the Rio Grande Valley. While global platforms exist, they often overlook the specific needs and community trust of local markets. Freelance Fix provides a structured marketplace where local professionals, such as graphic designers and bakery owners, can connect through a "Gig-based" model. The system allows freelancers to list services and clients to browse, purchase, and review those services in a secure environment.

## Folder Overview

### 1. `/frontend` (Interface Module)
Powered by Next.js and Tailwind CSS (v4).
- **Purpose**: Handles rendering, client-side routing, and displaying the marketplace interfaces.
- **Run Instructions**: 
  1. Open a terminal inside `frontend`
  2. Run `npm install`
  3. Run `npm run dev` to access the App at `http://localhost:3000`

### 2. `/backend` (Processing Module)
Built on lightweight Node.js/Express scaffolding.
- **Purpose**: A strictly logical Middle Tier meant to validate User inputs and shield the DataStore. It acts entirely independently of the Interface layer.
- **Structure**:
  - `server.js`: The root server entry file.
  - `/src/routes`: Where endpoint path matching lives.
  - `/src/controllers`: Where the actual business logic & DB execution runs.
  - `/openapi.yaml`: The official API route specifications.
- **Run Instructions**: 
  1. Open a terminal inside `backend`
  2. Run `npm install`
  3. Run `npm run dev` to access the processing node at `http://localhost:3001`

### 3. DataStore (Supabase & PostgreSQL)
- Housed natively in the Cloud via Supabase.
- The blueprint `01_initial_schema.sql` can be found safely documented within `backend/supabase/migrations/` so the backend developers can control constraints. Paste these commands in your hosted Supabase instance.
