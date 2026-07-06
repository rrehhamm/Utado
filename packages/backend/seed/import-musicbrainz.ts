import "dotenv/config";
import { pool } from "../src/db/pool";

/**
 * Populates the same artists/albums/songs tables as seed/seed.ts, but from
 * real MusicBrainz + Cover Art Archive data instead of the hand-crafted mock
 * catalog. Run on demand (npm run import:musicbrainz) - not part of normal
 * setup or CI, since it depends on a real third-party network API.
 *
 * MusicBrainz needs no API key but enforces ~1 req/sec and will reset
 * connections (not just 503) if you push much past that, sometimes requiring
 * a longer cooldown to recover - so this paces conservatively and retries
 * with backoff rather than assuming a flat delay is enough.
 */

const USER_AGENT = "Utado/1.0 (https://github.com/utado; contact@utado.example)";
const MIN_DELAY_MS = 1500;
const MAX_RETRIES = 4;

let lastRequestAt = 0;

async function throttledFetch(url: string): Promise<Response> {
  const elapsed = Date.now() - lastRequestAt;
  if (elapsed < MIN_DELAY_MS) {
    await sleep(MIN_DELAY_MS - elapsed);
  }
  lastRequestAt = Date.now();

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
      if (res.status === 503 || res.status === 429) {
        const backoff = attempt * 5000;
        console.warn(`  ${res.status} from ${url}, retrying in ${backoff}ms (attempt ${attempt})`);
        await sleep(backoff);
        continue;
      }
      return res;
    } catch (err) {
      const backoff = attempt * 5000;
      console.warn(
        `  network error for ${url} (${(err as Error).message}), retrying in ${backoff}ms (attempt ${attempt})`
      );
      await sleep(backoff);
    }
  }
  throw new Error(`Failed to fetch ${url} after ${MAX_RETRIES} attempts`);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function mbJson<T>(path: string): Promise<T | null> {
  const res = await throttledFetch(`https://musicbrainz.org/ws/2${path}`);
  if (!res.ok) return null;
  return res.json() as Promise<T>;
}

interface MbArtist {
  id: string;
  name: string;
  type?: string;
  area?: { name: string };
  "life-span"?: { begin?: string; end?: string };
  tags?: { name: string; count: number }[];
}

interface MbReleaseGroup {
  id: string;
  title: string;
  "first-release-date"?: string;
  "primary-type"?: string;
}

interface MbRelease {
  id: string;
  media?: { tracks?: { title: string; length?: number; position: number }[] }[];
}

function normalizeReleaseDate(raw: string | undefined): string | null {
  if (!raw) return null;
  if (/^\d{4}$/.test(raw)) return `${raw}-01-01`;
  if (/^\d{4}-\d{2}$/.test(raw)) return `${raw}-01`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  return null;
}

function buildBio(artist: MbArtist): string {
  const parts: string[] = [];
  const kind = artist.type === "Person" ? "Solo artist" : artist.type === "Group" ? "Group" : "Artist";
  parts.push(kind);
  if (artist.area?.name) parts.push(`from ${artist.area.name}`);
  const begin = artist["life-span"]?.begin;
  const end = artist["life-span"]?.end;
  if (begin && end) parts.push(`active ${begin}–${end}`);
  else if (begin) parts.push(`active since ${begin}`);
  return `${parts.join(", ")}.`;
}

function topTag(tags: { name: string; count: number }[] | undefined): string | null {
  if (!tags || tags.length === 0) return null;
  const sorted = [...tags].sort((a, b) => b.count - a.count);
  return sorted[0]?.name ?? null;
}

async function getCoverUrl(releaseId: string): Promise<string | null> {
  try {
    const res = await throttledFetch(`https://coverartarchive.org/release/${releaseId}`);
    if (!res.ok) return null;
    const data = (await res.json()) as { images?: { front?: boolean; image: string }[] };
    const front = data.images?.find((img) => img.front) ?? data.images?.[0];
    return front?.image ?? null;
  } catch {
    return null;
  }
}

async function importArtist(name: string, albumsPerArtist: number) {
  console.log(`\nImporting ${name}...`);

  const search = await mbJson<{ artists: MbArtist[] }>(
    `/artist/?query=${encodeURIComponent(`artist:"${name}"`)}&fmt=json&limit=3`
  );
  const match = search?.artists.find((a) => a.name.toLowerCase() === name.toLowerCase()) ?? search?.artists[0];
  if (!match) {
    console.warn(`  no MusicBrainz match for "${name}", skipping`);
    return;
  }

  const existing = await pool.query(`SELECT id FROM artists WHERE name = $1`, [match.name]);
  let artistId: string;
  if (existing.rows[0]) {
    artistId = existing.rows[0].id;
    console.log(`  artist already imported, reusing id ${artistId}`);
  } else {
    const inserted = await pool.query(
      `INSERT INTO artists (name, bio, photo_url, followers_count) VALUES ($1, $2, $3, $4) RETURNING id`,
      [match.name, buildBio(match), null, 0]
    );
    artistId = inserted.rows[0].id;
    console.log(`  inserted artist ${match.name} (${artistId})`);
  }

  const releaseGroups = await mbJson<{ "release-groups": MbReleaseGroup[] }>(
    `/release-group?artist=${match.id}&type=album&fmt=json&limit=${albumsPerArtist * 2}`
  );
  const albums = (releaseGroups?.["release-groups"] ?? [])
    .filter((rg) => rg["primary-type"] === "Album")
    .slice(0, albumsPerArtist);

  const artistGenre = topTag(match.tags);

  for (const rg of albums) {
    const existingAlbum = await pool.query(`SELECT id FROM albums WHERE title = $1 AND artist_id = $2`, [
      rg.title,
      artistId,
    ]);
    if (existingAlbum.rows[0]) {
      console.log(`  album "${rg.title}" already imported, skipping`);
      continue;
    }

    const releases = await mbJson<{ releases: { id: string }[] }>(
      `/release?release-group=${rg.id}&fmt=json&limit=1`
    );
    const releaseId = releases?.releases?.[0]?.id;
    if (!releaseId) {
      console.warn(`  no release found for release-group "${rg.title}", skipping album`);
      continue;
    }

    const coverUrl = await getCoverUrl(releaseId);
    const releaseDate = normalizeReleaseDate(rg["first-release-date"]);

    const insertedAlbum = await pool.query(
      `INSERT INTO albums (title, artist_id, cover_url, release_date, genre)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [rg.title, artistId, coverUrl, releaseDate, artistGenre]
    );
    const albumId = insertedAlbum.rows[0].id;
    console.log(`  inserted album "${rg.title}" (${albumId})`);

    const releaseDetail = await mbJson<MbRelease>(`/release/${releaseId}?inc=recordings&fmt=json`);
    const tracks = releaseDetail?.media?.flatMap((m) => m.tracks ?? []) ?? [];

    for (const track of tracks) {
      await pool.query(
        `INSERT INTO songs (title, album_id, artist_id, duration, genre, release_date, credits)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          track.title,
          albumId,
          artistId,
          track.length ? Math.round(track.length / 1000) : null,
          artistGenre,
          releaseDate,
          null,
        ]
      );
    }
    console.log(`    imported ${tracks.length} tracks`);
  }
}

const DEFAULT_ARTISTS = [
  "Radiohead",
  "Daft Punk",
  "Fleetwood Mac",
  "Kendrick Lamar",
  "Björk",
  "Miles Davis",
  "Aphex Twin",
  "Nirvana",
  "Beyoncé",
  "The Beatles",
];

async function run() {
  const artistNames = process.argv.slice(2).length > 0 ? process.argv.slice(2) : DEFAULT_ARTISTS;
  const albumsPerArtist = 3;

  console.log(`Importing ${artistNames.length} artist(s) from MusicBrainz (up to ${albumsPerArtist} albums each)...`);

  for (const name of artistNames) {
    try {
      await importArtist(name, albumsPerArtist);
    } catch (err) {
      console.error(`  failed to import "${name}":`, (err as Error).message);
    }
  }

  await pool.end();
  console.log("\nImport complete.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
