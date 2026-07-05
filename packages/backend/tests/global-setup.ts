import { Client } from "pg";
import { createClient } from "redis";
import fs from "node:fs";
import path from "node:path";
import { TEST_DATABASE_URL, TEST_DB_NAME, TEST_REDIS_URL } from "./test-db-config";

const ADMIN_URL = "postgres://utado:utado@localhost:5432/postgres";

/**
 * Vitest global setup runs once, in a separate process from the test files
 * themselves, so it can't rely on setting process.env for the tests to pick
 * up (see tests/env-setup.ts for that half). Its only job here is to make
 * sure a clean utado_test database with the current schema exists before any
 * test file connects to it.
 */
export default async function setup() {
  const admin = new Client({ connectionString: ADMIN_URL });
  await admin.connect();
  const exists = await admin.query("SELECT 1 FROM pg_database WHERE datname = $1", [TEST_DB_NAME]);
  if (exists.rowCount === 0) {
    await admin.query(`CREATE DATABASE ${TEST_DB_NAME}`);
  }
  await admin.end();

  const test = new Client({ connectionString: TEST_DATABASE_URL });
  await test.connect();
  await test.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");

  const migrationsDir = path.join(__dirname, "../migrations");
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
    await test.query(sql);
  }

  await seedCatalog(test);
  await test.end();

  const redis = createClient({ url: TEST_REDIS_URL });
  await redis.connect();
  await redis.flushDb();
  await redis.quit();
}

interface ArtistSeed {
  key: string;
  name: string;
  bio: string;
  photoUrl: string;
  followersCount: number;
}
interface AlbumSeed {
  key: string;
  title: string;
  artistKey: string;
  coverUrl: string;
  releaseDate: string;
  genre: string;
}
interface SongSeed {
  title: string;
  albumKey: string | null;
  artistKey: string;
  duration: number;
  genre: string;
  releaseDate: string;
  credits: string;
}

function loadJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(path.join(__dirname, "../seed/data", file), "utf-8"));
}

/**
 * There's no API to create artists/albums/songs (catalog is seed-only), so
 * any test that logs, lists, or discovers a song needs this data present.
 * Mirrors seed/seed.ts's logic against the test DB directly, since that
 * script's own pool import reads process.env.DATABASE_URL at import time -
 * which isn't the test DB in this process.
 */
async function seedCatalog(client: Client) {
  const artists = loadJson<ArtistSeed[]>("artists.json");
  const albums = loadJson<AlbumSeed[]>("albums.json");
  const songs = loadJson<SongSeed[]>("songs.json");

  const artistIdByKey = new Map<string, string>();
  for (const a of artists) {
    const result = await client.query(
      `INSERT INTO artists (name, bio, photo_url, followers_count) VALUES ($1, $2, $3, $4) RETURNING id`,
      [a.name, a.bio, a.photoUrl, a.followersCount]
    );
    artistIdByKey.set(a.key, result.rows[0].id);
  }

  const albumIdByKey = new Map<string, string>();
  for (const al of albums) {
    const artistId = artistIdByKey.get(al.artistKey)!;
    const result = await client.query(
      `INSERT INTO albums (title, artist_id, cover_url, release_date, genre) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [al.title, artistId, al.coverUrl, al.releaseDate, al.genre]
    );
    albumIdByKey.set(al.key, result.rows[0].id);
  }

  for (const s of songs) {
    const artistId = artistIdByKey.get(s.artistKey)!;
    const albumId = s.albumKey ? albumIdByKey.get(s.albumKey) ?? null : null;
    await client.query(
      `INSERT INTO songs (title, album_id, artist_id, duration, genre, release_date, credits)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [s.title, albumId, artistId, s.duration, s.genre, s.releaseDate, s.credits]
    );
  }
}
