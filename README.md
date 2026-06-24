# SCN Jobs — Monolith

Converted from the 7-service microservices design (Auth, Admin, Master
Data, Worker, Job, Application, Notification) into a single Express +
Prisma + PostgreSQL service, following the Controller → Service →
Repository → Prisma layering you used in GoBandhu.

## Layout

```
scn-jobs-monolith/
├── prisma/schema.prisma          # single DB, real FKs + junction tables
├── scripts/
│   ├── seed-admin.ts             # one-time super_admin creation
│   └── seed.ts                   # master data import from xlsx
├── data/                         # put All_Data_Update_in_Portal.xlsx here
└── src/
    ├── index.ts / app.ts
    ├── common/                   # errors.ts, middlewares.ts, types.ts
    ├── config/                   # db.ts (Prisma), redis.ts (OTP only)
    ├── utils/password.ts
    ├── routes/index.ts           # mounts every module under /api/...
    └── modules/
        ├── auth/                 # register, OTP, login, /me
        ├── admin/                # recruiter CRUD + categories
        ├── master-data/          # locations, industries, skills, ...
        ├── worker/                # profile, education, experience, search
        ├── job/                   # job postings + categoryGuard
        ├── application/           # apply, status transitions
        └── notification/          # email.service.ts, sms.service.ts (plain functions, no event bus)
```

## Setup

```bash
cp .env.example .env        # fill in DATABASE_URL, JWT_KEY, REDIS_URL, ADMIN_EMAIL/PASSWORD
npm install
npx prisma migrate dev --name init
npm run seed:admin           # creates the one super_admin login
npm run seed:master          # imports industries/skills/locations/etc from data/*.xlsx
npm start
```

Server listens on `PORT` (default 3000), all routes under `/api`.

## What changed vs. the microservices version

- **One Postgres DB**, one Prisma schema. Every `// soft ref -> X Service`
  comment from the old schemas is now a real foreign key.
- **Junction tables** replace the `Int[]` soft-ref arrays: `WorkerSkill`,
  `WorkerLanguage`, `WorkerPreferredLocation`, `WorkerPreferredIndustry`,
  `JobSkill`, `JobQualification`. `RecruiterCategory` now FKs straight to
  `Industry` instead of storing a bare int.
- **No NATS.** Notification is two plain functions (`sendEmail`,
  `sendSms`) called directly where they're needed.
- **Recruiter creation is atomic.** Creating the login (`User`) and the
  `Recruiter` profile + categories now happens in one `prisma.$transaction`,
  closing a gap where the microservices version could create a login with
  no matching recruiter profile if the second write failed.
- **Recruiter deactivation actually deactivates the login**, not just the
  profile row — previously Auth Service had no way to know a recruiter had
  been deactivated.
- **Category checks are live**, not baked into the JWT. `job.middlewares.categoryGuard`
  and `worker.service.searchWorkers` query `RecruiterCategory` directly, so
  an admin changing a recruiter's categories takes effect immediately.
- **Recruiter category-gating on worker search is implemented** — the
  microservices version explicitly deferred this ("we're not filtering by
  that yet"). It's now a real join against the recruiter's assigned
  industries.
- **Application status emails actually work** — the old Notification
  handler needed "one more internal lookup" to get the worker's email that
  never got wired up. Now it's `app.worker.email`, no lookup needed.
- **All internal-only HTTP routes are gone**: `/internal/create-user`,
  `/internal/recruiter-categories/:userId`, `/internal/by-jobs`,
  `/internal/by-recruiter/:id`, `/internal/:id` on jobs. They existed
  purely for inter-service calls; in-process function calls replace all of
  them, which also removes that unauthenticated surface entirely.
- **Redis is kept only for OTP** (it needs the TTL). The Master Data
  caching layer from the microservices version is dropped — a straight
  Postgres read is fast enough at this scale; add it back later if traffic
  ever justifies it.
- **Dev-only scaffolding was not carried over**: master-data's `/test-login`
  route (mints an admin JWT with no credentials) didn't make the cut for a
  client deliverable.
- **Not invented**: the admin dashboard/reporting endpoints discussed
  earlier in the design conversation were never actually implemented in
  your microservices code, so I didn't add new ones here either — this is
  a straight conversion, not a feature addition. Say the word if you want
  those built now that everything's one query away.

## Minor API contract change

`PATCH /worker/profile` previously accepted `languageIds: number[]`. Since
the junction table carries an optional `proficiency`, it now accepts:

```json
"languages": [{ "languageId": 3, "proficiency": "fluent" }]
```

`skillIds`, `preferredLocationIds`, and `preferredIndustryIds` keep the same
shape (`number[]`) — same full-replace semantics as before, now against
real junction tables.
