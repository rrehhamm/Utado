import { Router } from "express";
import { pool } from "../../db/pool";
import { asyncHandler } from "../../middleware/errorHandler";
import { getCached, setCached } from "../../cache/redis";
import { mapSong } from "../songs/songs.queries";

export const searchRouter = Router();

const CACHE_TTL_SECONDS = 60;
const RESULTS_PER_TYPE = 8;

function mapArtist(a: any) {
  return {
    id: a.id,
    name: a.name,
    bio: a.bio,
    photoUrl: a.photo_url,
    followersCount: a.followers_count,
    spotifyUrl: a.spotify_url,
  };
}

function mapAlbum(a: any) {
  return {
    id: a.id,
    title: a.title,
    artistId: a.artist_id,
    artistName: a.artist_name,
    coverUrl: a.cover_url,
    releaseDate: a.release_date,
    genre: a.genre,
    spotifyUrl: a.spotify_url,
  };
}

searchRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (!q) return res.json({ artists: [], albums: [], songs: [] });

    const cacheKey = `search:${q.toLowerCase()}`;
    const cached = await getCached<unknown>(cacheKey);
    if (cached) return res.json(cached);

    const pattern = `%${q}%`;

    const [artists, albums, songs] = await Promise.all([
      pool.query(
        `SELECT id, name, bio, photo_url, followers_count, spotify_url
         FROM artists
         WHERE name ILIKE $1
         ORDER BY (name ILIKE $2) DESC, followers_count DESC
         LIMIT ${RESULTS_PER_TYPE}`,
        [pattern, `${q}%`]
      ),
      pool.query(
        `SELECT al.id, al.title, al.artist_id, ar.name AS artist_name,
                al.cover_url, al.release_date, al.genre, al.spotify_url
         FROM albums al
         JOIN artists ar ON ar.id = al.artist_id
         WHERE al.title ILIKE $1
         ORDER BY (al.title ILIKE $2) DESC, al.title
         LIMIT ${RESULTS_PER_TYPE}`,
        [pattern, `${q}%`]
      ),
      pool.query(
        `SELECT s.id, s.title, s.album_id, al.title AS album_title, al.cover_url,
                s.artist_id, ar.name AS artist_name,
                s.duration, s.genre, s.release_date, s.credits, s.spotify_url
         FROM songs s
         JOIN artists ar ON ar.id = s.artist_id
         LEFT JOIN albums al ON al.id = s.album_id
         WHERE s.title ILIKE $1
         ORDER BY (s.title ILIKE $2) DESC, s.title
         LIMIT ${RESULTS_PER_TYPE}`,
        [pattern, `${q}%`]
      ),
    ]);

    const payload = {
      artists: artists.rows.map(mapArtist),
      albums: albums.rows.map(mapAlbum),
      songs: songs.rows.map(mapSong),
    };

    await setCached(cacheKey, payload, CACHE_TTL_SECONDS);
    res.json(payload);
  })
);
