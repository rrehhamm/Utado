import { Router } from "express";
import { pool } from "../../db/pool";
import { asyncHandler } from "../../middleware/errorHandler";
import { AuthedRequest, requireAuth } from "../../middleware/requireAuth";
import { mapLogRows, SELECT_LOG } from "../logs/logs.queries";

export const feedRouter = Router();

feedRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const result = await pool.query(
      `${SELECT_LOG}
       WHERE l.user_id IN (SELECT followee_id FROM follows WHERE follower_id = $1)
       ORDER BY l.created_at DESC
       LIMIT 50`,
      [req.userId]
    );
    res.json(await mapLogRows(result.rows, req.userId));
  })
);
