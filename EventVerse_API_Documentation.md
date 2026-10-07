# EventVerse API Documentation

Base URL: `/api/v1`

All request/response bodies are JSON. All protected endpoints require the header:

```
Authorization: Bearer <token>
```

The token is returned by `POST /auth/register` and `POST /auth/login`, and is a
JWT that expires after `JWT_EXPIRES_IN` (default 7 days).

## Roles

| Role      | Description                                              |
|-----------|------------------------------------------------------------|
| `USER`      | Default role. Can browse events, book tickets, favorite events, leave reviews. |
| `ORGANIZER` | Can create/manage their own events, ticket types, and view bookings/analytics for events they own. |
| `ADMIN`     | Full access — can manage any user's events/resources, create categories. |

A route marked **Auth: required** needs a valid token. **Roles** lists which
roles may call it; "Owner or Admin" means the resource's own creator (event
organizer, booking owner, etc.) or an `ADMIN`, regardless of their base role.

## Response shape

Success:
```json
{ "success": true, "data": { }, "meta": { "page": 1, "limit": 12, "total": 42, "totalPages": 4 } }
```
`meta` is only present on paginated list endpoints.

Error:
```json
{ "success": false, "error": { "message": "...", "details": [ { "path": "email", "message": "Invalid email" } ] } }
```

---

## 1. Auth — `/auth`

### `POST /auth/register`
Create a new account.
- **Auth**: not required
- **Body** (required):
  ```json
  { "name": "Jane Doe", "email": "jane@example.com", "password": "MinEightChars!", "role": "USER" }
  ```
  `role` is optional (`USER` or `ORGANIZER`; defaults to `USER`). You cannot register as `ADMIN`.
- **Response**: `{ user, token }`

### `POST /auth/login`
- **Auth**: not required
- **Body** (required): `{ "email": "jane@example.com", "password": "MinEightChars!" }`
- **Response**: `{ user, token }`

### `GET /auth/me`
Returns the currently authenticated user's profile.
- **Auth**: required
- **Roles**: any authenticated user
- **Body**: none

### `POST /auth/logout`
Stateless endpoint — the client simply discards its token. Included for API
completeness / to trigger any client-side cleanup.
- **Auth**: required
- **Body**: none

Auth endpoints are additionally rate-limited (20 requests / 15 min) to slow down credential stuffing.

---

## 2. Categories — `/categories`

### `GET /categories`
List all event categories.
- **Auth**: not required
- **Body**: none

### `POST /categories`
Create a category.
- **Auth**: required
- **Roles**: `ADMIN` only
- **Body** (required): `{ "name": "Technology" }`

---

## 3. Events — `/events`

### `GET /events`
Public event discovery/search. Only `PUBLISHED` events are returned.
- **Auth**: not required
- **Body**: none
- **Query params** (all optional):
  | Param | Type | Notes |
  |---|---|---|
  | `search` | string | matches title/description/venue |
  | `category` | string | category id |
  | `location` | string | matches against address |
  | `date` | date | events on that day |
  | `minPrice` / `maxPrice` | number | filters by lowest ticket-type price |
  | `sort` | `newest` \| `date_desc` | default sorts by soonest date |
  | `page` / `limit` | number | pagination, default 1 / 12, max 100 |
  | `latitude`, `longitude`, `radius` | number | optional nearby-event search (radius in km); all three must be supplied together |

### `POST /events`
Create an event. Location fields (`venue`, `address`, `latitude`, `longitude`)
should come from the frontend's Mapbox venue-selection flow.
- **Auth**: required
- **Roles**: `ORGANIZER`, `ADMIN`
- **Body** (required):
  ```json
  {
    "title": "Cairo Tech Summit",
    "description": "A gathering of developers...",
    "categoryId": "665f...",
    "imageUrl": "https://...",           // optional
    "date": "2026-11-15",
    "startTime": "09:00",
    "endTime": "18:00",
    "venue": "Cairo International Convention Center",
    "address": "Nasr City, Cairo, Egypt",
    "latitude": 30.0444,
    "longitude": 31.2357,
    "status": "DRAFT"                     // optional: DRAFT | PUBLISHED | CANCELLED
  }
  ```
  Coordinates are validated server-side (`latitude` -90..90, `longitude` -180..180)
  regardless of what the frontend's Mapbox widget already checked.

### `GET /events/:id`
Get a single event (any status) by id, including its ticket types.
- **Auth**: not required
- **Body**: none

### `PATCH /events/:id`
Update an event. All fields optional; only send what's changing.
- **Auth**: required
- **Roles**: Owner (organizer of that event) or `ADMIN`
- **Body**: any subset of the `POST /events` fields

### `DELETE /events/:id`
- **Auth**: required
- **Roles**: Owner or `ADMIN`
- **Body**: none

### `GET /events/:eventId/ticket-types`
List ticket types for an event.
- **Auth**: not required
- **Body**: none

### `POST /events/:eventId/ticket-types`
Create a ticket type for an event.
- **Auth**: required
- **Roles**: `ORGANIZER`, `ADMIN` (should own the event — enforced in the service layer)
- **Body** (required):
  ```json
  {
    "name": "General Admission",
    "price": 25,
    "totalQuantity": 200,
    "salesStart": "2026-09-01T00:00:00Z",  // optional
    "salesEnd": "2026-11-14T23:59:59Z"      // optional
  }
  ```

### `GET /events/:eventId/reviews`
List reviews for an event, plus average rating and review count.
- **Auth**: not required
- **Body**: none

### `POST /events/:eventId/reviews`
Leave a review (one per user per event).
- **Auth**: required
- **Roles**: any authenticated user
- **Body** (required): `{ "rating": 5, "comment": "Great event!" }` (`comment` optional, `rating` 1-5)

---

## 4. Ticket types — `/ticket-types`

### `PATCH /ticket-types/:id`
- **Auth**: required
- **Roles**: Owner of the parent event, or `ADMIN`
- **Body**: any subset of `{ name, price, totalQuantity, salesStart, salesEnd }`

### `DELETE /ticket-types/:id`
- **Auth**: required
- **Roles**: Owner of the parent event, or `ADMIN`
- **Body**: none

---

## 5. Bookings — `/bookings`

All booking routes require auth.

### `POST /bookings`
Creates a booking and its tickets inside a single MongoDB transaction. The
server calculates the total price — never send `totalAmount` yourself.
- **Auth**: required
- **Roles**: any authenticated user
- **Body** (required): `{ "eventId": "665f...", "ticketTypeId": "665f...", "quantity": 2 }` (quantity 1-20)
- **Fails with 400** if the event isn't `PUBLISHED` or sales window hasn't opened/has closed.
- **Fails with 409** if another concurrent request already took the remaining stock.

### `GET /bookings/me`
List the current user's bookings (paginated).
- **Auth**: required
- **Query**: `page`, `limit`

### `GET /bookings/:id`
- **Auth**: required
- **Roles**: Owner of the booking, or `ADMIN`

### `POST /bookings/:id/cancel`
Cancels the booking, restores ticket-type inventory, and marks its tickets `CANCELLED`.
- **Auth**: required
- **Roles**: Owner of the booking, or `ADMIN`
- **Body**: none

---

## 6. Tickets — `/tickets`

All ticket routes require auth.

### `GET /tickets/me`
List the current user's tickets (paginated).
- **Auth**: required
- **Roles**: any authenticated user

### `GET /tickets/:id`
- **Auth**: required
- **Roles**: Owner of the ticket, or `ADMIN`

### `GET /tickets/:id/qr`
Returns a QR code as a base64 data URL, encoding the ticket's unique `qrToken`.
- **Auth**: required
- **Roles**: Owner of the ticket, or `ADMIN`

### `POST /tickets/validate`
Look up a scanned QR code and report whether it's still valid, without
checking it in. Used at a gate to preview a ticket before confirming entry.
- **Auth**: required
- **Roles**: `ORGANIZER` (of that ticket's event), `ADMIN`
- **Body** (required): `{ "qrToken": "scanned-uuid-value" }`

### `POST /tickets/:id/check-in`
Marks a `VALID` ticket as `USED`. Returns 409 if it was already checked in,
400 if it was cancelled.
- **Auth**: required
- **Roles**: `ORGANIZER` (of that ticket's event), `ADMIN`
- **Body**: none

---

## 7. Favorites — `/favorites`

All favorite routes require auth.

### `GET /favorites`
List the current user's favorited events.
- **Auth**: required

### `POST /favorites/:eventId`
Add an event to favorites.
- **Auth**: required
- **Body**: none

### `DELETE /favorites/:eventId`
Remove an event from favorites.
- **Auth**: required
- **Body**: none

---

## 8. Reviews — `/reviews`

(Creation/listing is nested under `/events/:eventId/reviews` — see section 3.)

### `DELETE /reviews/:id`
- **Auth**: required
- **Roles**: Owner of the review, or `ADMIN`
- **Body**: none

---

## 9. Organizer — `/organizer`

Every route under `/organizer` requires auth and role `ORGANIZER` or `ADMIN`.

### `GET /organizer/events`
List events created by the current organizer (paginated).

### `GET /organizer/events/:id`
Get one of the current organizer's events (403 if you don't own it and aren't `ADMIN`).

### `GET /organizer/events/:id/bookings`
List all bookings made for that event (organizer-facing, not paginated).
- **Roles**: Owner of the event, or `ADMIN`

### `GET /organizer/events/:id/analytics`
Per-event stats: total bookings, total revenue, tickets sold, tickets checked in, check-in rate.
- **Roles**: Owner of the event, or `ADMIN`

### `GET /organizer/analytics`
Aggregate stats across every event the current organizer owns.
- **Roles**: any `ORGANIZER`/`ADMIN` (scoped to their own events automatically)

---

## Quick reference table

| Method | Path | Auth | Roles | Body required |
|---|---|---|---|---|
| POST | /auth/register | No | — | Yes |
| POST | /auth/login | No | — | Yes |
| GET | /auth/me | Yes | Any | No |
| POST | /auth/logout | Yes | Any | No |
| GET | /categories | No | — | No |
| POST | /categories | Yes | Admin | Yes |
| GET | /events | No | — | No (query only) |
| POST | /events | Yes | Organizer, Admin | Yes |
| GET | /events/:id | No | — | No |
| PATCH | /events/:id | Yes | Owner, Admin | Yes (partial) |
| DELETE | /events/:id | Yes | Owner, Admin | No |
| GET | /events/:eventId/ticket-types | No | — | No |
| POST | /events/:eventId/ticket-types | Yes | Organizer, Admin | Yes |
| PATCH | /ticket-types/:id | Yes | Owner, Admin | Yes (partial) |
| DELETE | /ticket-types/:id | Yes | Owner, Admin | No |
| GET | /events/:eventId/reviews | No | — | No |
| POST | /events/:eventId/reviews | Yes | Any | Yes |
| DELETE | /reviews/:id | Yes | Owner, Admin | No |
| POST | /bookings | Yes | Any | Yes |
| GET | /bookings/me | Yes | Any | No |
| GET | /bookings/:id | Yes | Owner, Admin | No |
| POST | /bookings/:id/cancel | Yes | Owner, Admin | No |
| GET | /tickets/me | Yes | Any | No |
| GET | /tickets/:id | Yes | Owner, Admin | No |
| GET | /tickets/:id/qr | Yes | Owner, Admin | No |
| POST | /tickets/validate | Yes | Organizer, Admin | Yes |
| POST | /tickets/:id/check-in | Yes | Organizer, Admin | No |
| GET | /favorites | Yes | Any | No |
| POST | /favorites/:eventId | Yes | Any | No |
| DELETE | /favorites/:eventId | Yes | Any | No |
| GET | /organizer/events | Yes | Organizer, Admin | No |
| GET | /organizer/events/:id | Yes | Organizer, Admin (owner) | No |
| GET | /organizer/events/:id/bookings | Yes | Owner, Admin | No |
| GET | /organizer/events/:id/analytics | Yes | Owner, Admin | No |
| GET | /organizer/analytics | Yes | Organizer, Admin | No |
