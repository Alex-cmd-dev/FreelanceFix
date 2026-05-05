# Backend Endpoints Branch

This branch implements all the API endpoints defined in `backend/openapi.yaml`. Before this, only `/api/auth/register` and `/api/auth/login` existed.

## What was added

### New files

**Middleware**
- `backend/src/middleware/auth.js` — JWT verification middleware + token signing helper. Protected routes pull the user from `Bearer` tokens.

**Controllers**
- `backend/src/controllers/categoryController.js`
- `backend/src/controllers/userController.js` — profile + freelancer search
- `backend/src/controllers/gigController.js` — browse/view/create/delete gigs + packages
- `backend/src/controllers/orderController.js` — orders, status updates, reviews
- `backend/src/controllers/briefController.js` — briefs + offers
- `backend/src/controllers/messageController.js`

**Routes**
- `backend/src/routes/categoryRoutes.js`
- `backend/src/routes/userRoutes.js`
- `backend/src/routes/freelancerRoutes.js`
- `backend/src/routes/gigRoutes.js`
- `backend/src/routes/orderRoutes.js`
- `backend/src/routes/briefRoutes.js`
- `backend/src/routes/messageRoutes.js`

**Database seed**
- `backend/prisma/seed.js` — populates 5 categories with 4 subcategories each, plus a demo freelancer with a sample gig and a demo client. Required so the deployed app has data for the grader to retrieve.

### Modified files

- `backend/server.js` — wires up all the new route files
- `backend/src/controllers/authController.js` — login and register now return a JWT token (other routes need it for `Authorization: Bearer <token>`)

## What's different from the OpenAPI spec

- **Added `DELETE /api/gigs/:gigId`** — the spec doesn't have a delete endpoint anywhere, but the project rubric requires demonstrating a tuple deletion. Only the gig's owning freelancer can delete it.
- **Login now returns a `token`** — the spec implies bearer JWT auth for protected routes but the original `login` only returned user info. Now it returns `{ id, email, name, token }`.
- **`PUT /api/users/profile`** — extended slightly. Beyond updating bio/portfolio/company, it will create the freelancer or client row on first call (the original `register` only created a `User`, with no role attached).

## Setup

```bash
cd backend
npm install
# bcryptjs, cors, dotenv, express, jsonwebtoken, @prisma/client are already in package.json

# Make sure .env has DATABASE_URL, DIRECT_URL, and add JWT_SECRET (or NEXTAUTH_SECRET)
echo 'JWT_SECRET=replace-this-with-something-random' >> .env

# Sync schema and generate client
npm run db:generate
npm run db:push

# Seed categories + a demo gig
node prisma/seed.js

# Start
npm run dev
```

Demo accounts created by the seed:
- `demo.freelancer@freelancefix.test` / `demo1234`
- `demo.client@freelancefix.test` / `demo1234`

## Testing the endpoints

Run the server, then in another terminal:

```bash
# Login as demo freelancer to get a token
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo.freelancer@freelancefix.test","password":"demo1234"}' \
  | grep -oE '"token":"[^"]*"' | cut -d'"' -f4)

# RETRIEVAL #1: list categories
curl http://localhost:3001/api/categories

# RETRIEVAL #2: browse gigs
curl http://localhost:3001/api/gigs

# RETRIEVAL #3: view a gig
curl http://localhost:3001/api/gigs/1

# INSERT: create a new gig
curl -X POST http://localhost:3001/api/gigs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test gig","description":"Test","base_price":50,"subcategory_id":1}'

# UPDATE: change order status (after creating an order)
# curl -X PATCH http://localhost:3001/api/orders/1/status -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"status":"In_Progress"}'

# DELETE: remove a gig
# curl -X DELETE http://localhost:3001/api/gigs/2 -H "Authorization: Bearer $TOKEN"
```

These same five operations cover all six items the rubric requires (3 retrieval + insert + update + delete).

## What's still needed

- Frontend pages for browse gigs, gig detail, create gig, orders list. The home/login/register/messages pages exist but most don't actually call the API yet.
- Deployment (Vercel for frontend, Render/Railway/Fly for backend).
