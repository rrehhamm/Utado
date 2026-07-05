# Utado

A Letterboxd-inspired social platform for music lovers. Log every song you listen to, rate it, review it, and see what the people around you are hearing.

This repo covers **Phase 1 (Core Data & Auth)**, **Phase 2 (Ratings, Reviews & Diary)**, **Phase 3 (Follow Graph, Likes, Comments & Feed)**, **Phase 4 (Lists & Discovery)**, and **Phase 5 (Stats & Badges)** of the MVP build, plus the full marketing landing page. This completes the originally planned 5-phase MVP roadmap.

## Stack

- **Frontend**: Next.js (App Router) + TypeScript + Tailwind CSS — `packages/frontend`
- **Backend**: Node.js + Express + TypeScript — `packages/backend`
- **Shared**: TS types + zod schemas shared by both — `packages/shared`
- **Database**: PostgreSQL
- **Cache/Feeds**: Redis (still provisioned via Docker Compose but not yet used — the Phase 3 feed queries Postgres directly; Redis is reserved for caching the feed once it needs to scale past a direct query)

## Prerequisites

- Node.js 20+
- Docker Desktop (for local Postgres + Redis)

## Setup

```bash
# 1. Install all workspace dependencies (also builds the shared package)
npm install

# 2. Copy environment variables
cp .env.example .env
# then copy the same file into packages/backend/.env and packages/frontend/.env.local
# (or export the variables another way — see "Environment variables" below)

# 3. Start Postgres + Redis
docker compose up -d

# 4. Run migrations
npm run migrate

# 5. Seed mock artists/albums/songs
npm run seed

# 6. Run both apps (in separate terminals)
npm run dev:backend   # http://localhost:4000
npm run dev:frontend  # http://localhost:3000
```

Visit `http://localhost:3000` for the landing page, register an account, and browse the seeded catalog.

## Environment variables

Backend (`packages/backend/.env`):

| Variable | Description |
|---|---|
| `DATABASE_URL` | Postgres connection string (matches `docker-compose.yml` by default) |
| `REDIS_URL` | Redis connection string |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Secrets for signing tokens — change these before any real deployment |
| `ACCESS_TOKEN_TTL` | Access token lifetime (default `15m`) |
| `PORT` | API port (default `4000`) |
| `CORS_ORIGIN` | Allowed frontend origin (default `http://localhost:3000`) |

Frontend (`packages/frontend/.env.local`):

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the backend API, e.g. `http://localhost:4000/api/v1` |

See `.env.example` at the repo root for the full list with defaults.

## Seed data

`packages/backend/seed/data/*.json` contains a hand-crafted mock catalog (8 artists, 11 albums, ~30 songs) with placeholder cover art from picsum.photos, used since no Spotify/MusicBrainz API keys were provided. Swap in a real importer later by writing a script that populates the same `artists` / `albums` / `songs` tables — the schema doesn't need to change.

Re-running `npm run seed` is a no-op if artists already exist. To reseed from scratch, truncate `songs`, `albums`, and `artists` first.

## Media storage

Cloudinary was not configured, so image URLs are stored as plain strings (seed data points at picsum.photos placeholders). To add real uploads, wire the Cloudinary SDK into a new `/users/:id/avatar` upload endpoint and store the returned secure URL in `users.avatar_url` — no schema change needed.

## Project structure

```
packages/
  shared/    # Types + zod validation schemas shared by frontend & backend
  backend/   # Express API, Postgres migrations, seed script
  frontend/  # Next.js App Router UI
```

Backend module layout (`packages/backend/src/modules/`): `auth`, `users`, `artists`, `albums`, `songs`, `logs`, `comments`, `feed`, `lists`, `discover` — each is a self-contained router + queries, added phase by phase. Follow routes and the stats endpoint live on `usersRouter` (`/users/:id/follow`, `/followers`, `/following`, `/stats`) since they operate on the user resource; badge rules live in `users/badges.ts`.

Frontend routes: `/` (landing), `/login`, `/register`, `/profile/[id]`, `/profile/[id]/followers`, `/profile/[id]/following`, `/songs/[id]`, `/albums/[id]`, `/artists/[id]`, `/feed`, `/lists/[id]`, `/lists/new`, `/discover`.

## What's built (Phase 1)

- Email/password registration & login with JWT access tokens + rotating httpOnly refresh tokens
- User profiles (bio, avatar, pinned favorite songs/albums/artists)
- Artist/Album/Song read models with seeded mock data
- Full marketing landing page (hero, Log→Rate→Discover explainer, shelf-style browse section, dark trending showcase, curated-community circle, signup CTA) implementing the brand identity and moodboard brief
- Utado wordmark + CD-disc logo (light/dark variants), reused across nav and auth pages

## What's built (Phase 2)

- `logs` table (`packages/backend/migrations/002_logs.sql`) — one row per rating/review a user logs against a song, half-star ratings (0.5–5), optional review text, `logged_at` timestamp
- `logs` module (`GET /api/v1/logs?songId=`/`?userId=`, `GET /api/v1/logs/mine?songId=`, `GET/POST/PUT/DELETE /api/v1/logs/:id`) with ownership checks on write routes
- Song detail page: average rating + log count (aggregated live from `logs`), a rate/review form (reusing the existing `StarRating` component), and a community "Reviews" list
- Profile page: a "Diary" timeline of the user's own logs (song, cover, rating, review, date)
- Fixed a Phase 1 gap surfaced while wiring this up: `POST /api/v1/auth/refresh` was fetching the current user row but discarding it, so `useAuth().user` was always `null` after a full page reload even with a valid session. It now returns (and the frontend now stores) the full user object, matching `login`/`register`.

## What's built (Phase 3)

- `follows` table (`packages/backend/migrations/003_social.sql`) — directed follower→followee edges; routes on `usersRouter`: `POST/DELETE /users/:id/follow`, `GET /users/:id/followers`, `GET /users/:id/following`. `GET /users/:id` now also returns `followersCount`/`followingCount`/`isFollowing`.
- `log_likes` table — one row per (user, log); `POST/DELETE /logs/:id/like`. Log responses now include `likesCount`/`commentsCount`/`likedByMe`.
- `comments` table — threaded under a log; `comments` module mounted at `/logs/:logId/comments` (`GET`/`POST`), plus `DELETE /logs/:logId/comments/:commentId` with an ownership check.
- `feed` module — `GET /api/v1/feed` (auth required) returns the 50 most recent logs from users the caller follows.
- New `optionalAuth` middleware (doesn't reject when no token is present, but sets `req.userId` if a valid one is) used wherever a public route's response should vary for a logged-in caller — `GET /users/:id` (for `isFollowing`) and the log-listing routes (for `likedByMe`).
- Frontend: a persistent `AppHeader` (Feed/Profile/Log out) replaces the plain logo link on every app page; profile page shows follower/following counts + a Follow/Following button; every log entry (Reviews list, Diary, Feed) now has a like button and an expandable comment thread; a new `/feed` page.
- **Known limitation**: like/follow state shown on first page load reflects an unauthenticated request (server components have no access to the client's in-memory access token), so a freshly loaded page can show a heart as "not liked" even if you'd liked it in an earlier session. It self-corrects via a client-side re-fetch on the profile page (`isFollowing`) and stays correct for the rest of the session via optimistic local state, but a from-scratch fix would mean moving the access token into a readable cookie so server components can include it — out of scope for this pass.

## What's built (Phase 4)

- `lists` + `list_items` tables (`packages/backend/migrations/004_lists.sql`) — a user-owned named collection of songs (title, optional description, ordered by when each song was added). Unique constraint on `(list_id, song_id)` so a song can't be added twice.
- `lists` module — `GET /lists?userId=` (a user's lists, with `itemsCount` and up to 4 cover URLs for a collage preview), `GET /lists/:id` (full detail with ordered items), `POST/PUT/DELETE /lists/:id` and `POST/DELETE /lists/:id/items(/:songId)`, all write routes ownership-checked.
- `discover` module — `GET /discover/top-rated` and `GET /discover/trending` (recent-activity window, default 30 days), both aggregating directly off `logs`/`songs`; reuses the `mapSong`/`SELECT_SONG` helpers extracted from the `songs` module into `songs.queries.ts` (same extraction pattern as `logs.queries.ts` in Phase 3).
- Frontend: profile page gained a "Lists" section (collage cards, "+ New list" for the owner) plus `/profile/[id]/followers`-style new pages `/lists/[id]` (detail, with owner-only remove/delete controls) and `/lists/new`; song page gained an "Add to list" control that lets a logged-in user drop the song into an existing list or spin up a new one inline; new public `/discover` page with Top Rated and Trending sections; `AppHeader` gained a "Discover" link (visible whether logged in or not, since browsing doesn't require auth).

## What's built (Phase 5)

- `GET /users/:id/stats` (public, no new table — computed live from existing data): songs logged, reviews written, unique artists/albums explored, average rating given, a 5-bucket rating distribution (ratings rounded to the nearest whole star), top genre, most-logged artist, lists created, and follower/following counts.
- Badges are **computed, not stored** — `users/badges.ts` holds a fixed list of threshold rules (e.g. "log 10 songs" → Regular, "write your first review" → Critic, "reach 10 followers" → Influencer) evaluated against the stats above on every request. No badge table, no "awarded at" timestamp, no unlock notifications — deliberately the simplest thing that gives the gamification effect, since every rule is a pure function of data that already exists.
- Frontend: a new `StatsPanel` on the profile page (replacing the old placeholder) with a stat-tile row, a "taste profile" card, and a badges row that visually distinguishes earned (gold) from locked (grayed) badges via a `title` tooltip carrying the unlock condition.
- The ratings histogram (`RatingDistributionChart`) is a plain 5-bar CSS/SVG-free chart — no charting library was added. Per the project's dataviz guidance this is a magnitude comparison with a single series, so the correct form is a sequential one-hue bar chart; it reuses the existing brand gold already established by `StarRating` rather than introducing a new palette.

## Known gaps / possible future work

- No list reordering (items are ordered by when they were added; drag-to-reorder would need a `position` column and a reorder endpoint) and no editing a list's title/description after creation (only create/delete) — both were left out as non-essential for the MVP
- Redis is provisioned via Docker Compose but not yet used by any code path — the feed, discover, and stats queries direct-hit Postgres, which is fine at this scale
- Badges are recomputed on every profile load rather than cached or event-driven; fine at this scale, would want caching (Redis, now that it's provisioned) if badge computation ever gets expensive
- No notification when a badge is newly earned — the profile just reflects current state, there's no "you just unlocked X" moment
- The full Phase 1–5 flow (register → follow → rate/review → like/comment → feed → create a list → add/remove songs → browse Discover → view stats/badges) was verified end-to-end in this build environment via Docker Postgres/Redis and headless-browser passes; still worth a manual click-through on your machine after `npm install`.
