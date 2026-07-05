import { Router } from "express";
import { createCommentSchema } from "@utado/shared";
import { pool } from "../../db/pool";
import { asyncHandler, HttpError } from "../../middleware/errorHandler";
import { AuthedRequest, requireAuth } from "../../middleware/requireAuth";

export const commentsRouter = Router({ mergeParams: true });

const SELECT_COMMENT = `
  SELECT c.id, c.log_id, c.user_id, u.username, u.avatar_url AS user_avatar_url, c.body, c.created_at
  FROM comments c
  JOIN users u ON u.id = c.user_id
`;

function mapComment(c: any) {
  return {
    id: c.id,
    logId: c.log_id,
    userId: c.user_id,
    username: c.username,
    userAvatarUrl: c.user_avatar_url,
    body: c.body,
    createdAt: c.created_at,
  };
}

commentsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const result = await pool.query(`${SELECT_COMMENT} WHERE c.log_id = $1 ORDER BY c.created_at ASC`, [
      req.params.logId,
    ]);
    res.json(result.rows.map(mapComment));
  })
);

commentsRouter.post(
  "/",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const log = await pool.query(`SELECT id FROM logs WHERE id = $1`, [req.params.logId]);
    if (!log.rows[0]) throw new HttpError(404, "log_not_found");

    const input = createCommentSchema.parse(req.body);
    const inserted = await pool.query(
      `INSERT INTO comments (log_id, user_id, body) VALUES ($1, $2, $3) RETURNING id`,
      [req.params.logId, req.userId, input.body]
    );
    const full = await pool.query(`${SELECT_COMMENT} WHERE c.id = $1`, [inserted.rows[0].id]);
    res.status(201).json(mapComment(full.rows[0]));
  })
);

commentsRouter.delete(
  "/:commentId",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const existing = await pool.query(`SELECT user_id FROM comments WHERE id = $1`, [
      req.params.commentId,
    ]);
    if (!existing.rows[0]) throw new HttpError(404, "comment_not_found");
    if (existing.rows[0].user_id !== req.userId) throw new HttpError(403, "forbidden");

    await pool.query(`DELETE FROM comments WHERE id = $1`, [req.params.commentId]);
    res.status(204).send();
  })
);
