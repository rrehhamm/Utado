import { Router } from "express";
import { pool } from "../../db/pool";
import { asyncHandler, HttpError } from "../../middleware/errorHandler";

export const artistsRouter = Router();

artistsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const result = await pool.query(
      "SELECT id, name, bio, photo_url, followers_count FROM artists ORDER BY name"
    );
    res.json(
      result.rows.map((a) => ({
        id: a.id,
        name: a.name,
        bio: a.bio,
        photoUrl: a.photo_url,
        followersCount: a.followers_count,
      }))
    );
  })
);

artistsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      "SELECT id, name, bio, photo_url, followers_count FROM artists WHERE id = $1",
      [req.params.id]
    );
    const a = result.rows[0];
    if (!a) throw new HttpError(404, "artist_not_found");
    res.json({
      id: a.id,
      name: a.name,
      bio: a.bio,
      photoUrl: a.photo_url,
      followersCount: a.followers_count,
    });
  })
);
