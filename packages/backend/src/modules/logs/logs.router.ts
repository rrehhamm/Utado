import { Router } from "express";
import { createLogSchema, updateLogSchema } from "@utado/shared";
import { pool } from "../../db/pool";
import { asyncHandler, HttpError } from "../../middleware/errorHandler";
import { AuthedRequest, requireAuth } from "../../middleware/requireAuth";
import { optionalAuth } from "../../middleware/optionalAuth";
import { mapLogRow, mapLogRows, SELECT_LOG } from "./logs.queries";

export const logsRouter = Router();

logsRouter.get(
  "/",
  optionalAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const { songId, userId } = req.query;
    if (songId) {
      const result = await pool.query(`${SELECT_LOG} WHERE l.song_id = $1 ORDER BY l.created_at DESC`, [
        songId,
      ]);
      return res.json(await mapLogRows(result.rows, req.userId));
    }
    if (userId) {
      const result = await pool.query(`${SELECT_LOG} WHERE l.user_id = $1 ORDER BY l.logged_at DESC`, [
        userId,
      ]);
      return res.json(await mapLogRows(result.rows, req.userId));
    }
    throw new HttpError(400, "songId_or_userId_required");
  })
);

logsRouter.get(
  "/mine",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const { songId } = req.query;
    if (!songId) throw new HttpError(400, "songId_required");
    const result = await pool.query(
      `${SELECT_LOG} WHERE l.song_id = $1 AND l.user_id = $2 ORDER BY l.created_at DESC LIMIT 1`,
      [songId, req.userId]
    );
    if (!result.rows[0]) return res.json(null);
    const [log] = await mapLogRows(result.rows, req.userId);
    res.json(log);
  })
);

logsRouter.get(
  "/:id",
  optionalAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const result = await pool.query(`${SELECT_LOG} WHERE l.id = $1`, [req.params.id]);
    if (!result.rows[0]) throw new HttpError(404, "log_not_found");
    const [log] = await mapLogRows(result.rows, req.userId);
    res.json(log);
  })
);

logsRouter.post(
  "/",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const input = createLogSchema.parse(req.body);
    const song = await pool.query(`SELECT id FROM songs WHERE id = $1`, [input.songId]);
    if (!song.rows[0]) throw new HttpError(404, "song_not_found");

    const inserted = await pool.query(
      `INSERT INTO logs (user_id, song_id, rating, review, logged_at)
       VALUES ($1, $2, $3, $4, COALESCE($5, now()))
       RETURNING id`,
      [req.userId, input.songId, input.rating ?? null, input.review ?? null, input.loggedAt ?? null]
    );
    const full = await pool.query(`${SELECT_LOG} WHERE l.id = $1`, [inserted.rows[0].id]);
    res.status(201).json(mapLogRow(full.rows[0]));
  })
);

logsRouter.put(
  "/:id",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const existing = await pool.query(`SELECT user_id, rating, review FROM logs WHERE id = $1`, [
      req.params.id,
    ]);
    if (!existing.rows[0]) throw new HttpError(404, "log_not_found");
    if (existing.rows[0].user_id !== req.userId) throw new HttpError(403, "forbidden");

    const input = updateLogSchema.parse(req.body);
    const rating = input.rating !== undefined ? input.rating : existing.rows[0].rating;
    const review = input.review !== undefined ? input.review : existing.rows[0].review;

    await pool.query(`UPDATE logs SET rating = $1, review = $2, updated_at = now() WHERE id = $3`, [
      rating,
      review,
      req.params.id,
    ]);
    const full = await pool.query(`${SELECT_LOG} WHERE l.id = $1`, [req.params.id]);
    const [log] = await mapLogRows(full.rows, req.userId);
    res.json(log);
  })
);

logsRouter.delete(
  "/:id",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const existing = await pool.query(`SELECT user_id FROM logs WHERE id = $1`, [req.params.id]);
    if (!existing.rows[0]) throw new HttpError(404, "log_not_found");
    if (existing.rows[0].user_id !== req.userId) throw new HttpError(403, "forbidden");

    await pool.query(`DELETE FROM logs WHERE id = $1`, [req.params.id]);
    res.status(204).send();
  })
);

logsRouter.post(
  "/:id/like",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const log = await pool.query(`SELECT id FROM logs WHERE id = $1`, [req.params.id]);
    if (!log.rows[0]) throw new HttpError(404, "log_not_found");
    await pool.query(
      `INSERT INTO log_likes (user_id, log_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [req.userId, req.params.id]
    );
    res.status(204).send();
  })
);

logsRouter.delete(
  "/:id/like",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    await pool.query(`DELETE FROM log_likes WHERE user_id = $1 AND log_id = $2`, [
      req.userId,
      req.params.id,
    ]);
    res.status(204).send();
  })
);
