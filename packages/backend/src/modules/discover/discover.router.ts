import { Router } from "express";
import { pool } from "../../db/pool";
import { asyncHandler } from "../../middleware/errorHandler";
import { mapSong } from "../songs/songs.queries";
import { getCached, setCached } from "../../cache/redis";
import { parseLimit, parseOffset } from "../../lib/pagination";

export const discoverRouter = Router();

const CACHE_TTL_SECONDS = 60;

discoverRouter.get(
  "/top-rated",
  asyncHandler(async (req, res) => {
    const limit = parseLimit(req.query.limit);
    const offset = parseOffset(req.query.offset);
    const cacheKey = `discover:top-rated:${limit}:${offset}`;

    const cached = await getCached<unknown[]>(cacheKey);
    if (cached) return res.json(cached);

    const result = await pool.query(
      `SELECT s.id, s.title, s.album_id, al.title AS album_title, al.cover_url,
              s.artist_id, ar.name AS artist_name,
              s.duration, s.genre, s.release_date, s.credits, s.spotify_url,
              AVG(l.rating)::float AS average_rating, COUNT(l.id)::int AS logs_count
       FROM songs s
       JOIN artists ar ON ar.id = s.artist_id
       LEFT JOIN albums al ON al.id = s.album_id
       JOIN logs l ON l.song_id = s.id AND l.rating IS NOT NULL
       WHERE al.cover_url NOT ILIKE '%picsum%'
       GROUP BY s.id, al.title, al.cover_url, ar.name
       ORDER BY (s.spotify_url IS NOT NULL) DESC, average_rating DESC, logs_count DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    const payload = result.rows.map((row) => ({
      ...mapSong(row),
      averageRating: row.average_rating,
      logsCount: row.logs_count,
    }));

    await setCached(cacheKey, payload, CACHE_TTL_SECONDS);
    res.json(payload);
  })
);

discoverRouter.get(
  "/categories",
  asyncHandler(async (req, res) => {
    const songsPerCategory = parseLimit(req.query.songsPerCategory, 8, 20);
    const cacheKey = `discover:categories:${songsPerCategory}`;

    const cached = await getCached<unknown[]>(cacheKey);
    if (cached) return res.json(cached);

    const result = await pool.query(
      `WITH per_artist AS (
         SELECT s.id, s.title, s.album_id, al.title AS album_title, al.cover_url,
                s.artist_id, ar.name AS artist_name,
                s.duration, s.genre, s.release_date, s.credits, s.spotify_url,
                -- Cap at one song per artist per genre first, so one artist's album (often many
                -- same-day tracks) can't fill up the whole carousel - real variety over recency.
                ROW_NUMBER() OVER (
                  PARTITION BY s.genre, s.artist_id ORDER BY s.release_date DESC NULLS LAST, s.id
                ) AS artist_rank,
                COUNT(*) OVER (PARTITION BY s.genre)::int AS total_count
         FROM songs s
         JOIN artists ar ON ar.id = s.artist_id
         LEFT JOIN albums al ON al.id = s.album_id
         WHERE s.genre IS NOT NULL AND s.spotify_url IS NOT NULL AND al.cover_url IS NOT NULL
       ),
       diverse AS (
         SELECT *, ROW_NUMBER() OVER (
           PARTITION BY genre ORDER BY release_date DESC NULLS LAST, id
         ) AS rn
         FROM per_artist
         WHERE artist_rank = 1
       )
       SELECT * FROM diverse WHERE rn <= $1 ORDER BY genre, rn`,
      [songsPerCategory]
    );

    type CategoryEntry = { songs: ReturnType<typeof mapSong>[]; totalSongs: number };
    const byGenre = new Map<string, CategoryEntry>();
    for (const row of result.rows) {
      const entry: CategoryEntry = byGenre.get(row.genre) ?? { songs: [], totalSongs: row.total_count };
      entry.songs.push(mapSong(row));
      byGenre.set(row.genre, entry);
    }
    const payload = Array.from(byGenre.entries()).map(([genre, { songs, totalSongs }]) => ({
      genre,
      songs,
      totalSongs,
    }));

    await setCached(cacheKey, payload, CACHE_TTL_SECONDS);
    res.json(payload);
  })
);

discoverRouter.get(
  "/trending",
  asyncHandler(async (req, res) => {
    const limit = parseLimit(req.query.limit);
    const offset = parseOffset(req.query.offset);
    const days = parseLimit(req.query.days, 30, 365);
    const cacheKey = `discover:trending:${limit}:${offset}:${days}`;

    const cached = await getCached<unknown[]>(cacheKey);
    if (cached) return res.json(cached);

    const result = await pool.query(
      `SELECT s.id, s.title, s.album_id, al.title AS album_title, al.cover_url,
              s.artist_id, ar.name AS artist_name,
              s.duration, s.genre, s.release_date, s.credits, s.spotify_url,
              AVG(l.rating)::float AS average_rating, COUNT(l.id)::int AS logs_count
       FROM songs s
       JOIN artists ar ON ar.id = s.artist_id
       LEFT JOIN albums al ON al.id = s.album_id
       JOIN logs l ON l.song_id = s.id AND l.created_at > now() - ($3 || ' days')::interval
       WHERE al.cover_url NOT ILIKE '%picsum%'
       GROUP BY s.id, al.title, al.cover_url, ar.name
       ORDER BY (s.spotify_url IS NOT NULL) DESC, logs_count DESC, average_rating DESC NULLS LAST
       LIMIT $1 OFFSET $2`,
      [limit, offset, days]
    );
    const payload = result.rows.map((row) => ({
      ...mapSong(row),
      averageRating: row.average_rating,
      logsCount: row.logs_count,
    }));

    await setCached(cacheKey, payload, CACHE_TTL_SECONDS);
    res.json(payload);
  })
);
