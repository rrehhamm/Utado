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

# 7. Run the test suite (needs steps 1 and 3 above; creates/migrates/seeds
#    its own utado_test database and uses Redis DB index 1, so it won't
#    touch your dev data)
npm test

# 8. Run the E2E suite (needs steps 1, 3, 4 above; drives the real dev
#    servers, which it starts itself, against your regular dev database -
#    this one does add its own test users/data to it)
npm run test:e2e
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

`packages/backend/seed/data/*.json` contains a hand-crafted mock catalog (8 artists, 11 albums, ~30 songs) with placeholder cover art from picsum.photos, used since no Spotify API keys were provided.

Re-running `npm run seed` is a no-op if artists already exist. To reseed from scratch, truncate `songs`, `albums`, and `artists` first.

### Real data (MusicBrainz + Cover Art Archive)

`npm run import:musicbrainz` (in `packages/backend`) populates the **same** `artists`/`albums`/`songs` tables from real MusicBrainz + Cover Art Archive data instead of the mock JSON — real artist names, real album titles and release dates, real per-track durations, and real cover art (when Cover Art Archive has one for that release). It coexists with the mock catalog rather than replacing it; re-running is idempotent (skips artists/albums it already imported, matched by name).

No API key needed for either service, but MusicBrainz enforces roughly 1 request/second and will reset the connection (not just return a 503) if you push much past that — recovering sometimes takes longer than a flat 1-second backoff would suggest. The script paces requests conservatively and retries with increasing backoff rather than assuming a fixed delay is enough; expect a full run (10 artists × 3 albums, the built-in defaults) to take a few minutes.

```bash
npm run import:musicbrainz --workspace packages/backend
# or a custom list:
npm run import:musicbrainz --workspace packages/backend -- "Pixies" "Portishead"
```

Known limitations of this data source (both are honest trade-offs to avoid needing a third API/credential): MusicBrainz has no artist photos or free-text biographies, so imported artists get a `photoUrl` of `null` (the UI already handles that with a placeholder) and a short bio synthesized from structured fields (type, area, active years) rather than real prose. Genre is the artist's single highest-count folksonomy tag, which is a rougher signal than a curated genre taxonomy.

## Media storage

`POST /api/v1/users/:id/avatar` (multipart, `avatar` field, 5MB cap, ownership-checked) uploads to Cloudinary and stores the returned `secure_url` in `users.avatar_url` — no schema change needed, since that column was always a plain string. Wire it up by adding `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` to `packages/backend/.env` (free tier: cloudinary.com/users/register/free → Dashboard → API Keys).

Without those three env vars set, the endpoint degrades gracefully — it returns `503 image_uploads_not_configured` rather than crashing, and the rest of the app (including every existing avatar URL) is completely unaffected. Frontend: a "Change photo" control on the profile page, visible only to the profile's owner (`components/social/AvatarUploadButton.tsx`).

Verified with a real Cloudinary account: uploaded a file through the actual browser file picker, confirmed the returned URL is genuinely hosted on `res.cloudinary.com` (not just stored, actually fetched it and got a 200), and confirmed it renders via `next/image` and survives a page reload. `res.cloudinary.com` needed adding to `next.config.mjs`'s image `remotePatterns` for that last part — easy to miss since the upload itself would still "succeed" without it, the image just wouldn't render.

## Deployment

`docker-compose.prod.yml` runs the whole stack (frontend, backend, Postgres, Redis) with production builds — no Vercel/Railway/managed-hosting account needed, just Docker on any VPS/server:

```bash
cp .env.production.example .env
# fill in real values - JWT secrets, CORS_ORIGIN, NEXT_PUBLIC_API_URL (see comments in the file)
docker compose -f docker-compose.prod.yml up -d --build
```

- Both `packages/backend/Dockerfile` and `packages/frontend/Dockerfile` build from the **repo root** as context (they're workspace packages that depend on `@utado/shared`), which is why the compose file's `build.context` is `.` rather than the package directory.
- `NEXT_PUBLIC_API_URL` must be set **before** building the frontend image — Next.js inlines `NEXT_PUBLIC_*` variables into the client bundle at build time, not read at container start, so it's wired through as a Docker build arg, not a runtime environment variable.
- The backend container runs migrations on every start before launching the server (`npm run migrate && node dist/server.js`) — safe because migrations are tracked and idempotent, and it means a deploy is just "pull, rebuild, restart" with no separate migration step to remember.
- This compose file sets an explicit `name: utado-prod`, deliberately different from the plain `docker-compose.yml` used for local dev. **This was a real mistake caught during verification, not a hypothetical**: without an explicit project name, Compose derives one from the directory alone, and running `docker-compose.prod.yml` from the same directory as the dev `docker-compose.yml` recreated and replaced the dev Postgres/Redis containers (same implicit project + service names). Data survived only because both files happened to reference a volume with the same name — the container swap itself was real and unintended. Fixed by giving the prod file its own project name and distinctly-named volumes; re-verified that both stacks now run side by side (`utado-postgres`/`utado-redis` for dev, `utado-prod-postgres-1`/etc. for prod) without touching each other.
- Verified end-to-end: built both images fresh, brought the stack up with a brand-new (empty) Postgres volume, confirmed all 6 migrations applied on first boot, and registered a real account through the actual production frontend build with zero console errors.

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
- **Automated test suite** — 48 tests, `npm test` from the repo root (or `npm run test:backend` / `test:frontend`):
  - **Backend** (`packages/backend/tests/`, Vitest + Supertest, 35 tests across 10 files): real integration tests against an actual Postgres (`utado_test`, auto-created and re-migrated + re-seeded fresh on every run by `tests/global-setup.ts`) and Redis (DB index 1, flushed at the start of each run) — not mocked, since this app is almost entirely raw-SQL routers where the risk lives in the queries and the auth/ownership logic, not in isolable pure functions. Covers auth (register/login/refresh rotation/protected-route gating), log CRUD + ownership + rating validation + likes, follow graph + counts, feed (including that a new log from a followed user shows up **immediately** despite the cache), lists + ownership + reordering, discover ranking + offset pagination, comments + ownership, badge notifications, and avatar upload ownership/graceful-degradation (a real upload isn't tested here — that needs live Cloudinary credentials, which don't belong in a checked-in CI-run suite). The auth rate limiter is skipped under `NODE_ENV=test` so the suite can call register/login far more than the production 20-req/15min cap without that being what's under test.
  - **Frontend** (`packages/frontend/tests/`, Vitest + React Testing Library + jsdom, 13 tests across 4 files): component tests for the trickiest interactive pieces — `StarRating` (click-to-value, readOnly disables), `RatingDistributionChart` (bar heights track counts), `LikeButton` and `FollowButton` (optimistic update, revert-on-failure, gated on auth), with `lib/api` and `lib/auth-context` mocked.
  - **Two real bugs the suite caught immediately**, not test artifacts: (1) `errorHandler.ts` checked `err instanceof ZodError`, which broke under Vitest because `@utado/shared`'s compiled output and the backend's own code can resolve to distinct `zod` module instances in that runner (a classic dual-package hazard) — switched to duck-typing on `err.name === "ZodError"`, which is robust either way. (2) `signRefreshToken` had no `jti`, so two tokens issued for the same user within the same second were **byte-for-byte identical** (HMAC signing is deterministic) — meaning a "revoked" refresh token's hash was shared by the new, unrevoked row that replaced it, so the old raw token kept authenticating. Fixed by adding a random `jti` to every refresh token. Verified by hand with a real cookie jar (not just the test) that reusing a rotated-out refresh token now gets 401.

## Second hardening pass

- **CI** — `.github/workflows/ci.yml` runs on every push/PR: installs deps, typechecks all three packages, spins up Postgres + Redis service containers, runs migrations + seed, runs both test suites, and does a production `next build`.
- **"Load more" UI** — `PaginatedLogList` (song reviews, profile diary, feed — parametrized by which field each endpoint's cursor is on, since diary orders by `loggedAt` but reviews/feed order by `createdAt`) and `PaginatedSongList` (Discover's Top Rated/Trending, offset-based). Verified by hand: logged 25 songs, confirmed the button appears once the first page is full and clicking it appends the next page.
- **List reordering + editing** — editing title/description already had a working endpoint since Phase 4, it just had no form; reordering is new: a `position` column on `list_items` (`005` migration) and `PUT /lists/:id/items/reorder`, which validates the payload is exactly the list's current song set before applying it. Frontend is up/down arrow buttons (`ReorderableListItems`), which also absorbed the remove-item logic so order, presence, and position all come from one piece of state instead of two components racing each other's `router.refresh()`. Verified reordering survives a hard reload, not just optimistic client state.
- **Badge-earned notifications** — badges are still computed live, not stored (see Phase 5), but a small `user_badge_notifications` table (`006` migration) now records the first time `GET /users/:id/stats` notices a badge crossed from not-earned to earned. `AppHeader` (present on every app page) polls `GET /users/:id/badge-notifications/unseen` once on mount and shows a dismissible toast per unseen badge; dismissing calls `POST .../badge-notifications/:slug/seen` so it never shows again. Verified the toast appears on an unrelated page (Discover, not just the profile), dismisses, and stays dismissed after a reload.
- **Environment hiccup worth noting**: mid-session, Docker Desktop's daemon had stopped responding (`ECONNREFUSED` from the backend to Postgres) even though the containers themselves were still marked as existing — relaunching Docker Desktop brought the already-provisioned containers back in about 10 seconds with no data loss. Not a code issue, just something to know if local verification suddenly starts failing with connection-refused errors.
- **Checked-in Playwright E2E suite** (`e2e/`, `npm run test:e2e`, also wired into CI) — 4 specs driving the real dev servers against a real database: auth (register/logout/login), rating+reviewing a song, follow→feed→like→comment, and creating/populating a list. `playwright.config.ts`'s `webServer` starts both dev servers automatically (backend with `NODE_ENV=test`, so it's exempt from the auth rate limiter the same way the Vitest suite is — otherwise a couple of reruns exhausts the production 20-req/15min cap).
  - **Caught a real, user-facing bug, not a test artifact**: `PaginatedLogList` and `PaginatedSongList` (added earlier in this same hardening pass, for "Load more") initialized their list state from the `initialLogs`/`initialSongs` prop with a plain `useState`. That prop is a fresh array every time the parent Server Component re-fetches — which is exactly what `router.refresh()` triggers after saving a rating/review — but the already-mounted client component doesn't remount, so React never re-runs the `useState` initializer. Net effect: saving a review looked like it worked (the "Your log" form correctly flips to "Update"/"Delete") but the review **silently never appeared in the Reviews list or Diary** until a hard reload. Fixed with a `useEffect` that re-syncs local state whenever the prop changes. Caught only because the E2E test asserted on the rendered `<p>` content rather than a same-page manual eyeball check — re-verified 3 consecutive clean runs after the fix, and confirmed the fix's own manual-investigation script (which had given a false "it works" reading, because it checked raw page text and matched the still-focused textarea's own value instead of the Reviews list) was itself misleading.
- **Upgraded Next.js `14.2.35` → `16.2.10` and React `18.3.1` → `19.2.7`**, closing out the last known advisory-bearing pin.
  - `params` (and `searchParams`) on dynamic route pages are now `Promise`-typed and must be `await`ed — a breaking change in Next 15+ that **neither `tsc --noEmit` nor `next build`'s own type-check caught**; both passed cleanly on the un-migrated code. Only caught by actually curling a real dynamic route (`/songs/:id`) post-build and seeing a 404. Fixed across all 7 dynamic-route pages (`songs/[id]`, `albums/[id]`, `artists/[id]`, `lists/[id]`, `profile/[id]`, `profile/[id]/followers`, `profile/[id]/following`).
  - The React 19 bump left a stale nested `react@18.3.1`/`react-dom@18.3.1` under `packages/frontend/node_modules` (a lockfile artifact from `@testing-library/react`'s resolution, not a real incompatibility — its peer range allows 19), which broke all 13 frontend component tests with "Objects are not valid as a React child". Diagnosed with `npm ls react`, fixed with `npm dedupe`.
  - Verified with a full pass after both fixes: clean typecheck on all three packages, a full `next build` (all 7 dynamic routes still render, confirmed by re-curling each), all 43 Vitest tests, and all 4 Playwright E2E specs green.
- **Search** — closes a real usability gap that predated Spotify-vs-MusicBrainz entirely: there was no way to find a song/album/artist in the app unless you already had a direct link to it (Discover only surfaces songs someone already logged; album pages need an existing link to reach them). `GET /api/v1/search?q=` runs three `ILIKE` queries (artists/albums/songs, 8 results each, exact-prefix matches ranked above mid-string matches, 60s Redis cache keyed by the lowercased query), and a search bar in `AppHeader` routes to a `/search?q=` results page. Verified with a real headless-browser pass: typed a query into the header search bar, submitted, saw the matching artist card render, clicked through to the artist page. Covered by 5 backend tests and 3 new Playwright E2E specs (artist search → click-through, song-title search, no-match message).
- **Spotify catalog import** (`npm run import:spotify --workspace packages/backend`) — a second, real, on-demand catalog source alongside MusicBrainz, using Spotify's Client Credentials flow (app-only auth, no user login). Imports artists → albums → tracks the same way `import-musicbrainz.ts` does, but attaches a `spotify_url` (a real `open.spotify.com` deep link) to every artist/album/song, and real high-res cover art from Spotify's own CDN (`i.scdn.co`, added to `next.config.mjs`'s `remotePatterns`). The frontend renders a "Listen on Spotify" button on song/album/artist pages whenever `spotifyUrl` is present.
  - **No audio playback or previews**: Spotify deprecated `preview_url` and `popularity` for apps created after November 2024 — confirmed by hand, a real search response came back with both fields simply absent. The "richer data source" here is metadata + real cover art + an outbound link, not in-app listening; actual playback would need the separate, much heavier Web Playback SDK + a Premium end-user OAuth login, which is out of scope.
  - **Two more fields silently dropped that the docs still describe as present**: artist objects no longer include `followers` or `genres` either — the importer treats both as optional and falls back to a generic bio / `followers_count: 0` rather than crashing, discovered by an actual failed import run (`Cannot read properties of undefined (reading 'total')`), not by reading Spotify's docs.
  - **Development Mode apps are capped at `limit=10`, not the documented `limit=50`**, specifically on the artist-albums endpoint (`GET /artists/:id/albums`) — a fresh app gets a `400 Invalid limit` above 10, discovered the same way (a real failed request, bisected by hand to find the actual ceiling). `getArtistAlbums` now paginates in pages of 10 instead of requesting one large page.
  - Verified with a real import run against 8 well-known artists (26 artists / 64 albums / 882 songs in the catalog afterward, 424 songs carrying a real `spotify_url`), a real headless-browser pass confirming the Spotify link renders with the correct `open.spotify.com` href on all three page types and that the proxied `i.scdn.co` cover art actually loads (200, not broken), and a full re-run of all 48 Vitest tests + all 7 Playwright E2E specs afterward.
- **Fixed login/register redirecting to the marketing page instead of the app**: both did `router.push("/")` on success, which lands on the public marketing landing page (its own static `Navbar` with "Log in"/"Start your diary" buttons, no auth awareness at all) rather than the actual app — so a freshly logged-in user landed on a page showing the exact same "Log in" button they'd just used, with nothing indicating they were signed in. Found from a real user report ("I created an account and I'm still stuck in the login page"). Now redirects to `/feed`; `AppHeader`'s logo link had the same bug (always pointed at `/` even while logged in) and got the same fix. The existing auth E2E spec had actually encoded the buggy redirect as expected behavior (asserting the post-register URL was `/`, with a comment explaining a workaround needed to check login state elsewhere) — updated to assert the correct destination.
- **Favorite Songs (user-picked, up to 4) + Recently Rated on the profile page**: `pinnedSongIds` (max 4, enforced by `updateUserSchema`) and `PUT /users/:id` already existed from Phase 1 but had no editing UI — profiles could only display whatever was already in the array, never let a user actually choose it. `FavoriteSongsEditor` adds an "Edit" control (own profile only) with search-to-add (reusing the `/search` endpoint), per-song remove, and Save/Cancel; the profile page's old combined "Pinned Favorites" section now covers only albums/artists, with songs broken out into their own editable section. "Recently Rated" is a new read-only section showing the last 5 logs (`GET /logs?userId=&limit=5`, already-existing endpoint, just called with a smaller limit) — distinct from the full paginated "Diary" further down the page. Verified with a real registered user in a real browser: rated a song (appeared under Recently Rated), searched for and added a different song as a favorite, saved, confirmed it rendered immediately and survived a full page reload. Covered by 1 new Playwright E2E spec.

## Known gaps / possible future work
- The full Phase 1–5 flow (register → follow → rate/review → like/comment → feed → create a list → add/remove songs → browse Discover → view stats/badges) was verified end-to-end in this build environment via Docker Postgres/Redis and headless-browser passes; still worth a manual click-through on your machine after `npm install`.
