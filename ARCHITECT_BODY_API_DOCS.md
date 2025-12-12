# ARCHITECT_BODY_API_DOCS

Overview
- Title: ARCHITECT_BODY_API_DOCS
- Description: API documentation for BodyArchitect backend (Express). Covers public, protected, and admin routes, authentication, request/response examples, error handling, and third-party integrations.

Authentication
- Method: JWT Bearer token
- Header: `Authorization: Bearer <access_token>`
- Middleware: `authentication` enforces valid token; `authorization` enforces item ownership; `guardAdmin` restricts admin routes.

Models (summary)
- User: `id, username, email, password, role (user|admin), age, gender, height, weight, activityLevel, goal, tdee, createdAt, updatedAt`
- DailyPlan: `id, userId, date, status (active|completed|...), createdAt, updatedAt`
- Meal: `id, dailyPlanId, name, type (breakfast|lunch|dinner), calories, isCompleted, createdAt, updatedAt`
- Workout: `id, dailyPlanId, name, reps, type, calories_burned|calories_estimate, duration_mins, isCompleted, createdAt, updatedAt`

HTTP Status Conventions
- 200 OK: successful GET/PUT/PATCH actions
- 201 Created: successful POST which created resource
- 400 Bad Request: validation error or malformed input
- 401 Unauthorized: missing/invalid token or auth failure
- 403 Forbidden: authorization failure (not owner / not admin)
- 404 Not Found: resource absent
- 500 Internal Server Error: unhandled server errors
- 502 Bad Gateway: third-party provider error (AI / external API fallback)

Endpoints

Public
- GET /
  - Description: Public home endpoint returning aggregated workouts/filters and search/sort/pagination.
  - Query params: `search`, `type`, `limit`, `page`, `sort` (calories_desc, calories_asc, duration_desc, duration_asc)
  - Auth: none
  - Success: 200 JSON (paginated list + metadata)

- POST /register
  - Description: Create new user
  - Body (JSON): { username, email, password, age, gender, height, weight, activityLevel, goal }
  - Success: 201 { id, username, email, ... }
  - Errors: 400 validation / unique constraint

- POST /login
  - Description: Email/password login
  - Body: { email, password }
  - Success: 200 { access_token }
  - Errors: 400 missing fields, 401 invalid credentials

- POST /google-login
  - Description: Login / register using Google OAuth token; uses `google-auth-library` to verify id token.
  - Body: { token }
  - Success: 200 { access_token }
  - Notes: handles both new user creation and existing user login; returns 401 if token invalid

Protected (Require `Authorization` header)
- GET /dashboard
  - Description: Returns user-specific dashboard. For admin, returns admin view (user list/summary).
  - Auth: required
  - Success: 200 { role: "User"|"Admin", today_plan, weekly_stats, ... }

- GET /profile
  - Description: Get current user profile (without password)
  - Auth: required
  - Success: 200 { id, username, email, age, ... }

- PUT /profile
  - Description: Update user profile fields
  - Body: partial user fields (username, age, weight, etc.)
  - Auth: required
  - Success: 200 updated user object

Daily Plans & Plan Generation
- GET /daily-plans
  - Description: List daily plans for authenticated user
  - Auth: required
  - Success: 200 [DailyPlan { Meals: [...], Workouts: [...] }, ...]

- POST /generate-plan
  - Description: Full AI-driven weekly plan generation (meals + workouts) for the authenticated user.
  - Auth: required
  - Flow: 1) Calls Google Generative AI to get structured weekly_plan JSON. 2) For each meal, tries to fetch calorie info via Spoonacular (axios). 3) Persists DailyPlan, Meal, Workout rows.
  - Success: 201 { message: "Success", ... }
  - Errors: 502 if AI response malformed / missing weekly_plan; 201 with fallback random calories if external nutrition lookup empty.

- POST /daily-plans
  - Description: Create manual daily plan for user
  - Body: { date }
  - Auth: required
  - Success: 201 created plan

- PUT /daily-plans/:id
  - Description: Update plan (e.g., status)
  - Auth: required (must be owner or admin depending on implementation)
  - Body: { status }
  - Success: 200 updated plan

- DELETE /daily-plans/:id
  - Description: Delete plan
  - Auth: required
  - Success: 200 on delete

Item actions (Meals / Workouts)
- PATCH /items/:type/:id
  - Description: Toggle `isCompleted` or update a specific item. `:type` expected `meal` or `workout`.
  - Auth: required
  - Authorization middleware: verifies ownership of the item by matching plan.userId to token user id. Returns 403 if not owner.
  - Errors: 400 if unknown type, 404 if id not found
  - Success: 200 updated item

Admin Routes (Require admin via `guardAdmin`)
- GET /admin/users
  - Description: List all users (admin-only). Response is formatted list.
  - Auth: required (admin)
  - Success: 200 [ { id, username, email, role, ... } ]

- PUT /admin/users/:id
  - Description: Update user by admin (role, goal, etc.)
  - Auth: required (admin)
  - Body: fields to update
  - Success: 200 updated user

- DELETE /admin/users/:id
  - Description: Delete user account (admin-only)
  - Auth: required (admin)
  - Success: 200 on delete, 404 if not found

Examples

1) Register (success)
Request:
POST /register
Content-Type: application/json
Body:
{
  "username": "tester",
  "email": "test@mail.com",
  "password": "password123",
  "age": 25,
  "gender": "male",
  "height": 170,
  "weight": 60,
  "activityLevel": "moderate",
  "goal": "muscle_build"
}
Response: 201
{
  "id": 5,
  "username": "tester",
  "email": "test@mail.com",
  "role": "user",
  "age": 25
}

2) Login (success)
Request:
POST /login
Body: { "email": "test@mail.com", "password": "password123" }
Response: 200
{ "access_token": "<jwt>" }

3) Generate Plan (Auth)
Request:
POST /generate-plan
Headers: Authorization: Bearer <jwt>
Response: 201
{ "message": "Success", "planId": 12 }

Error Examples
- Missing token: 401 { message: "Authentication failed" }
- Forbidden on item access: 403 { message: "Forbidden" }
- Validation: 400 { message: "Validation error details" }
- AI malformed response: 502 { message: "ThirdPartyError: invalid AI response" }

Third-party Integrations & Notes
- Google OAuth (`google-auth-library`) for `/google-login` token verification.
- Google Generative AI (`@google/generative-ai`) used in `generate-plan` to produce structured weekly_plan JSON.
- Spoonacular or similar nutrition API accessed via `axios` to look up nutrient data for meals; fallback uses randomized calories when external API returns empty.

Testing
- Tests located: server/__test__/app.test.js (uses jest + supertest)
- Test coverage exercises: registration, login (incl. google login), generate-plan with AI and fallback cases, plan CRUD, item patch, admin operations, and error handling paths (Sequelize errors, 500, 502).

Deployment & Env
- Env variables (example): `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_AI_API_KEY`, `SPOONACULAR_KEY`, `NODE_ENV`, `PORT`
- DB: Sequelize configured (see server/models and migrations). For tests, `sequelize.sync({ force: true })` used.

How to run tests
- From `server` folder:

```bash
npm install
npm test -- --coverage
```

Appendix: Quick OpenAPI-like Summary (endpoints table)
- GET / (public)
- POST /register (public)
- POST /login (public)
- POST /google-login (public)
- GET /dashboard (auth)
- GET /profile (auth)
- PUT /profile (auth)
- GET /daily-plans (auth)
- POST /generate-plan (auth)
- POST /daily-plans (auth)
- PUT /daily-plans/:id (auth)
- DELETE /daily-plans/:id (auth)
- PATCH /items/:type/:id (auth + authorization)
- GET /admin/users (admin)
- PUT /admin/users/:id (admin)
- DELETE /admin/users/:id (admin)

-- End of ARCHITECT_BODY_API_DOCS --
