# BeetleX Backend Platform

BeetleX is a high-performance, production-ready backend engine designed to manage hackathons at scale. The platform serves participants (registration, team formation, project submissions), judges (score submission, criteria grading), organizers (events, live stats, announcements), and public users (events, published leaderboards).

---

## 🚀 Tech Stack
* **Runtime:** Node.js (v20+)
* **Language:** TypeScript
* **Web Framework:** Express.js
* **Database Layer:** PostgreSQL
* **ORM:** Prisma ORM
* **Security & Auth:** JSON Web Tokens (JWT), BCrypt password hashing, HTTP-Only Cookie refresh sessions, Express Rate Limit
* **Testing:** Jest, Supertest
* **Containerization:** Docker, Docker Compose

---

## 🏗️ Architecture
BeetleX uses a decoupled **layered architecture** pattern to ensure separations of concerns, maintainability, and clean dependency management:

```
[Client] ──► [Express Routing Layer] ──► [Controller Layer] ──► [Service Layer] ──► [Repository Layer] ──► [PostgreSQL]
                  │                                                                  ▲
            [Rate Limit / Auth Middleware] ──────────────────────────────────────────┘
```

* **Route Layer:** Mounts endpoints, applies rate limiters, verifies permissions, and maps routes.
* **Controller Layer:** Parses parameters, executes Zod validation checks, delegates tasks to services, and returns formatted JSON.
* **Service Layer:** Houses the business logic of the platform, including authorization checks, deadline verifications, and event workflows.
* **Repository Layer:** Encapsulates direct database queries and transactional database interactions using Prisma Client.

---

## 📁 Folder Structure
```
Backend/
├── prisma/
│   ├── migrations/             # SQL database migration files
│   └── schema.prisma           # Prisma database schema definition
├── src/
│   ├── config/                 # Database initialization and environment settings
│   ├── controllers/            # Controller layer parsing inputs
│   ├── middleware/             # Rate-limiters, Auth, and role permissions
│   ├── repositories/           # Repository layer executing database queries
│   ├── routes/                 # Express routing maps
│   ├── services/               # Service layer processing business rules
│   ├── utils/                  # Cryptography, JWT tokens, response formatters
│   ├── validators/             # Zod validation schemas
│   ├── app.ts                  # Express app setup and middleware routing
│   └── server.ts               # HTTP Server listener
├── tests/
│   └── integration.test.ts     # Jest + Supertest integration test suite
├── Dockerfile                  # Multi-stage Docker config
├── docker-compose.yml          # Local orchestration setup
├── docker-entrypoint.sh        # Database check and migration runner
├── jest.config.js              # Test suite settings
└── tsconfig.json               # TypeScript compiler properties
```

---

## ⚙️ Setup

### Prerequisites
* Node.js v20 or higher
* npm or yarn
* PostgreSQL running locally (port 5432) or via Docker

### Local Installation
1. Navigate to the backend folder:
   ```bash
   cd Backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your `.env` file (see [Environment Variables](#-environment-variables)).
4. Sync migrations and generate Prisma client:
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```
5. Run the development server:
   ```bash
   npm run dev
   ```

---

## 🔑 Environment Variables
Create a `.env` file in the root of the `Backend/` directory with the following variables:

```env
PORT=3000
DATABASE_URL="postgresql://postgres:**********@localhost:5432/beetlex_db?schema=public"
JWT_ACCESS_SECRET="your_access_token_secret_string"
JWT_REFRESH_SECRET="your_refresh_token_secret_string"
FRONTEND_ORIGIN="http://localhost:5173"
NODE_ENV="development"
```

---

## 🐳 Docker Setup
Orchestrate the PostgreSQL database and the Express application in a unified network.

### Commands
1. Build and start services:
   ```bash
   docker-compose up --build -d
   ```
2. Stop and clean up containers:
   ```bash
   docker-compose down
   ```

### Volume Persistence
Docker mounts a local folder `postgres_data` mapping to `/var/lib/postgresql/data` to persist databases on container reloads.

---

## 🗃️ Database Migrations
Prisma handles state shifts and maps database schemas to PostgreSQL:

* **Create new migration on schema updates:**
  ```bash
  npx prisma migrate dev --name name_of_migration
  ```
* **Run outstanding migrations in production:**
  ```bash
  npx prisma migrate deploy
  ```

---

## 📡 API Endpoints

### Auth
* `POST /api/auth/register` — Register a new account.
* `POST /api/auth/login` — Log in and receive JWT credentials.
* `POST /api/auth/refresh` — Rotate access/refresh tokens.
* `POST /api/auth/logout` — Revoke and clean cookies.
* `GET /api/auth/me` — Fetch current user profile.
* `PATCH /api/auth/me` — Update profile details (bio, avatar, URLs).

### Events
* `GET /api/events` — Paginated event list.
* `POST /api/events` — Create a hackathon (organizer/admin).
* `GET /api/events/:slug` — Get event details.
* `PATCH /api/events/:id` — Update event details (organizer/admin).
* `DELETE /api/events/:id` — Soft-delete event (admin).
* `GET /api/events/:id/stats` — Stats overview (organizer/admin).

### Registrations
* `POST /api/events/:id/register` — Join an event (participant).
* `GET /api/events/:id/registration` — Fetch current user's registration.
* `DELETE /api/events/:id/registration` — Cancel registration.
* `GET /api/events/:id/registrations` — List all registrations with `format=csv` support (organizer/admin).

### Teams
* `POST /api/events/:id/teams` — Create a team.
* `GET /api/events/:id/teams` — Fetch event teams list.
* `GET /api/teams/:id` — Retrieve team detail.
* `PATCH /api/teams/:id` — Modify team track or name (leader).
* `POST /api/teams/join` — Join team using invite code.
* `DELETE /api/teams/:id/members/:userId` — Remove member (leader).
* `DELETE /api/teams/:id` — Disband team (leader).

### Projects
* `POST /api/teams/:id/project` — Create a project draft.
* `GET /api/teams/:id/project` — Get team project.
* `PATCH /api/teams/:id/project` — Edit project details.
* `POST /api/teams/:id/project/submit` — Finalize submission.
* `POST /api/teams/:id/project/deck` — Upload pitch deck PDF.
* `GET /api/events/:id/projects` — List submitted projects (organizer/judge).

### Judges
* `GET /api/judge/projects` — Assigned projects.
* `GET /api/judge/projects/:id` — Retrieve project detail.
* `POST /api/judge/projects/:id/score` — Submit criteria scores.
* `PATCH /api/judge/projects/:id/score` — Update criteria scores.
* `GET /api/events/:id/scores` — Event score listing (organizer/admin).

### Announcements
* `POST /api/events/:id/announcements` — Draft announcement (organizer/admin).
* `POST /api/events/:id/announcements/:annId/publish` — Publish announcement (organizer/admin).
* `GET /api/events/:id/announcements` — List published announcements.
* `POST /api/events/:id/announcements/:annId/read` — Mark announcement as read.
* `GET /api/events/:id/announcements/unread-count` — Count unread announcements.
* `GET /api/events/:id/announcements/live` — Stream live announcements via SSE.

### Leaderboard
* `GET /api/events/:id/leaderboard` — Paginated ranked projects.
* `GET /api/events/:id/leaderboard/live` — Live rank updates stream via SSE.

---

## 🔒 Authentication Flow
The system implements a secure token rotation policy:
1. On successful login, the server returns a short-lived `accessToken` (15m expiry) in the JSON body, and sets a cryptographically secure `refreshToken` (7d expiry) in an `HttpOnly`, `SameSite=Strict`, secure cookie.
2. The `refreshToken` is saved in the database associated with the user.
3. When the access token expires, the client hits `/api/auth/refresh` sending the cookie. The server validates the token against the DB, deletes the old token (rotation), issues a new pair, and saves the new refresh token in the DB.
4. On logout, the token is revoked in the database and the cookie is cleared.

---

## ⚡ Design Decisions

### Zod Validation
We run payload validations at the entry point of controllers using Zod. This validates inputs before hitting business services or SQL, shielding the database from malformed transactions.

### Database Query Optimization (Leaderboard)
Instead of loading tables and computing statistics in-memory inside Node.js, the leaderboard retrieves rankings directly using PostgreSQL aggregates (`prisma.$queryRaw`), computing averages and tie-breaking calculations at the database level.

### Route Isolation & Conflict Resolution
Selective middleware mounting prevents nested routers (e.g. `/:id` wildcards) from blocking public endpoints (like `/events/:slug`).

---

## ⚖️ Tradeoffs
* **ZSET vs Database calculation:** We decided to calculate leaderboards directly via database indexing first. While a Redis ZSET is faster for reads, SQL aggregations keep database sync straightforward without caching complexities during low-traffic periods.
* **Direct database writes vs queues:** Registrations write directly to the DB within interactive transactions to guarantee atomic capacity counts at the cost of database throughput during peak registration drops.

---

## ⚠️ Known Limitations
* **Antivirus scan latency:** PDF uploads are mocked and do not run scanning microservices in dev mode.
* **Bitmap storage limits:** User read states are saved directly as relational records rather than Redis Bitmaps.

---

## 🔮 Future Improvements
* Set up a Lambda-based ClamAV S3 scanner for PDF uploads.
* Integrate Redis ZSET to store event leaderboards under heavy concurrent read loads.
* Setup rate-limiting bucket queues for high-traffic sign-ups.

---

## 🧪 Testing
The test suite utilizes Jest + Supertest to run **17 comprehensive integration test cases** covering the entire auth, event, team, registration, and judging pipeline.

* **Execute test suite:**
  ```bash
  npm run test
  ```

---

## 📖 Running Swagger
API documentation is auto-generated from JSDoc route annotations.

1. Start the API server:
   ```bash
   npm run dev
   ```
2. Navigate to `http://localhost:3000/api-docs` on your browser to view the interactive documentation UI.

---

## 🏢 Production Considerations
* **Enable Rate Limiting:** Global and endpoint-specific rate limiters are enabled by default.
* **Secure Cookies:** In production environments, `res.cookie` sets the `secure: true` option ensuring tokens are only sent over HTTPS.
* **Database Pool Sizing:** Configured with transaction pooling defaults to match sustained CPU core constraints.
