# EventVerse Backend

Node.js / Express / MongoDB (via Prisma) backend for EventVerse, implementing the
updated architecture: MongoDB as the primary database, Prisma ORM retained,
Mapbox-derived event location fields (venue/address/latitude/longitude), and
transactional bookings that require a MongoDB replica set or MongoDB Atlas.

## Architecture

```
Route -> Controller -> Service -> Repository/Prisma -> MongoDB
```

- `src/routes` — Express routers, request validation wiring
- `src/controllers` — thin HTTP layer, calls services, shapes responses
- `src/services` — business logic (booking transactions, event discovery, analytics, QR)
- `src/repositories` — all Prisma/MongoDB query construction lives here
- `src/middleware` — auth (JWT), validation (Zod), rate limiting, error handling
- `src/validators` — Zod schemas per resource
- `src/utils` — JWT, password hashing, QR generation, pagination, slugify
- `prisma/schema.prisma` — MongoDB data model
- `prisma/seed.js` — demo organizer/user/event/ticket-type seed data

## Prerequisites

- Node.js 18+
- A MongoDB deployment that supports multi-document transactions:
  a **replica set**, or (recommended) **MongoDB Atlas**. A standalone
  `mongod` will work for everything except booking creation/cancellation,
  which uses `prisma.$transaction`.

## Setup

```bash
cp .env.example .env
# edit .env with your MongoDB connection string and a real JWT_SECRET

npm install
npm run prisma:generate
npm run prisma:push     # syncs the Prisma schema to MongoDB collections/indexes
npm run seed             # optional demo data
npm run dev               # http://localhost:5000
```

Demo accounts created by `npm run seed`:

| Role      | Email                     | Password       |
|-----------|---------------------------|----------------|
| Organizer | organizer@eventverse.dev  | Password123!   |
| User      | user@eventverse.dev       | Password123!   |

## API overview

Base URL: `/api/v1`

- **Auth**: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `POST /auth/logout`
- **Events**: `GET/POST /events`, `GET/PATCH/DELETE /events/:id`
  - `GET /events` supports `search, category, location, date, minPrice, maxPrice,
    sort, page, limit`, plus optional nearby discovery via `latitude, longitude, radius`
  - Nested: `GET/POST /events/:eventId/ticket-types`, `GET/POST /events/:eventId/reviews`
- **Ticket types**: `PATCH/DELETE /ticket-types/:id`
- **Organizer**: `GET /organizer/events`, `GET /organizer/events/:id`,
  `GET /organizer/events/:id/bookings`, `GET /organizer/events/:id/analytics`,
  `GET /organizer/analytics`
- **Bookings**: `POST /bookings`, `GET /bookings/me`, `GET /bookings/:id`,
  `POST /bookings/:id/cancel`
- **Tickets**: `GET /tickets/me`, `GET /tickets/:id`, `GET /tickets/:id/qr`,
  `POST /tickets/validate`, `POST /tickets/:id/check-in`
- **Favorites**: `GET /favorites`, `POST/DELETE /favorites/:eventId`
- **Reviews**: `POST /events/:eventId/reviews`, `GET /events/:eventId/reviews`,
  `DELETE /reviews/:id`
- **Categories**: `GET /categories`, `POST /categories` (admin)

All protected routes expect `Authorization: Bearer <token>`.

## Event location (Mapbox contract)

The React frontend selects a venue via Mapbox Search/Geocoding and sends:

```json
{
  "venue": "Selected venue name",
  "address": "Human-readable address",
  "latitude": 30.0444,
  "longitude": 31.2357
}
```

as part of the event create/update payload. The backend independently validates
`latitude` (-90..90) and `longitude` (-180..180) — the frontend's Mapbox
selection does not replace backend validation. The Mapbox access token is a
frontend-only concern (`MAPBOX_ACCESS_TOKEN` documents the contract but the
backend never calls Mapbox itself).

## Booking transaction

`POST /bookings` runs inside `prisma.$transaction`:

1. Validate event is `PUBLISHED`, ticket type belongs to the event, and the
   current time is within the ticket type's sales window.
2. Server calculates `totalAmount = price * quantity` — a client-supplied
   total is never trusted.
3. Atomically decrement `availableQuantity` with a conditional
   `WHERE availableQuantity >= quantity` filter — this is what prevents
   overselling under concurrent requests, independent of the earlier read.
4. If the decrement affects zero documents (lost the race), the whole
   transaction aborts with a 409 and nothing is written.
5. Otherwise create the `Booking` and one `Ticket` (with a unique QR token)
   per unit purchased, then commit.

Cancelling a booking runs a symmetric transaction that restores inventory and
marks issued tickets `CANCELLED`.

## Tickets & QR validation

Each `Ticket` carries a unique `qrToken` (not the ticket's database id) that
is embedded in the generated QR code. `POST /tickets/validate` looks the
ticket up by `qrToken` and reports whether it is still `VALID`;
`POST /tickets/:id/check-in` flips a `VALID` ticket to `USED`, preventing
re-use of the same code at the door. Both actions are restricted to the
event's organizer (or an admin).

## Testing

```bash
npm test
```

`tests/health.test.js` is a starting smoke test. Add integration tests per
the plan's critical scenarios (concurrent bookings/overselling, transaction
rollback on failure, invalid coordinates, QR check-in idempotency, etc.) using
`supertest` against a MongoDB replica-set test instance.

## Notes / what to configure before production

- Set a strong, random `JWT_SECRET`.
- Point `DATABASE_URL` at a replica set / MongoDB Atlas cluster (required for
  the booking transaction).
- Configure real image/asset storage credentials if event image uploads are
  added beyond the `imageUrl` field.
- Add HTTPS, structured logging/monitoring, and stricter CORS origins for
  production deployment, per the plan's security checklist.
