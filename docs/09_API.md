# API Documentation

Base URL: `/api`  ·  Auth: `Authorization: Bearer <accessToken>`
Response envelope: `{ "success": true, "data": ..., "meta"?: {...} }`
Error envelope:    `{ "success": false, "error": { "message", "details" } }`

## Auth
| Method | Endpoint | Body | Roles |
|---|---|---|---|
| POST | /auth/login | `{email,password}` | public |
| POST | /auth/refresh | `{refreshToken}` | public |
| POST | /auth/logout | `{refreshToken}` | public |
| GET  | /auth/me | — | any |
| POST | /auth/register | `{name,email,phone,password,role}` | admin |

**Login 200**
```json
{ "success": true, "data": {
  "accessToken": "eyJ...", "refreshToken": "eyJ...",
  "user": { "id": "uuid", "name": "Asha", "email": "admin@hotel.com", "role": "admin" } } }
```

## Enquiries
| Method | Endpoint | Notes |
|---|---|---|
| GET | /enquiries?q=&status=&source=&assigned_staff_id=&page=&limit= | list + paginate |
| GET | /enquiries/:id | includes follow_ups + history |
| POST | /enquiries | create (admin, manager, front_desk, corporate_coordinator) |
| PUT | /enquiries/:id | update details |
| PATCH | /enquiries/:id/status | `{status}` |
| PATCH | /enquiries/:id/assign | `{assigned_staff_id}` (admin, manager) |

## Follow-ups
`GET /follow-ups?status=&overdue=true&today=true` · `POST /follow-ups` · `PUT /follow-ups/:id` · `PATCH /follow-ups/:id/complete`

## Rooms
`GET /rooms` · `GET /rooms/availability?check_in=&check_out=&room_type=` · `POST /rooms` (admin,manager) · `PUT /rooms/:id` · `PATCH /rooms/:id/status` · `DELETE /rooms/:id` (admin)

## Bookings
`GET /bookings?status=` · `POST /bookings` · `POST /bookings/from-enquiry/:enquiryId` · `PATCH /bookings/:id/check-in` · `PATCH /bookings/:id/check-out`

## Generic CRUD resources
Each supports GET (list `?q=&page=&limit=` + filters), GET/:id, POST, PUT/:id, DELETE/:id (role-gated):
`/users` `/guests` `/self-checkins` `/room-service` `/housekeeping` `/feedback` `/complaints` `/corporate-bookings` `/group-bookings` `/shift-handovers`

## Dashboard & Reports
`GET /dashboard/summary` · `GET /dashboard/charts` · `GET /dashboard/activity`
`GET /reports/:type?format=csv` where type ∈ enquiry|booking|occupancy|revenue|followup|complaint

## Validation & Errors
- Joi validation → 400 with `details: [{field,message}]`.
- Unique violation → 409. FK violation → 400. Booking overlap → 409.
- Rate limit exceeded → 429.
