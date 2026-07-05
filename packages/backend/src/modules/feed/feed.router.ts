import { Router } from "express";
import { pool } from "../../db/pool";
import { asyncHandler } from "../../middleware/errorHandler";
import { AuthedRequest, requireAuth } from "../../middleware/requireAuth";
import { mapLogRows, SELECT_LOG } from "../logs/logs.queries";
import { getCached, setCached } from "../../cache/redis";
import { parseCursor, parseLimit } from "../../lib/pagination";

export const feedRouter = Router();

const CACHE_TTL_SECONDS = 20;

/** Prefix shared by every cached page of a user's feed; used for both cache keys and prefix invalidation. */
export function feedCachePrefix(userId: string) {
  return `feed:${userId}:`;
}

feedRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const limit = parseLimit(req.query.limit);
    const cursor = parseCursor(req.query.before);
    const cacheKey = `${feedCachePrefix(req.userId!)}${limit}:${cursor ?? "start"}`;

    const cached = await getCached<unknown[]>(cacheKey);
    if (cached) return res.json(cached);

    const result = await pool.query(
      `${SELECT_LOG}
       WHERE l.user_id IN (SELECT followee_id FROM follows WHERE follower_id = $1)
       ${cursor ? "AND l.created_at < $3" : ""}
       ORDER BY l.created_at DESC
       LIMIT $2`,
      cursor ? [req.userId, limit, cursor] : [req.userId, limit]
    );
    const payload = await mapLogRows(result.rows, req.userId);

    await setCached(cacheKey, payload, CACHE_TTL_SECONDS);
    res.json(payload);
  })
);
