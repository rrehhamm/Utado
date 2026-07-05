import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { pool } from "../src/db/pool";

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
  return JSON.parse(fs.readFileSync(path.join(__dirname, "data", file), "utf-8"));
}

async function seed() {
  const artists = loadJson<ArtistSeed[]>("artists.json");
  const albums = loadJson<AlbumSeed[]>("albums.json");
  const songs = loadJson<SongSeed[]>("songs.json");

  const existing = await pool.query("SELECT count(*)::int AS count FROM artists");
  if (existing.rows[0].count > 0) {
    console.log("Seed data already present, skipping. (truncate tables manually to reseed)");
    await pool.end();
    return;
  }

  const artistIdByKey = new Map<string, string>();
  for (const a of artists) {
    const result = await pool.query(
      `INSERT INTO artists (name, bio, photo_url, followers_count)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [a.name, a.bio, a.photoUrl, a.followersCount]
    );
    artistIdByKey.set(a.key, result.rows[0].id);
  }
  console.log(`Seeded ${artists.length} artists.`);

  const albumIdByKey = new Map<string, string>();
  for (const al of albums) {
    const artistId = artistIdByKey.get(al.artistKey);
    if (!artistId) throw new Error(`Unknown artistKey ${al.artistKey} for album ${al.title}`);
    const result = await pool.query(
      `INSERT INTO albums (title, artist_id, cover_url, release_date, genre)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [al.title, artistId, al.coverUrl, al.releaseDate, al.genre]
    );
    albumIdByKey.set(al.key, result.rows[0].id);
  }
  console.log(`Seeded ${albums.length} albums.`);

  for (const s of songs) {
    const artistId = artistIdByKey.get(s.artistKey);
    if (!artistId) throw new Error(`Unknown artistKey ${s.artistKey} for song ${s.title}`);
    const albumId = s.albumKey ? albumIdByKey.get(s.albumKey) ?? null : null;
    await pool.query(
      `INSERT INTO songs (title, album_id, artist_id, duration, genre, release_date, credits)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [s.title, albumId, artistId, s.duration, s.genre, s.releaseDate, s.credits]
    );
  }
  console.log(`Seeded ${songs.length} songs.`);

  await pool.end();
  console.log("Seed complete.");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
