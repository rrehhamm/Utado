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
- ~~Known limitation: like/follow state on first load could be stale~~ — fixed post-launch, see "Hardening pass" below.

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

## Hardening pass (post-launch)

After the 5-phase MVP was feature-complete, a follow-up pass addressed the gaps that separate an MVP from production-ready software:

- **Git repo initialized.** The project had no version control until this pass (`git init` + baseline commit) — needed both for the security review tooling and for CI going forward.
- **Manual security review** (the automated `/security-review` tool needs a git `origin` remote to diff against, which a fresh local-only repo doesn't have, so this was done by hand instead): found and fixed no rate limiting on `/api/v1/auth/*` (added `express-rate-limit`, 20 req/15min), missing security headers (added `helmet`), and unpinned JWT algorithm on `jwt.sign`/`jwt.verify` (now explicitly `HS256`). Also flagged, but left as-is by design: the register endpoint's distinct "email already taken" error allows account enumeration — a common, deliberate UX tradeoff, not fixed here.
- **Fixed the like/follow "stale on first load" limitation** properly instead of working around it: added a same-origin Next.js Route Handler (`app/api/session/route.ts`) that mirrors the access token into an httpOnly cookie scoped to the **frontend's own origin** (not the backend's — cookies don't cross real production domains, so this avoids the port-sharing quirk that only happens to work on `localhost`). Server Components now read that cookie (`lib/server-api.ts`) and forward it as `Authorization: Bearer` on their own fetches to the backend, so `isFollowing`/`likedByMe` are correct from the very first server-rendered paint — verified with a hard page reload in a real browser, not just a client-side re-fetch.
- **Redis is now actually used** (`src/cache/redis.ts`), for the two read-heavy, aggregate-query endpoints:
  - `GET /discover/top-rated` and `/trending` — cached 60s per (limit, days) combination, invalidated by key-prefix scan on every log create/update/delete (any log write can change the catalog-wide rankings).
  - `GET /feed` — cached 20s per user, invalidated precisely: creating/editing/deleting a log invalidates every one of the author's followers' cached feeds (queried at write time), and following/unfollowing invalidates your own cached feed. Liking/unliking invalidates the liker's own feed cache; other viewers' cached `likesCount` for that entry can lag by up to the 20s TTL — an accepted, bounded staleness rather than fanning out to everyone who might currently have that log in their feed.
  - The cache is a pure optimization layer: `getCached`/`setCached`/`invalidate*` swallow Redis errors and fall back to hitting Postgres directly, so a Redis outage degrades performance, not availability.
  - Verified by hand: flushed Redis, hit `/discover/top-rated` (confirmed the key appears), then created a log and confirmed the key was gone immediately (not just after 60s) — and confirmed a follower's feed shows a brand-new log with no delay despite the cache.
- **Pagination** (`src/lib/pagination.ts`), replacing hard caps with real paging:
  - `GET /logs` (by `songId` or `userId`) and `GET /feed` use cursor pagination: `?limit=` (default 20, max 50) + `?before=` (an ISO timestamp; returns items strictly older than it, ordered the same as before). `GET /logs` previously had **no** limit at all — an unbounded response was always a risk on a song or user with a lot of activity.
  - `GET /discover/top-rated` / `/trending` use `?limit=` + `?offset=` instead, since these are `GROUP BY` aggregate rankings rather than a time-ordered stream — offset is simpler and entirely adequate for a bounded, non-monotonic list. Offset is folded into the cache key.
  - `GET /logs/:logId/comments` gets a simple `?limit=` cap (default 50, max 100) rather than full pagination: it fetches the most recent `limit` comments (descending) and reverses them for ascending display, so a long thread gets capped without hiding recent replies behind the oldest ones.
  - Response shape is unchanged (still a plain array) — callers infer "more available" by checking whether the page came back full, rather than a wrapper object with a total count.
  - Verified by hand: cursor pagination on `/feed` returns two pages with zero overlapping IDs; offset pagination on `/discover/top-rated` returns a disjoint next page.
  - **Not done**: the frontend doesn't have "Load more" UI yet for any of these — it was asked for as an API/backend hardening item, and the existing pages just call these endpoints with their implicit defaults (unchanged behavior at current seed-data scale). Wiring up infinite scroll / "load more" buttons is separate follow-up work.

## Known gaps / possible future work

- No list reordering (items are ordered by when they were added; drag-to-reorder would need a `position` column and a reorder endpoint) and no editing a list's title/description after creation (only create/delete) — both were left out as non-essential for the MVP
- Badges are recomputed on every profile load rather than cached; fine at this scale, would reuse the same Redis cache-aside pattern as feed/discover if it ever gets expensive
- No notification when a badge is newly earned — the profile just reflects current state, there's no "you just unlocked X" moment
- No frontend "Load more" / infinite scroll UI wired up to the pagination APIs yet (see "Hardening pass" above) — the backend supports it, the pages just use the implicit first page
- No automated test suite yet (see "Hardening pass" above for what's planned)
- The full Phase 1–5 flow (register → follow → rate/review → like/comment → feed → create a list → add/remove songs → browse Discover → view stats/badges) was verified end-to-end in this build environment via Docker Postgres/Redis and headless-browser passes; still worth a manual click-through on your machine after `npm install`.
