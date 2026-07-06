import { Router } from "express";
import { pool } from "../../db/pool";
import { asyncHandler, HttpError } from "../../middleware/errorHandler";
import { parseLimit } from "../../lib/pagination";
import { mapSong, SELECT_SONG } from "./songs.queries";

export const songsRouter = Router();

songsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { artistId } = req.query;
    if (typeof artistId === "string") {
      const limit = parseLimit(req.query.limit, 50, 100);
      const result = await pool.query(
        `${SELECT_SONG} WHERE s.artist_id = $1 ORDER BY s.release_date DESC NULLS LAST, s.title LIMIT $2`,
        [artistId, limit]
      );
      res.json(result.rows.map(mapSong));
      return;
    }
    const result = await pool.query(`${SELECT_SONG} ORDER BY s.title`);
    res.json(result.rows.map(mapSong));
  })
);

songsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const result = await pool.query(`${SELECT_SONG} WHERE s.id = $1`, [req.params.id]);
    const song = result.rows[0];
    if (!song) throw new HttpError(404, "song_not_found");
    const stats = await pool.query(
      `SELECT COUNT(*)::int AS logs_count, AVG(rating)::float AS average_rating
       FROM logs WHERE song_id = $1 AND rating IS NOT NULL`,
      [req.params.id]
    );
    res.json({
      ...mapSong(song),
      logsCount: stats.rows[0].logs_count,
      averageRating: stats.rows[0].average_rating,
    });
  })
);
