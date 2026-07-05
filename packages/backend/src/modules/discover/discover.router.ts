import { Router } from "express";
import { pool } from "../../db/pool";
import { asyncHandler } from "../../middleware/errorHandler";
import { mapSong } from "../songs/songs.queries";

export const discoverRouter = Router();

function parseLimit(raw: unknown, fallback = 20, max = 50) {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(Math.floor(n), max);
}

discoverRouter.get(
  "/top-rated",
  asyncHandler(async (req, res) => {
    const limit = parseLimit(req.query.limit);
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
       LIMIT $1`,
      [limit]
    );
    res.json(
      result.rows.map((row) => ({
        ...mapSong(row),
        averageRating: row.average_rating,
        logsCount: row.logs_count,
      }))
    );
  })
);

discoverRouter.get(
  "/trending",
  asyncHandler(async (req, res) => {
    const limit = parseLimit(req.query.limit);
    const days = parseLimit(req.query.days, 30, 365);
    const result = await pool.query(
      `SELECT s.id, s.title, s.album_id, al.title AS album_title, al.cover_url,
              s.artist_id, ar.name AS artist_name,
              s.duration, s.genre, s.release_date, s.credits,
              AVG(l.rating)::float AS average_rating, COUNT(l.id)::int AS logs_count
       FROM songs s
       JOIN artists ar ON ar.id = s.artist_id
       LEFT JOIN albums al ON al.id = s.album_id
       JOIN logs l ON l.song_id = s.id AND l.created_at > now() - ($2 || ' days')::interval
       GROUP BY s.id, al.title, al.cover_url, ar.name
       ORDER BY logs_count DESC, average_rating DESC NULLS LAST
       LIMIT $1`,
      [limit, days]
    );
    res.json(
      result.rows.map((row) => ({
        ...mapSong(row),
        averageRating: row.average_rating,
        logsCount: row.logs_count,
      }))
    );
  })
);
