# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# MyCareerPath — Codebase Map

AI-powered career development & placement platform. Full-stack implementation featuring a **FastAPI + MongoDB Atlas** backend, a **React 19 + Vite** frontend (with comprehensive Candidate, Recruiter, and Admin portals), and Google Gemini AI integration (`gemini-3.6-flash`).

## Repository Layout

```
mycareerpath/
├── App.jsx              # Top-level page switcher & role shell orchestrator (Candidate, Recruiter, Admin)
├── LandingPage.jsx      # Public landing (search, explore categories, role marquee, synced auth/dashboard CTAs)
├── JobsPage.jsx         # Legacy static jobs module retained for compatibility
├── main.jsx             # React root mount
├── theme.css            # Global CSS variables (cream/navy/orange palette + recruiter page hooks)
├── index.html           # Vite entry
├── package.json         # Vite + React 19 + lucide-react + tailwindcss
├── src/
│   ├── AuthForm.jsx     # Candidate/Recruiter password sign-in; OTP-gated registration (10-digit mobile validation)
│   ├── api.js           # API client with multi-token fallback, /api/v1/admin/* routing, schema normalization, profile & account deletion helpers
│   ├── ChatDialog.jsx   # AI support chat UI (talks to /api/chatbot/chat with full turn memory)
│   ├── components/
│   │   ├── ProfileDropdown.jsx          # Reusable circular avatar dropdown with initials/avatar preview, click-outside, Esc handler
│   │   ├── DangerZone.jsx               # Account self-deletion confirmation dialog with explicit typed confirmation
│   │   ├── AdminLoginModal.jsx          # Isolated password-based administrator sign-in and reset-request modal
│   │   ├── Footer.jsx                   # Full dark-blue public landing footer; includes the isolated Admin Portal trigger
│   │   ├── NotificationBell.jsx          # Candidate header bell with unread badge and notification drawer
│   │   └── modals/                      # Reusable modal components
│   │       ├── ApplicationWizardModal.jsx # Four-step candidate application flow: job review, eligibility, resume, confirmation
│   │       ├── ForgotPasswordModal.jsx    # Candidate/Recruiter reset-only OTP + new-password recovery flow
│   │       ├── EditContactModal.jsx     # Editable contact modal (email, phone with 10-digit validation, location, socials)
│   │       ├── EditSkillsModal.jsx      # Skill chips (AI-suggested + custom input); saves to localStorage
│   │       ├── AddCertificationModal.jsx# Cert form (name, issuer, dates, URL); saves to localStorage
│   │       └── EducationPreferencesModal.jsx # Edu form (degree, institution, years); saves to localStorage
│   └── pages/
│       ├── Recruiter/   # Recruiter dashboard (Empdashboard, PostJobEmployeeDashboard, ManageJobsEmployeeDashboard, ApplicationsEmployeeDashboard, ReportsEmployeeDashboard, SettingsEmployeeDashboard, RecruiterOnboarding, LoggedOut)
│       └── Candidate/   # Candidate views (UserProfile, CandidateDashboard, CandidateOnboarding, JobsExplorer, AccountSettings)
├── mycareerpath-admin/  # Dedicated Admin Control Center (integrated into root App.jsx for admin users)
│   ├── package.json     # Vite + React
│   └── src/
│       ├── App.jsx      # Admin root shell (Sidebar, Topbar, dynamic views)
│       ├── api.js       # Admin client with multi-token lookup & /api/v1 fallback
│       ├── components/  # Sidebar.jsx, Topbar.jsx
│       └── views/       # Dashboard, Users, CompanyApprovals, Jobs, Activity, Reports, System
└── backend/
    ├── app/
    │   ├── main.py            # FastAPI app, lifespan → MongoDB, CORS, dual /api/v1 & settings.API_V1_STR mounting
    │   ├── core/
    │   │   ├── config.py      # Pydantic Settings (env-driven, GEMINI_MODEL="gemini-3.6-flash")
    │   │   └── security.py    # bcrypt + JWT (HS256) access/refresh
    │   ├── db/mongodb.py      # Motor async client + index init
    │   ├── models/            # Pydantic Mongo models (PyObjectId, BaseMongoModel) — user, item, application
    │   ├── schemas/           # Request/response shapes (User, Item, Token, Recommendation, Application)
    │   ├── crud/              # Generic CRUDBase + user/item/application subclasses
    │   ├── api/
    │   │   ├── deps.py        # get_db, get_current_user, get_current_active_user, get_current_admin_user
    │   │   └── v1/
    │   │       ├── api.py     # Aggregates routers
    │   │       └── endpoints/ # auth.py, users.py, items.py, admin.py, chatbot.py, recommendations.py, applications.py, reports.py
    │   └── __pycache__/       # (committed; consider gitignoring)
    ├── tests/test_auth.py     # One file: health + register/login
    ├── scripts/
    │   └── create_admin.py    # Idempotent admin seeding script (--phone/--email)
    ├── requirements.txt
    ├── Dockerfile             # python:3.11-slim, non-root appuser, 4 workers
    ├── docker-compose.yml     # api + mongo + mongo-express
    ├── .env / .env.example    # ⚠ .env contains real Atlas creds + Gemini key
    └── 0, 0.0.9, 0.110.0 …    # Stray version-named files — DO NOT delete per user
```

## Common Commands

### Frontend (root)
```bash
npm install              # install deps
npm run dev              # vite dev server (http://localhost:5173)
npm run build            # production build to dist/
npm run preview          # preview built bundle
```
There is **no test runner configured** for the frontend.

### Backend
```bash
# Local (with venv at backend/venv)
cd backend
source venv/bin/activate     # (Windows: venv\Scripts\activate)
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Single test
pytest tests/test_auth.py -v
pytest tests/test_auth.py::test_health_check -v

# Docker (recommended — includes MongoDB + mongo-express UI on :8081)
cd backend
docker-compose up --build
```

### Health check
```bash
curl -i http://127.0.0.1:8000/health           # service status
curl -i http://127.0.0.1:8000/api/openapi.json # API schema
```
Swagger UI: `http://127.0.0.1:8000/api/docs` · ReDoc: `http://127.0.0.1:8000/api/redoc`.

## Architecture

### Stack
- **Frontend:** React 19 + Vite 7, Tailwind (utility classes) + raw `theme.css` + per-component inline CSS strings. No router, no state library, no API client.
- **Backend:** FastAPI 0.110, Pydantic v2, Motor (async MongoDB), PyJWT (HS256), passlib/bcrypt, python-multipart, pytest-asyncio + httpx.
- **Database:** MongoDB Atlas (cloud) in `.env`, or local Mongo via docker-compose.
- **AI:** Google Gemini (`gemini-3.6-flash`) — model declared in `Settings`; generation is routed through `app/services/ai_service.py`, which performs ordered multi-key failover for quota/rate-limit errors.

### Backend layout (layered)
```
endpoint (FastAPI router)
    → deps (auth + get_db)
        → crud (CRUDBase[Model, Create, Update])
            → models (Pydantic Mongo models with PyObjectId)
                → db (Motor AsyncIOMotorDatabase via lifespan)
```

The `CRUDBase` class in `app/crud/base.py` is generic over `(ModelType, CreateSchemaType, UpdateSchemaType)` and handles `get`, `get_multi`, `count`, `create` (with `extra_data`), `update`, `remove`. `CRUDUser` adds identifier lookup and OTP-era upsert behavior. Password hashing and verification are handled by `app/core/security.py`. `CRUDItem` adds `get_multi_by_owner` and a `$facet` aggregation in `get_stats`.

### Authentication flow (HS256 JWT)
1. `POST /api/auth/send-otp` with `is_signup=true` starts registration for an email or phone identifier.
2. `POST /api/auth/verify-otp` with `is_signup=true` consumes the OTP and marks the pending user `otp_verified=true`; the requested candidate/recruiter role is applied at this point.
3. `POST /api/auth/register` accepts `{identifier, password, role?, full_name?}` only after signup OTP verification. It stores the bcrypt digest in `password_hash`, clears the one-time verification state, and returns an access/refresh JWT pair.
4. `POST /api/auth/login` accepts `{identifier, password}`, bcrypt-verifies candidate/recruiter `password_hash` values, and records `last_login`. Admin accounts are rejected here and must use the isolated admin route.
5. `POST /api/auth/forgot-password/send-otp` creates a reset-only OTP for an existing active candidate/recruiter. `POST /api/auth/forgot-password/reset` verifies that OTP once and replaces `password_hash` with a bcrypt digest of the submitted new password.
6. `POST /api/admin/login` (also `/api/v1/admin/login`) accepts `{identifier, password}`. The identifier must match configured `ADMIN_EMAIL` (or optional `ADMIN_USERNAME`) and the password must verify against `ADMIN_PASSWORD_HASH`; a matching database user with `role == "admin"` is also required before JWTs are issued.
7. `POST /api/admin/forgot-password` accepts an email, returns a non-enumerating success message, and, for the configured admin email, stores only a SHA-256 digest of a time-limited reset token in `admin_password_resets`. It dispatches the reset link through configured SMTP; without SMTP it returns the link solely for local development.
8. `POST /api/auth/refresh-token` accepts a refresh JWT and returns a fresh pair. No revocation list.
9. `GET /api/auth/me` returns the current active user.
10. Protected routes use `Depends(deps.get_current_active_user)`; admin-only uses `get_current_admin_user`, which requires `role == "admin"` and does not treat `is_superuser` alone as sufficient.

Tokens are signed with `SECRET_KEY` (env), `ALGORITHM=HS256`, `ACCESS_TOKEN_EXPIRE_MINUTES=1440` (24h), `REFRESH_TOKEN_EXPIRE_DAYS=7`. `type` claim distinguishes access vs refresh; `get_current_user` rejects non-access tokens.

### OTP registration and compatibility flow
Endpoint base: `/api/v1/auth`; routes are also mounted under `/api/auth` because `API_V1_STR` is `/api` in the current `.env`.
1. `POST /api/v1/auth/send-otp` is used by **Sign Up only**. It accepts `{identifier, full_name?, role?, is_signup:true}`, creates or prepares the pending candidate/recruiter profile, and writes a bcrypt-hashed OTP document with `purpose: "auth"`.
2. `POST /api/v1/auth/verify-otp` consumes that signup OTP. It sets `otp_verified=true` and binds the requested role; the frontend then calls `/register` to create the permanent password. Password sign-in never calls this OTP path.
3. Password recovery uses a distinct OTP `purpose: "password_reset"`, so a reset code cannot be used to complete registration (or vice versa). Both OTP purposes are six-digit, bcrypt-hashed, single-use, expire after `OTP_TTL_MINUTES=10`, and lock after `MAX_ATTEMPTS=5` failed checks. Development responses include `dev_code` until a delivery provider is connected.
3. `GET /api/v1/auth/me` — same as the password flow; requires a valid access JWT.

The role carried on `SendOtpRequest` is persisted on the **OTP document** and applied to the user only after successful signup verification. `password_hash` is never accepted from clients. The public `AuthForm` exposes Candidate and Recruiter only; it has no Admin tab or admin registration path. Admin password authentication is isolated from this flow and uses only `ADMIN_EMAIL` / `ADMIN_USERNAME` / `ADMIN_PASSWORD_HASH`; non-admin database roles cannot receive an admin token.

### Indian phone normalization (+91 / 91 / 0 stripping)
Both `send-otp` and `verify-otp` route through `_classify_identifier(identifier)` in `backend/app/api/v1/endpoints/auth.py`. Phone-shaped inputs are passed through `_normalize_indian_phone(digits)` which:
- accepts the already-digit-only string,
- strips a `91` prefix from 12-digit numbers, a `0` prefix from 11-digit numbers, and (defensively) a `910` prefix from 13-digit numbers,
- validates the result against `^[6-9]\d{9}$`,
- returns the cleaned 10-digit number or `None` (which surfaces as a 422).

The same logic is mirrored client-side as `normalizeIndianPhone` in `src/AuthForm.jsx` so the form can pre-validate paste inputs (`+91 9876543210`, `919876543210`, `09876543210` all collapse to `9876543210`) and submit the canonical form. The Mobile-number input is rendered with a fixed `+91` prefix box; users still sometimes paste the full E.164 form, hence the normalization on both sides.

### Gemini / chatbot config
`app/core/config.py` calls `load_dotenv(dotenv_path=BACKEND_ROOT / ".env")` at module load (resolving an absolute path so it works regardless of process CWD) and declares `GEMINI_MODEL: str = "gemini-3.6-flash"` plus the common numbered key slots `GEMINI_API_KEY_1` through `GEMINI_API_KEY_5`. `app/services/ai_service.py` scans `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, and so on in order, skips empty slots, de-duplicates values, and appends the legacy `GEMINI_API_KEY` as a final fallback. On a Gemini 429/quota/rate-limit response it retries the same request with the next key; non-quota errors fail immediately, and exhausted keys return HTTP 503 from the chatbot endpoint. A missing key configuration also returns HTTP 503. Set `GEMINI_MODEL` to a model available to the configured accounts.

The chatbot controller (`app/api/v1/endpoints/chatbot.py`) supplies a strict professional-career-guide system prompt. It keeps answers focused on career and MyCareerPath support, refuses to reveal system prompts, credentials, internal implementation or private context, does not request secrets, and treats instructions inside user history as untrusted content.

**`GEMINI_MODEL` must stay aligned across three places** — the `Settings` default in `app/core/config.py`, the fallback in `chatbot.py`, and `backend/.env`. All three currently say `gemini-3.6-flash`. Keep numbered API keys out of source control and rotate compromised keys immediately.

### Recommendation flow
Endpoint: `POST /api/recommendations/jobs` (`app/api/v1/endpoints/recommendations.py`).

Request body (`app/schemas/recommendation.py` — `RecommendationRequest`):
- `skills: List[str]` — candidate skill tags.
- `preferred_roles: Optional[List[str]]` — optional role/title keywords an item must mention.
- `limit: int` — 1-50, default 10.

Response (`RecommendationResponse`): ranked `ScoredJob[]` where each entry carries the original `ItemOut`, a `score` in `[0, 1]`, and the `matched_skills` subset.

Scoring (transparent, in-Python; no extra infra):
1. Normalize `skills` / `preferred_roles` to lowercase, trimmed, de-duplicated.
2. Pull every published item from `items` (`is_published=True`), capped at `MAX_CANDIDATE_ITEMS = 5000` for safety — swap for a Mongo aggregation / vector store once the corpus grows past that.
3. For each item, build a haystack from `title + description + tags` and compute `score = matched_skills / len(skills)`. If `preferred_roles` is set, the item must contain at least one of those keywords in the haystack (filter, not scorer — a job in the wrong domain shouldn't sneak in just because the candidate knows Python).
4. Items with zero overlap are dropped. Ties broken by `created_at` desc.
5. Top-N are re-hydrated through `crud_item.get` so the response goes through the same `ItemOut` validation as the rest of the API.

Requires an authenticated active user (`get_current_active_user`). Currently a stateless, request-driven service — does not personalize on user history.

### Application flow
Endpoints: `/api/applications/*` (`app/api/v1/endpoints/applications.py`).

Schemas (`app/schemas/application.py`):
- `ApplicationCreate` — `{ job_id, cover_letter?, resume_url? }` (resume is an `HttpUrl` on the way in, serialized back to `str` before insert).
- `ApplicationOut` — id, `job_id`, `candidate_id`, `cover_letter`, `resume_url`, `status`, plus denormalized `candidate_name` / `candidate_email` / `candidate_phone` / `job_title` for the recruiter view.
- `ApplicationStatusUpdate` — `{ status }` for the PATCH endpoint.

CRUD (`app/crud/application.py` — `CRUDApplication` extends `CRUDBase`):
- `get_for_job(job_id)` — applications for a single posting.
- `get_for_candidate(candidate_id)` — applications a candidate has submitted.
- `get_for_recruiter(owner_id, status?, job_id?)` — `$lookup` join of applications → items (scoped to `job.owner_id == owner_id`) → users, returning raw dicts with `job` / `candidate` subdocs so the endpoint can re-shape them.

Endpoint behavior:
1. `POST /api/applications/` — any active user can apply. Validates that `job_id` is a valid ObjectId, the job exists and `is_published=True`, and the caller hasn't already applied to that job (the duplicate check is a `find_one` against `(job_id, candidate_id)` so we can return a 400 instead of letting the unique index surface as a 500). Returns the new application with candidate + job hydrated.
2. `GET /api/applications/` — role-aware. Recruiters / admins / superusers get applications for jobs they own (uses the `$lookup` helper); everyone else gets their own applications. Supports `page`, `size`, `status`, `job_id` query params.
3. `GET /api/applications/{id}` — visible to the candidate who applied, the recruiter who owns the job, or any admin / superuser. 403 otherwise.
4. `PATCH /api/applications/{id}/status` — recruiter (or admin) updates the stage. New status must be in the `ALLOWED_STATUSES` set; mismatches return 400 with the allowed list.

Indexes (added in `init_db_indexes`): `unique_application_job_candidate_idx` (unique on `job_id`+`candidate_id`), `application_candidate_created_idx`, `application_status_idx`.

### Data models
**User (`users` collection)**: `_id`, `email` (unique index), `phone` (unique index), `full_name`, `password_hash` (bcrypt digest), `otp_verified`, `highest_qualification`, `education_category`, `linkedin_url`, `github_url`, `leetcode_url`, `profile_photo_url`, `state`, `district`, `local_address`, `is_active`, `is_superuser`, `role` ("candidate" | "recruiter" | "admin"), `created_at`, `updated_at`. Legacy documents may still carry `"user"` / `"manager"` or `hashed_password`.

**Item (`items` collection)**: `_id`, `title`, `description`, `price`, `tags`, `min_eligibility`, `is_published`, `owner_id` (indexed with `created_at`), `created_at`, `updated_at`. `min_eligibility` uses the ordered education hierarchy `10th Pass -> 12th Pass = ITI -> Diploma -> Undergraduate -> Postgraduate -> Doctorate`. Text index on `title` + `description`.

**Application (`applications` collection)**: `_id`, `job_id` (ref `items._id`), `candidate_id` (ref `users._id`), `cover_letter`, `resume_url`, `status` (`applied` | `screening` | `interview` | `offer` | `hired` | `rejected`, indexed), `created_at`, `updated_at`. **Unique compound index** on `(job_id, candidate_id)` enforces one application per (job, candidate) — a duplicate insert trips `E11000`, which the endpoint pre-empts with a friendlier 400.

Indexes are created on app startup via `init_db_indexes()` in `app/db/mongodb.py`.

### API endpoints (all under `API_V1_STR` or `/api/v1` via dual router mounting)
`Backend/app/main.py` explicitly mounts `api_router` under both `settings.API_V1_STR` (default `/api` in `.env`) and `/api/v1`, ensuring all routes with either prefix resolve consistently.

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/health` | none | orchestrator health check |
| POST | `/api/auth/send-otp` | none | starts email/phone OTP verification |
| POST | `/api/auth/verify-otp` | none | consumes OTP; signup verification enables password registration |
| POST | `/api/auth/register` | none | creates password-backed account after verified signup OTP |
| POST | `/api/auth/login` | none | email/phone + password login for candidate/recruiter accounts |
| POST | `/api/auth/forgot-password/send-otp` | none | send a reset-only OTP to an existing active candidate/recruiter |
| POST | `/api/auth/forgot-password/reset` | none | verify reset OTP and set a new password (minimum 8 characters) |
| GET | `/api/v1/notifications` | candidate | candidate notification drawer data plus unread count |
| PATCH | `/api/v1/notifications/{id}/read` | candidate | mark an owned notification read |
| PATCH | `/api/v1/users/notification-preferences` | user | persist `email_notifications`, `application_updates`, and `sms_alerts` flags |
| POST | `/api/v1/applications/{id}/schedule-interview` | recruiter/admin | schedule interview, create candidate notification, and attempt outbound delivery |
| POST | `/api/admin/login` or `/api/v1/admin/login` | none | isolated admin email/username + password login using `ADMIN_EMAIL`, optional `ADMIN_USERNAME`, and `ADMIN_PASSWORD_HASH` |
| POST | `/api/admin/forgot-password` or `/api/v1/admin/forgot-password` | none | issues an expiring admin reset link through SMTP (or development fallback) without exposing whether the email exists |
| POST | `/api/auth/refresh-token` | none (refresh JWT in body) | rotates both tokens |
| GET | `/api/auth/me` | user | current profile |
| GET | `/api/users/` | admin | paginated user list |
| GET | `/api/users/{id}` | user (self or admin) | |
| PUT | `/api/users/{id}` | user (self or superuser) | update profile |
| GET | `/api/users/suggested-skills` | user | Gemini-generated contextual skills with static fallback |
| POST | `/api/users/profile-photo` | user | multipart image upload; 10MB limit; stores `profile_photo_url` |
| DELETE | `/api/users/me` | authenticated user | permanently delete the caller and role-scoped owned data; returns 204 |
| GET | `/api/items/` | user | owner's items, paginated, `tag`/`search` filters |
| GET | `/api/items/public` | none | published jobs for the candidate jobs page |
| POST | `/api/items/` | user | create, including optional verified-company metadata (`company_name`, `company_website`, `company_address`, `company_tax_id`) |
| GET | `/api/items/analytics/summary` | user | Mongo `$facet` aggregation |
| GET | `/api/items/{id}` | user (owner or superuser) | |
| PUT | `/api/items/{id}` | user (owner or superuser) | |
| DELETE | `/api/items/{id}` | user (owner or superuser) | 204 |
| POST | `/api/applications/` | user | Candidate submits a wizard-validated application with a mandatory resume (one application per job/candidate) |
| GET | `/api/applications/` | user | Role-aware: recruiters see applications for their own jobs (joined w/ candidate + job), candidates see their own |
| GET | `/api/applications/{id}` | user (applicant or job owner) | |
| PATCH | `/api/applications/{id}/status` | user (job owner) | Status: applied / screening / interview / offer / hired / rejected |
| POST | `/api/chatbot/chat` | none | Gemini-powered support chat (multi-turn) |
| POST | `/api/recommendations/jobs` | user | Skill-based job ranking against published `items` (see Recommendation section) |
| GET | `/api/v1/admin/stats` | admin | Platform statistics summary |
| GET | `/api/v1/admin/overview` | admin | Platform overview metrics (candidates, recruiters, jobs, applications) |
| GET | `/api/v1/admin/users` | admin | Paginated users; `?role=candidate` / `?role=recruiter` query Mongo directly and return `full_name`, `email`, `created_at`, `is_active`, `last_login`, and live `applications_count` |
| PATCH | `/api/v1/admin/users/{user_id}` | admin | Update user role or `is_active` status |
| PATCH | `/api/v1/admin/users/{user_id}/status` | admin | Update account status: `active`, `suspended`, or `verified` |
| DELETE | `/api/v1/admin/users/{user_id}` | admin | Permanently delete user, owned jobs, and applications; returns 204 |
| GET | `/api/v1/admin/recruiters/pending` | admin | Recruiters awaiting company verification (alias: `/api/v1/admin/companies/pending`) |
| PATCH | `/api/v1/admin/companies/{user_id}` | admin | Approve or reject recruiter company verification |
| PATCH | `/api/v1/admin/recruiters/{user_id}/verify` | admin | RESTful alias for recruiter company verification |
| GET | `/api/v1/admin/jobs` | admin | Paginated job postings with owner info, company fallback (`company_name || "Company not provided"`), application counts |
| PATCH | `/api/v1/admin/jobs/{job_id}` | admin | Update or moderate job posting |
| DELETE | `/api/v1/admin/jobs/{job_id}` | admin | Delete job posting and associated applications; returns 204 |
| GET | `/api/v1/admin/reports` | admin | Platform reports (monthly registrations, applications, usage metrics) |
| GET | `/api/v1/admin/reports/jobs/export` | admin | Download CSV: Job Title, Company, Location, Date Posted, Status, Applicants Count |
| GET | `/api/v1/admin/reports/candidates/export` | admin | Download CSV: Candidate Name, Email, Qualification, Experience, Application Count |

### Frontend architecture
- `main.jsx` mounts `<App />` in StrictMode.
- `App.jsx` is a single-component shell with three layers of state: a top-level `page` (`landing | jobs | auth | dashboard | logged-out | candidate-onboarding | recruiter-onboarding | candidate-dashboard | candidate-profile`), a sub-state `recruiterView` (`overview | post-job | manage-jobs | applications | reports | settings`) that selects which component under `src/pages/Recruiter/` to render inside the dashboard, and a `chatOpen` boolean that drives the floating AI assistant. Renders a circular chat FAB (bottom-right, `var(--theme-orange)`) on every view, hidden only while the dialog is open. The dialog (`src/ChatDialog.jsx`) stays mounted (just `isOpen={false}`) so its conversation history persists across opens. No router.
- **Routing policy (landing-first, role-based post-auth)**: `page` always defaults to `"landing"` on mount, and the app does **not** auto-redirect on a `useEffect` token check. The mount effect only populates `user`; it never calls `setPage`. `handleAuthSuccess` and the header's "Go to Dashboard" CTA both route through a single `destinationForUser(me)` helper, which delegates the candidate completeness check to `isProfileComplete(me, stored)` and returns:
  - `"candidate-onboarding"` — `me.role === "candidate"` AND `isProfileComplete` is false.
  - `"candidate-dashboard"` — `me.role === "candidate"` AND `isProfileComplete` is true.
  - `"recruiter-onboarding"` — `me.role === "recruiter"` and any required company verification value (`company_name`, `company_website`, `company_address`, or `company_tax_id`) is absent.
  - `"dashboard"` — a recruiter with all company verification values, or an `"admin"`.
  - `"landing"` — defensive fallback for any other shape (e.g. legacy `"user"` / `"manager"` roles, or `me === null`).
  `isProfileComplete(me, stored)` is true if EITHER the backend `me` payload already carries a profile signal (`full_name`, `experience_level`, or non-empty `skills[]`) OR the local `mcp_profile_${userId}` cache has `onboarding_complete: true` / matching signals. This way a candidate who finished onboarding on one device but signs in fresh elsewhere still sees the dashboard as long as the backend has their profile data — and conversely a brand-new user with a blank MongoDB profile but a complete local cache still skips the wizard. Step 6 (resume / portfolio) is optional and intentionally not part of the gate. `CandidateOnboarding.onComplete` is wired in `App.jsx` to merge the updated user into both `user` state and `meRef.current`, then always advance to `candidate-dashboard` (never back to landing), so finishing the wizard never drops the user out of the app. A `goHome` helper (`() => setPage("landing")`) is the canonical "reset to landing" handler and is wired to brand logos / "Back to Home" buttons.
- **Header state sync (logged-in vs anonymous)**: Both the desktop header and the mobile drawer in `LandingPage.jsx` swap their right-side controls based on `user`. Anonymous visitors see the orange Register button and the navy-bordered Login button. Logged-in visitors see two synced controls — a deep-blue **"Go to Dashboard" pill** (calls `onDashboard`, which in `App.jsx` resolves to `destinationForUser(meRef.current || user)`) and the shared `ProfileDropdown` avatar pill — so they can either jump straight to their role-appropriate view or open the profile menu. The mobile drawer mirrors the same pair so the experience is consistent across breakpoints.
- `src/pages/Recruiter/` — recruiter dashboard views, each one a self-contained file that hooks into the design tokens declared in `theme.css` (`emp-dashboard`, `post-job-page`, `manage-page`, `applications-page`, `reports-page`, `settings-page`, `logged-out`):
  - `Empdashboard.jsx` — overview, stat cards, quick-action links.
  - `PostJobEmployeeDashboard.jsx` — visual three-step job-creation workspace: Basic Information, toolbar-styled Job Description, and Required Skills. It still submits real `api.createItem` payloads with comma-separated skills mapped to `tags[]` and verified company metadata.
  - `ManageJobsEmployeeDashboard.jsx` — reference-style management workspace with live Total / Active / Closed / Draft cards, search and status/type controls, and a detailed action table. It fetches owned jobs using `api.getItems`, and the Active / Paused control still calls `api.updateItem`.
  - `ApplicationsEmployeeDashboard.jsx` — pipeline workspace with stage sidebar, synchronized initial status filtering, **case-insensitive null-safe candidate/job search**, CSV export, and clickable candidate rows. Export uses the currently filtered list with RFC 4180 escaping and a UTF-8 BOM. Selecting a row opens the candidate summary with contact/profile details and stage controls. Schedule Interview now opens a date, time, mode, and notes form before updating the interview stage; successful shortlist, interview, hire, and rejection actions show a top-center checkmarked toast.
  - `ReportsEmployeeDashboard.jsx` — analytics workspace with live recruiter job/application aggregation, live summary cards, monthly applications bar chart, and job conversion-performance table. The table shows five rows initially and expands through a working View All Jobs Performance toggle.
  - `RecruiterOnboarding.jsx` — mandatory two-step recruiter setup, shown after OTP verification until Company Name, Website, Address, Tax ID / Registration Number, Full Name, Job Title, Email, and Phone have been saved through `api.updateProfile`. It has a sticky brand header and sign-out control, then routes directly to the recruiter dashboard after success.
  - `SettingsEmployeeDashboard.jsx` — recruiter settings workspace with a left sub-menu (My Profile, Company Profile, Account & Security, Notification Preferences). My Profile now renders a top avatar header card with a 112px circular image or initials, supports local JPG/PNG upload previews up to 2MB, stores `avatar_url` on the live profile state, and syncs it into the top-level `onUpdateUser` payload so the recruiter header and dropdown update immediately. Its **Edit information** form updates company name, website, address, tax ID, job title, email, and phone through `api.updateProfile`. It also embeds the shared `DangerZone` account-deletion control.
  - `LoggedOut.jsx` — sign-out landing.
- The recruiter dashboard chrome lives inline in `App.jsx` under the `page === "dashboard"` branch — there is no `RecruiterDashboard.jsx` file. It uses a white top bar with workspace tabs, a deep-blue responsive sidebar with the six recruiter views, notification control, and `ProfileDropdown`. The overview in `Empdashboard.jsx` fetches recruiter items, applications, and `/reports/metrics` together so Total Jobs, Active Jobs, Applications, and Hired Candidates stay live; quick actions route through the existing `onNavigate` callback.
- `src/AuthForm.jsx` — Candidate/Recruiter-only auth portal. **Sign In** preserves the Email/Mobile toggle but sends `{identifier,password}` directly to `POST /api/v1/auth/login`; it has no OTP step. **Sign Up** is strictly three stages: identifier/full name → `send-otp`, OTP verification → `verify-otp`, then permanent password → `register`. An unexpected admin initial role is clamped to Candidate.
  - Candidate: "Roles matched to your skills, tracked in one place."
  - Recruiter: "Manage pipelines, shortlists, and interviews."
  Enforces 10-digit Indian mobile validation (`^[6-9]\d{9}$`) and sends the role and registration status (`is_signup`) in the payload. The mobile value is normalized via the shared helper `normalizeIndianPhone` in the same file (strips `+91` / `91` / `0` prefixes) before send-otp — mirroring the server-side helper in `backend/app/api/v1/endpoints/auth.py._normalize_indian_phone`.
- `src/components/AdminLoginModal.jsx` — modal opened by the App-owned public-footer **Important Links → 🔒 Admin Portal** control. It accepts email/username and password, signs in through `api.adminLogin()` (`POST /api/v1/admin/login`), stores the returned JWT pair, and calls App's normal post-auth handler. Its **Forgot Password?** view calls `api.requestAdminPasswordReset()` (`POST /api/v1/admin/forgot-password`) and presents a generic confirmation.
- `src/components/NotificationBell.jsx` — candidate-header notification bell. It polls `GET /api/v1/notifications`, displays an unread badge and dropdown drawer, and calls `PATCH /api/v1/notifications/{id}/read` when an unread item is selected.
- Candidate `AccountSettings.jsx` and recruiter `SettingsEmployeeDashboard.jsx` provide persisted Email Notifications, Application Updates, and SMS / WhatsApp Alerts toggle switches plus **Save Preferences**. Both call `PATCH /api/v1/users/notification-preferences`; interview dispatch respects the candidate's saved `application_updates`, `email_notifications`, and `sms_alerts` flags before using SMTP or SMS providers.
- Interview scheduling in `ApplicationsEmployeeDashboard.jsx` posts the modal's date/time/mode/notes to `POST /api/v1/applications/{id}/schedule-interview`. The backend updates the application to `interview`, writes an unread `notifications` document for the candidate, and makes best-effort SMTP email plus Twilio or Fast2SMS delivery when configured; in-app delivery is retained even when external channels are unavailable.
- `src/components/modals/ForgotPasswordModal.jsx` — opened from AuthForm's **Forgot Password?** link. It sends `sendPasswordResetOtp({identifier})`, then verifies the reset OTP and posts the new password through `resetPassword({identifier,code,password})`; success closes the modal and returns the user to Sign In.
- `src/api.js` — thin `fetch` wrapper around the FastAPI backend. Exposes public `login`, `register`, OTP `sendOtp` / `verifyOtp`, recovery `sendPasswordResetOtp` / `resetPassword`, admin `adminLogin` / `requestAdminPasswordReset` / `downloadAdminReport`, `me`, `refresh`, `listItems`, `getItems`, `getPublicJobs`, `getSuggestedSkills`, `createItem`, `updateProfile`, `uploadProfilePhoto`, `deleteAccount`, `getApplications`, `createApplication`, and `chat`. `getAdminUsers()` and CSV downloads use `_adminHeaders()` to send the resolved Bearer token. It supports JSON and multipart `FormData` requests, transparent `/api/v1` -> `/api` fallback, and tokens in `localStorage` under `mcp_access_token` / `mcp_refresh_token`.
- `mycareerpath-admin/src/views/Reports.jsx` is the active integrated Admin Reports view (there is no `src/pages/Admin/AdminReports.jsx`). It loads live twelve-month registration and application series from `GET /api/v1/admin/reports`, normalizes each series into bar-chart heights, and turns the Job/Candidate **Generate report** buttons into Blob-backed browser downloads.
- `App.jsx` restores the authenticated user's role-appropriate destination on hard refresh by calling `destinationForUser(me)` after `/auth/me` succeeds; invalid sessions are cleared.
- `src/ChatDialog.jsx` — full chat UI for the AI support assistant. Calls `api.chat({ message, history })` on every send, passing the full transcript minus the current user turn (the backend appends the current user message itself). Maintains conversation memory in `useState`; auto-scrolls to the latest message; auto-focuses the input on open; binds `Esc` to close; supports `Enter` to send and `Shift+Enter` for newlines; surfaces loading dots while waiting and a "Clear" button to reset. Stays mounted across opens so the prior conversation reappears.
- `src/pages/Candidate/UserProfile.jsx` — candidate profile page featuring Contact Info, Education, Skills, Certifications, Work Experience, and My Activities. Contact details can be edited through `EditContactModal`, updating email, phone, State -> District -> City, local address, headline, and LinkedIn, GitHub, LeetCode, and portfolio URLs. The profile avatar has a bottom-right Lucide Pencil upload badge, supports image upload through `api.uploadProfilePhoto`, renders `profile_photo_url`, and embeds the shared `DangerZone` account-deletion control.
- Candidate rich profile fields (`experience_level`, `resume_url`, `skills`, `education`, and `certifications`) are included in the backend `UserInDB`, `UserUpdate`, and `UserOut` models so onboarding/profile updates persist across devices.
- `src/pages/Candidate/CandidateOnboarding.jsx` — adaptive 6-step candidate onboarding wizard that collects name, DOB/gender/email, education level (from a fixed qualification dropdown), experience level, skills (with AI suggested chips), and optional resume/portfolio. The selected qualification is saved as `highest_education.degree` and in the local `education` profile entry. Updates user profile via `api.updateProfile` and saves rich properties to `localStorage`. The wizard always renders a sticky top header (MyCareerPath logo + `← Back to Home` button) wired to an `onBack` prop — `App.jsx` passes `goHome` so the candidate can always exit back to the landing page without finishing the flow.
- `src/pages/Candidate/CandidateDashboard.jsx` — candidate dashboard containing a dark navy header, a left sidebar with a full-width search card immediately above the Filter Jobs card, recommended job matching cards (with circular Fit Score badges), and a right profile summary sidebar showing profile strength and recent application stats. The sidebar keeps draft `searchQuery` separate from submitted `activeSearchQuery`; the Search button applies the trimmed draft to the job feed. It token-matches title, company, description, skills/tags, and location case-insensitively, so `Python developer` matches a Python skill tag and `Senior Full Stack` matches `Senior FullStack Developer`. A non-empty search intentionally bypasses the date filter, while absent `created_at` values fall back to the current time. Its dynamic no-results card offers **Clear Filters & Search**, which resets all sidebar constraints. Header **Home** returns to `candidate-dashboard`, **Jobs** opens the public jobs page, and both **Manage Profile** and the avatar menu open `candidate-profile`. The recommended cards are API-fed from `api.getPublicJobs()` and preserve `company_name`, `tags`, and `min_eligibility`; `GET /api/items/public?search=` additionally performs escaped, case-insensitive Mongo regex matching across job fields. Applying opens `ApplicationWizardModal`: Step 1 reviews job details, Step 2 blocks missing education and compares the candidate's qualification against `min_eligibility`, Step 3 requires a resume file or saved profile resume, and Step 4 requires confirmation. On success the card becomes a disabled green `Applied` badge.
- `LandingPage.jsx` and `JobsPage.jsx` use `lucide-react` icons (declared in `package.json`).
- `src/components/Footer.jsx` is the comprehensive dark-blue public footer. Its four columns are **Important Links** (Employer Home, About Us, Contact Us, Fraud Alert, and 🔒 Admin Portal), **Job Seekers**, **Resources**, and **Employers**. It also includes the Download MyCareerPath/Get App banner, partner-institution badges (including P. R. Pote Patil College of Engineering), and copyright/policy/social strips. `App.jsx` renders it exclusively with the public landing view and passes `onOpenAdminLogin={() => setShowAdminLogin(true)}`. Candidate, recruiter, and admin dashboard branches render only their compact one-line copyright strips.
- `LandingPage` accepts `user`, `onProfile`, `onDashboard`, `onSettings`, `onLogout`, and `onRecruiters` props (in addition to `onLogin` / `onRegister` / `onExploreCategorySelect`). `App.jsx` passes mode-aware auth handlers: Register opens `initialMode="signup"`, Login opens `initialMode="signin"`, and For Recruiters opens `initialMode="signin"` with `initialRole="recruiter"`. Its desktop header and mobile drawer show **two synced logged-in controls** when `user` is truthy — a deep-blue **"Go to Dashboard" pill** (calls `onDashboard`) and the shared `ProfileDropdown` avatar pill — that together replace the Register / Login pair anonymous visitors see. `onDashboard` resolves through `destinationForUser(user)` in `App.jsx` so the same button routes a candidate to the dashboard (or onboarding if their profile is still blank) and a recruiter/admin straight into the recruiter dashboard shell. Logged-out users see the orange Register button and the navy-bordered Login button as before. `App.jsx` passes the live `user` state and routes the dropdown's profile, dashboard, settings, and sign-out actions appropriately.
- `JobsPage.jsx` is retained as a legacy static module; the App Jobs tab uses `src/pages/Candidate/JobsExplorer.jsx` for the live filtered experience.
- `src/pages/Candidate/JobsExplorer.jsx` is backed by `GET /api/items/public` and provides search plus Date Posted, Domain / Category, Distance, Work Mode, and Experience filters with Clear all.
- `src/utils/eligibility.js` provides the Indian education ranking (`10th Pass -> 12th Pass = ITI -> Diploma -> Undergraduate -> Postgraduate -> Doctorate`) and exports `isEligible(userEdu, minJobEdu)` plus normalization/rank helpers. Indian degree labels such as `B.E. / B.Tech`, `Polytechnic Diploma`, `M.Sc / M.C.A.`, and `Ph.D. / Doctorate` normalize to their top-level ranks. Empty or `Not provided` education is always ineligible.
- `src/components/modals/EducationPreferencesModal.jsx` uses Indian qualification options with dependent branch values and supports an explicit "Other" qualification value. `AddEducationModal.jsx` remains a compatibility re-export.
- `src/components/modals/EditSkillsModal.jsx` loads contextual suggestions from `GET /api/users/suggested-skills`, displays the static catalog while loading/failing, and exposes `Regenerate with AI`. The endpoint calls the failover `AIService` with role, education, and preferred-title context and returns a static 12-skill fallback when Gemini is unavailable.
- `src/components/modals/AddCertificationModal.jsx` requires a non-empty credential ID or URL and displays the inline error `Credential ID or URL is required.`. Backend `Certification` validation accepts `credential_id`, `credential_url`, and legacy `credentialUrl`, requiring at least one.
- `src/utils/locations.js` provides dependent State -> District -> City choices for the candidate profile editor.
- Candidate search and profile form fields use explicit `id`, `name`, and `autoComplete` attributes; jobs without `created_at` are treated as newly posted by date filters.
- `src/components/Recruiter/ApplicantModal.jsx` is the employer applicant-inspection surface: it shows the candidate photo, education, matched required skills, LinkedIn/GitHub/LeetCode links, resume, and pipeline actions. `ApplicationsEmployeeDashboard.jsx` includes an explicit `🔄 Refresh Data` control.
- Candidate, employer, and admin dashboard shells end with a compact one-line copyright strip. The admin overview and recruiter overview expose explicit `🔄 Refresh Data` controls that rerun their data requests.
- `Backend/app/api/v1/endpoints/users.py` exposes authenticated `POST /api/users/profile-photo`. It accepts image uploads, rejects unsupported types, enforces a streamed 10MB maximum, stores files under `Backend/uploads/profile_photos`, and updates `users.profile_photo_url`. `Backend/app/main.py` serves that directory at `/uploads`.
- `App.jsx` records top-level and dashboard subview navigation in hashes such as `#candidate-dashboard`, `#dashboard/recruiter/applications`, and `#dashboard/admin/users`. `popstate` and `hashchange` restore page/subview state without clearing authentication; Jobs/profile back actions return to the authenticated role dashboard.
- Landing search fields are controlled and submit `{ role, experience, location }` into App state; that state initializes JobsExplorer or the candidate dashboard feed. Candidate job locations use `item.location || item.address || item.company_address || "Amravati"` and compare location queries case-insensitively.
- `src/pages/Candidate/AccountSettings.jsx` is the candidate-only Settings destination for notification preferences, profile visibility, OTP sign-in information, and account deletion; My Profile remains the detailed profile/activity view.
- `theme.css` defines a single design system (`--theme-cream/navy/orange/...`) used inconsistently with Tailwind classes and ad-hoc inline `style={}`.
- `mycareerpath-admin/` is a dedicated Vite admin control center, integrated directly into the main `App.jsx` when `user?.role === "admin"`. The admin shell renders an isolated navy Sidebar, Topbar, and one of seven views (Dashboard, Manage Users, Company Approvals, Job Posts, Platform Activity, Reports, System). In the primary web app, access starts at the footer-only password-based Admin Portal; the standalone legacy admin package still has its own older OTP screen and should not be used as the primary auth entry point.
  - **Base API URL Prefix Alignment (`/api/v1/admin`)**:
    All admin API helper functions in `src/api.js` use the `/api/v1/admin/*` prefix:
    * `getAdminStats()` -> GET `/api/v1/admin/stats`
    * `getAdminOverview()` -> GET `/api/v1/admin/overview`
    * `getAdminUsers(params)` -> GET `/api/v1/admin/users` (supports `page`, `size`, `role`, `search`; always supplies an admin Bearer token)
    * `updateAdminUser(userId, payload)` -> PATCH `/api/v1/admin/users/{user_id}` (update role or is_active)
    * `updateUserStatus(userId, status)` -> PATCH `/api/v1/admin/users/{user_id}/status` (status: `"active"` | `"suspended"` | `"verified"`)
    * `deleteAdminUser(userId)` -> DELETE `/api/v1/admin/users/{user_id}` (deletes user, owned jobs, and applications)
    * `getAdminPendingCompanies()` -> GET `/api/v1/admin/recruiters/pending` (alias: `/companies/pending`)
    * `decideAdminCompany(userId, payload)` -> PATCH `/api/v1/admin/companies/{user_id}`
    * `verifyRecruiter(userId, approved, reason)` -> PATCH `/api/v1/admin/recruiters/{user_id}/verify` (RESTful alias)
    * `getAdminJobs(params)` -> GET `/api/v1/admin/jobs` (supports `page`, `size`)
    * `updateAdminJob(jobId, payload)` -> PATCH `/api/v1/admin/jobs/{job_id}` (moderation / unpublish)
    * `deleteAdminJob(jobId)` -> DELETE `/api/v1/admin/jobs/{job_id}` (deletes job and applications)
    * `getAdminReports()` -> GET `/api/v1/admin/reports` (platform monthly registrations, applications, and usage)
    * `downloadAdminReport("jobs" | "candidates")` -> authenticated Blob download from `/api/v1/admin/reports/jobs/export` or `/api/v1/admin/reports/candidates/export`
  - **Authorization Bearer Headers & Multi-Key Token Resolution**:
    * `getAuthToken()` in `src/api.js` inspects `localStorage` across keys: `token`, `access_token`, `mcp_access_token`, and `mcp_admin_token` to guarantee valid token resolution regardless of which portal or key stored the session.
    * `auth.setTokens()` keeps `token`, `access_token`, `mcp_access_token`, and `mcp_admin_token` in sync. `auth.clear()` cleanly wipes all keys.
    * `request()` automatically attaches `headers.Authorization = 'Bearer ${token}'` whenever `auth: true` is specified.
    * **Hardened Admin Auth Injection**: `src/api.js` now uses an explicit `_adminHeaders()` helper to explicitly inject `Authorization: Bearer <token>` into `headers` for all admin endpoints. This acts as a belt-and-suspenders guarantee on top of `auth: true`.
    * **CORS-aligned Base URL**: `API_BASE` fallback updated from `127.0.0.1:8000` to `localhost:8000` to exactly match the `BACKEND_CORS_ORIGINS` list.
    * Transparent 404 prefix fallback: if a request to `/api/v1/...` receives a 404, `request()` retries against `/api/...` to accommodate alternate base prefixes.
  - **Data Mapping & Schema Normalization**:
    * `getAdminUsers()` normalizes candidate & recruiter names (from `full_name`, `profile_name`, `name`, recruiter company, or email prefix fallback), registered email (`email || registered_email || phone`), company name (`company_name || company`), and application counts (`applications_count ?? applications`).
    * `getAdminPendingCompanies()` normalizes company names, full names, and registered emails.
    * `getAdminJobs()` guarantees `title` fallback and sets `company_name: job.company_name || job.company || "Company not provided"`.
    * Backend `Backend/app/api/v1/endpoints/admin.py`:
      - `GET /users` accepts `?role=candidate` / `?role=recruiter`, dynamically computes `applications_count` for each user (for candidates, counts applications submitted; for recruiters, counts applications across all owned jobs), and returns the table metadata including `last_login` when available.
      - `GET /reports/jobs/export` and `GET /reports/candidates/export` aggregate live MongoDB job/candidate data and return UTF-8-BOM CSV attachments.
      - `GET /recruiters/pending` is decorated as an alias for `GET /companies/pending`.
      - `GET /jobs` aggregates owner details, applies fallback to owner company or `"Company not provided"` for `company_name`, and populates `applications_count`.
    * Admin views in `mycareerpath-admin/` (`Users.jsx`, `Jobs.jsx`, `CompanyApprovals.jsx`) map and display normalized values (company name fallback in tables and CSV exports, candidate/recruiter names, accurate live application counts).
- Admin access can be seeded or promoted idempotently with `Backend/venv/Scripts/python.exe Backend/scripts/create_admin.py --phone "9850339411"`; the script canonicalizes Indian phone formats and sets both `role="admin"` and `is_superuser=true`. OTP auth normalizes phone identifiers before role checks and gives admin login failures an actionable seed-script fallback.

### Shared profile navigation

Recruiter header navigation uses an explicit `applicationFilter`: Candidates opens all applications, while Interviews opens the `interview` stage directly in `ApplicationsEmployeeDashboard`.

- `src/components/ProfileDropdown.jsx` provides the common circular-avatar menu used in candidate and recruiter dashboard headers. It is positioned at `top-12 right-0`, shows name/headline plus email/phone, renders the user’s uploaded `avatar_url` when present, falls back to initials otherwise, invokes supplied My Profile, Dashboard, Settings, and Sign out callbacks, and closes on outside clicks or `Esc`.
- `CandidateDashboard.jsx`, `UserProfile.jsx`, and the recruiter dashboard shell in `App.jsx` use this component instead of separate top-right profile and sign-out controls.
- `App.jsx` owns the role-aware callbacks: **My Profile** and **Settings** route candidates to `candidate-profile` (`UserProfile.jsx`), while recruiters and admins route to the recruiter dashboard's `settings` view (`SettingsEmployeeDashboard.jsx`). Recruiter accounts must never be sent to the candidate resume profile. Recruiters with incomplete company verification are instead gated by `destinationForUser` into `recruiter-onboarding`.
- `src/components/DangerZone.jsx` is shared by candidate and recruiter profile screens. The user must type the exact uppercase word `DELETE` and accept a final browser confirmation before it calls `api.deleteAccount`. After a successful deletion, `App.jsx` clears auth tokens and the local rich-profile cache, then shows `logged-out`.

### Application workflow and recruiter metrics

- `Backend/app/api/v1/endpoints/applications.py` supports authenticated application creation, candidate/recruiter-scoped listing, and recruiter-owned stage updates (`Applied`, `Screening`, `Interview`, `Hired`, `Rejected`). The project's active v1 router file is `Backend/app/api/v1/api.py`; it mounts these routes at `/applications` under `API_V1_STR` (currently `/api` in `Backend/.env`).
- `Backend/app/api/v1/endpoints/reports.py` exposes `/reports/metrics` for recruiter-owned open-job, current-week application/interview, and current-month hire totals. `Empdashboard.jsx` reads it through `api.getRecruiterMetrics()`, while `ApplicationsEmployeeDashboard.jsx` updates stages through `api.updateApplicationStatus()`.
- `Backend/app/api/v1/endpoints/reports.py` also exposes recruiter-scoped `GET /reports/monthly-applications`. It aggregates owned `items` through a `$lookup` of linked `applications`, groups application `created_at` values by UTC month, and returns exactly seven zero-filled monthly buckets. `ReportsEmployeeDashboard.jsx` consumes it through `api.getMonthlyReports()` for the live Applications Overview bars and values.
- The canonical stored application stages are lowercase (`applied`, `screening`, `interview`, `hired`, `rejected`); the recruiter UI presents their title-cased labels.
- Recruiter application responses denormalize candidate contact/profile fields when present (`location`, `headline`, `skills`, `experience_level`, education, portfolio, certificates) so the inspection modal can make a role-appropriate assessment without exposing an unrestricted user endpoint. Fields not stored on an account remain optional and render as "Not provided".
- `DELETE /api/users/me` derives its scope solely from the authenticated caller. Recruiter deletion removes applications linked to the caller's jobs, then those jobs, then the user document. Candidate deletion removes applications whose `candidate_id` is the caller, then the user document. The endpoint returns `204 No Content`.

## Environment variables (`.env`)
```
PROJECT_NAME=...
API_V1_STR=/api                  # ⚠ config.py default is /api/v1 — keep these in sync
SECRET_KEY=<real value committed>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
REFRESH_TOKEN_EXPIRE_DAYS=7
MONGODB_URL=mongodb+srv://<user>:<pw>@mycareerpathcluster.crwiisa.mongodb.net/?appName=MyCareerPathCluster
DATABASE_NAME=career_path_db
MIN_POOL_SIZE=10
MAX_POOL_SIZE=100
BACKEND_CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000","http://localhost:8000","http://localhost:5173"]
GEMINI_API_KEY=<real value committed>   # declared on Settings; consumed by /api/chatbot/chat
GEMINI_API_KEY_1=<optional failover key>
GEMINI_API_KEY_2=<optional failover key>
GEMINI_API_KEY_3=<optional failover key>
GEMINI_API_KEY_4=<optional failover key>
GEMINI_API_KEY_5=<optional failover key>
GEMINI_MODEL=gemini-3.6-flash
ADMIN_EMAIL=<isolated admin email>
ADMIN_USERNAME=<optional isolated admin username>
ADMIN_PASSWORD_HASH=<bcrypt hash for the isolated admin password>
ADMIN_RESET_TOKEN_EXPIRE_MINUTES=30
FRONTEND_BASE_URL=http://localhost:5173
SMTP_HOST=<optional SMTP host for reset emails>
SMTP_PORT=587
SMTP_USERNAME=<optional SMTP username>
SMTP_PASSWORD=<optional SMTP password>
SMTP_FROM_EMAIL=<sender address>
SMTP_USE_TLS=true
```

## Known Red Flags & Code Smells

### Security (highest priority)
- **Real secrets committed in `.env`**: Atlas password `7AbjB97HZZT2uSc8`, `SECRET_KEY`, and `GEMINI_API_KEY` are real values in the tracked `.env`. `.gitignore` excludes `.env` but the file is in the working tree. **Rotate all three before any push.**
- `SECRET_KEY` default in `config.py` (`"super-secret-jwt-key-change-in-production-min-32-chars-long"`) matches `.env` — there's no way to detect that env failed to load.
- bcrypt 4.0.1 pinned with passlib 1.7.4 — known to raise `AttributeError: module 'bcrypt.__about__' has no attribute '__version__'`. Will break `pwd_context.hash` on first password create.
- No refresh-token revocation / blacklist; leaked refresh tokens live 7 days.
- CORS is explicit (good), but `allow_methods=["*"]` + `allow_credentials=True` is wide.

### Backend
- `API_V1_STR` prefix handling: `.env` specifies `/api`, while `config.py` defaults to `/api/v1`. `Backend/app/main.py` resolves this by mounting `api_router` under both `settings.API_V1_STR` and explicitly under `/api/v1`. Client-side `src/api.js` and `mycareerpath-admin/src/api.js` also provide automatic 404 fallback between `/api/v1/` and `/api/`.
- **`DuplicateKeyError` on `unique_user_phone_idx` / `unique_user_email_idx` with `dup key: { phone: null }`**: `UserInDB` declares `phone: Optional[str] = None` / `email: Optional[EmailStr] = None`, so a naive `model_dump` writes the field as an explicit JSON `null`. That defeats the indexes' `sparse=True` flag — sparse only skips docs where the field is *absent*, not where it is `null` — and every new user with no phone on file lands at `{phone: null}`. The second one trips `E11000`. Fix is in two layers: (1) `CRUDBase.create` now does `model_dump(by_alias=True, exclude_none=True)` and strips `None`s from `extra_data`, so the field is *absent* in the doc and sparse works; (2) `init_db_indexes` defensively drops both unique indexes on startup and de-dupes orphaned `{phone: null}` / `{email: null}` docs (keep oldest by `created_at`, `$unset` on the rest) before recreating them as sparse. The de-dupe is idempotent and only fires when more than one such doc exists. Symptom looks like a Mongo write failure inside `send-otp`'s `crud_user.upsert_by_identifier` → `super().create` path — the pymongo traceback bottoms out at `_insert_one`.
- `crud_item.get_stats` returns a raw MongoDB `dict`; the route response model is implicit. Should be a Pydantic `ItemStats` schema.
- `CRUDBase.update` doesn't validate write concerns; concurrent updates can race.
- No global exception handlers — unhandled `pymongo`/`motor` errors leak as 500s with stack traces.
- `__pycache__/` directories are committed at multiple levels.
- No rate limiting on `/auth/login` or `/auth/register` (brute-force surface).
- Test suite has only `tests/test_auth.py`; items, users, analytics, refresh rotation, admin authorization, `/api/recommendations/jobs`, and the entire `/api/applications/*` surface (create, list, get, status update, dedupe, role-aware branching) are uncovered.
- `/api/recommendations/jobs` scores items in Python with substring matching against `title + description + tags`, capped at `MAX_CANDIDATE_ITEMS = 5000`. Works fine for a small corpus but will need a Mongo aggregation or a dedicated vector store once the `items` collection grows past that ceiling — until then a single request pulls every published doc into memory.

### Frontend
- `PostJobEmployeeDashboard.jsx` and `ManageJobsEmployeeDashboard.jsx` are **wired to the API** (`api.createItem` / `api.getItems` respectively). `App.jsx` bumps a `jobsRefreshToken` counter after a successful create so the manage view refetches automatically.
- `Empdashboard.jsx` and `ReportsEmployeeDashboard.jsx` under `src/pages/Recruiter/` are wired to live analytics (`api.getRecruiterMetrics()` and `api.getMonthlyReports()`). `SettingsEmployeeDashboard.jsx` is wired to `api.updateProfile` for recruiter company and contact updates.
- **`JobsPage.jsx` is 900+ lines** mixing presentation, ~470 lines of inline `<style>` CSS string, and large static data tables. Not modular, not data-driven, not wired to the backend.
- No router (URL state), no global error boundary. Auth state is real (JWT pair in `localStorage`) and there is a thin `fetch` client in `src/api.js`, but no interceptor.
- `build.log` / `devserver.log` are tracked at the repo root (not in `.gitignore`).
- Mixed styling: Tailwind utilities, `theme.css` variables, raw inline `style={...}` — inconsistent.

### Workspace hygiene
- **Stray version-named files** (`0`, `0.0.9`, `0.110.0`, `0.23.5`, `0.27.0`, `1.0.1`, `1.7.4`, `2.0.0`, `2.2.0`, `2.7.0`, `2.8.0`, `3.3.0`, `4.1.0`, `4.6.0`, `8.1.1`, `0.28.0`, `0.110.0`) in `backend/` root look like accidental output from mis-typed CLI commands. **Do not delete** (per user instruction) — they may belong to something else, but flag them when relevant.

## Working in this repo — practical notes
- **VS Code Python interpreter**: select `backend/venv/Scripts/python.exe` (Windows) — *not* a system Python. Create it with `python -m venv backend/venv` from the repo root if it doesn't exist, then `backend/venv/Scripts/pip install -r backend/requirements.txt`. Without this, Pylance / debug sessions import a stale interpreter that may lack `pydantic`/`motor`/`fastapi` and lead to misleading "module not found" errors. Confirm in the status bar (bottom-right) shows the venv path, e.g. `Python 3.11.9 ('venv': venv)`.
- Before changing auth or env: confirm the `.env` matches `config.py` defaults, otherwise routes will 404 or fail silently.
- When adding a new endpoint, follow the layering: endpoint → deps → crud → model. Reuse `CRUDBase`; only add to a CRUD subclass if the operation is entity-specific.
- When changing `UserInDB` / `ItemInDB` / `ApplicationInDB`, remember the `PyObjectId` annotation in `app/models/common.py` — it serializes `ObjectId` to string for JSON output.
- Mongo index changes belong in `init_db_indexes()` (idempotent on startup).
- For the frontend: before adding features, decide whether to introduce a router (suggested: `react-router-dom`) and an API client (`src/api.js` is the existing thin `fetch` wrapper — extend it rather than open-coding `fetch`). The recruiter shell is currently state-driven (`page` + `recruiterView` in `App.jsx`); adding a new sub-page means dropping a new component into `src/pages/Recruiter/`, registering it in `RECRUITER_VIEWS` / `RECRUITER_NAV` in `App.jsx`, and adding a matching CSS hook in `theme.css` if you want the existing design tokens.
- Don't push `.env`; if you change secrets, document the rotation in `MEMORY.md` only if it's non-obvious.

## Recent Updates & Changelog (September 2026)

### 1. AddCertificationModal State Decoupling (`src/components/modals/AddCertificationModal.jsx`)
- Refactored `issueMonth` and `issueYear` into explicit, independent top-level `useState` variables initialized from `initial.issueDate` or fallback fields.
- Replaced the single composite `MonthYearPicker` for issue dates with two direct, controlled `<select>` dropdowns bound to `issueMonth` and `issueYear`.
- Ensured form validation and save handlers construct ISO date format (`YYYY-MM`) correctly without state synchronization delay.

### 2. Admin API Hardening & Token Multi-Key Fallbacks (`src/api.js`)
- Admin endpoints updated to target `/api/v1/admin/*` (`/stats`, `/overview`, `/users`, `/recruiters/pending`, `/jobs`, `/reports`).
- Added `_adminHeaders()` helper that safely checks all token slots (`token`, `access_token`, `mcp_access_token`, `mcp_admin_token`, and `getAuthToken()`) to guarantee `Bearer <token>` presence.
- Added client-side normalization for Admin User lists (`full_name`, `company_name`, `applications_count`) and Admin Job listings (`company_name || 'Company not provided'`).
- Cleaned technical API text from candidate feeds ("· GET /api/items/public" stripped from `CandidateDashboard.jsx`).

### 3. React Native Mobile App Scaffolding (`MyCareerPathMobile/`)
- Scaffolded Expo React Native app structure under `MyCareerPathMobile/`.
- Configured NativeWind v4 styling, Tailwind theme variables matching web brand palette (`#0F1E36` Navy, `#FF6B00` Orange).
- Secure storage layer (`services/api.js`) using `expo-secure-store` with dynamic backend baseURL (`10.0.2.2:8000` for Android emulator / local IP fallback).
- Role-based React Navigation in `navigation/AppNavigator.js` with Tab navigators for Candidates, Recruiters, and Admins alongside OTP Authentication flow (`screens/AuthScreen.js`, `screens/CandidateHomeScreen.js`, `screens/RecruiterApplicationsScreen.js`, `screens/AdminDashboardScreen.js`).

### 4. Code Review & System Audit Findings
- **Auth & Route Guarding**: Noted that `App.jsx` resets `page` state to `"landing"` on hard refresh even when authenticated; documented recommendation to restore view using `destinationForUser(me)`.
- **UI/UX & Linters**: Identified missing `id` and `name` attributes across candidate dashboard search inputs and contact modal fields.
- **Error Handling**: Flagged `formatAuthError` reference in `AuthForm.jsx` (which should map to `formatAccountError`).
- **Profile Schema Persistence**: Documented candidate rich profile fields (`skills`, `certifications`, `education`, `experience_level`) being stored in `localStorage` rather than MongoDB models in `app/schemas/user.py`.

### 5. MyCareerPath Logo Branding Across Web & Mobile
- **Browser Favicon & Title (`index.html`)**: Configured `<link rel="icon" type="image/png" href="/assets/logo.png" />` and set tab title to `"MyCareerPath — Local Opportunities, Brighter Tomorrows"`.
- **Global Navbar Component (`src/components/Navbar.jsx`)**: Created a reusable responsive header component featuring the official logo, brand tagline, role badges, and authentication/dashboard CTAs.
- **Web Portals (`LandingPage.jsx`, `CandidateDashboard.jsx`, `App.jsx`, `Sidebar.jsx`)**: Replaced generic or placeholder text/icons with the official `logo.png` image across Public Landing, Candidate Header, Recruiter Workspace Header, and Admin Sidebar.
- **Mobile Application (`MyCareerPathMobile/`)**: Synchronized `logo.png` to mobile assets and integrated brand logo graphics into `AuthScreen.js` and `CandidateHomeScreen.js`.

### 6. Centralized Email & SMS Notifications
- `Backend/app/services/notification_service.py` owns all transactional SMTP, Twilio, and Fast2SMS delivery. It reads `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER` (or legacy `SMTP_USERNAME`), `SMTP_PASSWORD`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_PHONE_NUMBER` (or legacy `TWILIO_FROM_NUMBER`) only from environment-backed settings.
- Every dispatch re-reads the recipient's MongoDB `notification_preferences`; `email_notifications` and `sms_alerts` gate their channels, while `application_updates` additionally gates application/interview alerts. Missing preferences default to enabled for existing accounts.
- OTP signup and password recovery dispatch through the service. New applications notify the job owner; candidate status changes and interview schedules create in-app notifications plus preference-aware email/SMS. Provider failures are recorded as delivery status and never roll back the workflow.
- Configure credentials in `Backend/.env` from `Backend/.env.example`. Do not commit credentials. Delivery smoke tests require real, authorized sample destinations; without credentials the API returns its normal development OTP code and records `not_configured` delivery.
