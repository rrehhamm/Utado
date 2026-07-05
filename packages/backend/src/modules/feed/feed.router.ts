import { Router } from "express";
import { pool } from "../../db/pool";
import { asyncHandler } from "../../middleware/errorHandler";
import { AuthedRequest, requireAuth } from "../../middleware/requireAuth";
import { mapLogRows, SELECT_LOG } from "../logs/logs.queries";
import { getCached, setCached } from "../../cache/redis";

export const feedRouter = Router();

const CACHE_TTL_SECONDS = 20;

export function feedCacheKey(userId: string) {
  return `feed:${userId}`;
}

feedRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const cacheKey = feedCacheKey(req.userId!);
    const cached = await getCached<unknown[]>(cacheKey);
    if (cached) return res.json(cached);

    const result = await pool.query(
      `${SELECT_LOG}
       WHERE l.user_id IN (SELECT followee_id FROM follows WHERE follower_id = $1)
       ORDER BY l.created_at DESC
       LIMIT 50`,
      [req.userId]
    );
    const payload = await mapLogRows(result.rows, req.userId);

    await setCached(cacheKey, payload, CACHE_TTL_SECONDS);
    res.json(payload);
  })
);
