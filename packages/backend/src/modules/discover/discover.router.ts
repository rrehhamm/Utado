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
              s.duration, s.genre, s.release_date, s.credits,
              AVG(l.rating)::float AS average_rating, COUNT(l.id)::int AS logs_count
       FROM songs s
       JOIN artists ar ON ar.id = s.artist_id
       LEFT JOIN albums al ON al.id = s.album_id
       JOIN logs l ON l.song_id = s.id AND l.rating IS NOT NULL
       GROUP BY s.id, al.title, al.cover_url, ar.name
       ORDER BY average_rating DESC, logs_count DESC
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
              s.duration, s.genre, s.release_date, s.credits,
              AVG(l.rating)::float AS average_rating, COUNT(l.id)::int AS logs_count
       FROM songs s
       JOIN artists ar ON ar.id = s.artist_id
       LEFT JOIN albums al ON al.id = s.album_id
       JOIN logs l ON l.song_id = s.id AND l.created_at > now() - ($3 || ' days')::interval
       GROUP BY s.id, al.title, al.cover_url, ar.name
       ORDER BY logs_count DESC, average_rating DESC NULLS LAST
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
