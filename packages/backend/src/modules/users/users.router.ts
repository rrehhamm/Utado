import { Router } from "express";
import multer from "multer";
import { updateUserSchema } from "@utado/shared";
import { pool } from "../../db/pool";
import { asyncHandler, HttpError } from "../../middleware/errorHandler";
import { AuthedRequest, requireAuth } from "../../middleware/requireAuth";
import { optionalAuth } from "../../middleware/optionalAuth";
import { computeBadges, getBadgeInfo } from "./badges";
import { invalidateByPrefix } from "../../cache/redis";
import { feedCachePrefix } from "../feed/feed.router";
import { isCloudinaryConfigured, uploadImageBuffer } from "../../media/cloudinary";

export const usersRouter = Router();

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const SELECT_USER =
  "SELECT id, username, bio, avatar_url, pinned_song_ids, pinned_album_ids, pinned_artist_ids, created_at FROM users";

function mapUser(u: any) {
  return {
    id: u.id,
    username: u.username,
    bio: u.bio,
    avatarUrl: u.avatar_url,
    pinnedSongIds: u.pinned_song_ids,
    pinnedAlbumIds: u.pinned_album_ids,
    pinnedArtistIds: u.pinned_artist_ids,
    createdAt: u.created_at,
  };
}

usersRouter.get(
  "/:id",
  optionalAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const result = await pool.query(`${SELECT_USER} WHERE id = $1`, [req.params.id]);
    const user = result.rows[0];
    if (!user) throw new HttpError(404, "user_not_found");

    const counts = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM follows WHERE followee_id = $1)::int AS followers_count,
         (SELECT COUNT(*) FROM follows WHERE follower_id = $1)::int AS following_count`,
      [req.params.id]
    );
    let isFollowing = false;
    if (req.userId) {
      const following = await pool.query(
        `SELECT 1 FROM follows WHERE follower_id = $1 AND followee_id = $2`,
        [req.userId, req.params.id]
      );
      isFollowing = (following.rowCount ?? 0) > 0;
    }

    res.json({
      ...mapUser(user),
      followersCount: counts.rows[0].followers_count,
      followingCount: counts.rows[0].following_count,
      isFollowing,
    });
  })
);

usersRouter.put(
  "/:id",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (req.userId !== req.params.id) {
      throw new HttpError(403, "forbidden");
    }
    const input = updateUserSchema.parse(req.body);

    const result = await pool.query(
      `UPDATE users SET
         bio = COALESCE($1, bio),
         avatar_url = COALESCE($2, avatar_url),
         pinned_song_ids = COALESCE($3, pinned_song_ids),
         pinned_album_ids = COALESCE($4, pinned_album_ids),
         pinned_artist_ids = COALESCE($5, pinned_artist_ids)
       WHERE id = $6
       RETURNING id, username, bio, avatar_url, pinned_song_ids, pinned_album_ids, pinned_artist_ids, created_at`,
      [
        input.bio ?? null,
        input.avatarUrl ?? null,
        input.pinnedSongIds ?? null,
        input.pinnedAlbumIds ?? null,
        input.pinnedArtistIds ?? null,
        req.params.id,
      ]
    );
    const user = result.rows[0];
    if (!user) throw new HttpError(404, "user_not_found");
    res.json(mapUser(user));
  })
);

usersRouter.post(
  "/:id/avatar",
  requireAuth,
  avatarUpload.single("avatar"),
  asyncHandler(async (req: AuthedRequest, res) => {
    if (req.userId !== req.params.id) throw new HttpError(403, "forbidden");
    if (!isCloudinaryConfigured()) throw new HttpError(503, "image_uploads_not_configured");
    if (!req.file) throw new HttpError(400, "no_file_uploaded");
    if (!req.file.mimetype.startsWith("image/")) throw new HttpError(400, "file_must_be_an_image");

    const url = await uploadImageBuffer(req.file.buffer, `utado/avatars/${req.params.id}`);

    const result = await pool.query(
      `UPDATE users SET avatar_url = $1 WHERE id = $2
       RETURNING id, username, bio, avatar_url, pinned_song_ids, pinned_album_ids, pinned_artist_ids, created_at`,
      [url, req.params.id]
    );
    res.json(mapUser(result.rows[0]));
  })
);

usersRouter.post(
  "/:id/follow",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (req.userId === req.params.id) throw new HttpError(400, "cannot_follow_self");
    const target = await pool.query(`SELECT id FROM users WHERE id = $1`, [req.params.id]);
    if (!target.rows[0]) throw new HttpError(404, "user_not_found");

    await pool.query(
      `INSERT INTO follows (follower_id, followee_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [req.userId, req.params.id]
    );
    await invalidateByPrefix(feedCachePrefix(req.userId!));
    res.status(204).send();
  })
);

usersRouter.delete(
  "/:id/follow",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    await pool.query(`DELETE FROM follows WHERE follower_id = $1 AND followee_id = $2`, [
      req.userId,
      req.params.id,
    ]);
    await invalidateByPrefix(feedCachePrefix(req.userId!));
    res.status(204).send();
  })
);

const SELECT_USER_JOINED =
  "SELECT u.id, u.username, u.bio, u.avatar_url, u.pinned_song_ids, u.pinned_album_ids, u.pinned_artist_ids, u.created_at FROM users u";

usersRouter.get(
  "/:id/stats",
  asyncHandler(async (req, res) => {
    const user = await pool.query(`SELECT id FROM users WHERE id = $1`, [req.params.id]);
    if (!user.rows[0]) throw new HttpError(404, "user_not_found");

    const logStats = await pool.query(
      `SELECT COUNT(*)::int AS logs_count,
              COUNT(*) FILTER (WHERE review IS NOT NULL AND review <> '')::int AS reviews_count,
              AVG(rating)::float AS average_rating_given
       FROM logs WHERE user_id = $1`,
      [req.params.id]
    );

    const catalogStats = await pool.query(
      `SELECT COUNT(DISTINCT s.artist_id)::int AS unique_artists_count,
              COUNT(DISTINCT s.album_id)::int AS unique_albums_count
       FROM logs l JOIN songs s ON s.id = l.song_id
       WHERE l.user_id = $1`,
      [req.params.id]
    );

    const distribution = await pool.query(
      `SELECT ROUND(rating)::int AS bucket, COUNT(*)::int AS count
       FROM logs WHERE user_id = $1 AND rating IS NOT NULL
       GROUP BY bucket`,
      [req.params.id]
    );
    const distMap = new Map(distribution.rows.map((r) => [r.bucket, r.count]));
    const ratingDistribution = [1, 2, 3, 4, 5].map((rating) => ({
      rating,
      count: distMap.get(rating) ?? 0,
    }));

    const topGenreResult = await pool.query(
      `SELECT s.genre, COUNT(*)::int AS count
       FROM logs l JOIN songs s ON s.id = l.song_id
       WHERE l.user_id = $1 AND s.genre IS NOT NULL
       GROUP BY s.genre ORDER BY count DESC LIMIT 1`,
      [req.params.id]
    );

    const topArtistResult = await pool.query(
      `SELECT s.artist_id, ar.name, COUNT(*)::int AS count
       FROM logs l JOIN songs s ON s.id = l.song_id JOIN artists ar ON ar.id = s.artist_id
       WHERE l.user_id = $1
       GROUP BY s.artist_id, ar.name ORDER BY count DESC LIMIT 1`,
      [req.params.id]
    );

    const listsResult = await pool.query(`SELECT COUNT(*)::int AS lists_count FROM lists WHERE user_id = $1`, [
      req.params.id,
    ]);

    const followCounts = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM follows WHERE followee_id = $1)::int AS followers_count,
         (SELECT COUNT(*) FROM follows WHERE follower_id = $1)::int AS following_count`,
      [req.params.id]
    );

    const logsCount = logStats.rows[0].logs_count;
    const reviewsCount = logStats.rows[0].reviews_count;
    const uniqueArtistsCount = catalogStats.rows[0].unique_artists_count;
    const listsCount = listsResult.rows[0].lists_count;
    const followersCount = followCounts.rows[0].followers_count;

    const badges = computeBadges({ logsCount, reviewsCount, listsCount, followersCount, uniqueArtistsCount });

    const earnedSlugs = badges.filter((b) => b.earned).map((b) => b.slug);
    if (earnedSlugs.length > 0) {
      await pool.query(
        `INSERT INTO user_badge_notifications (user_id, badge_slug)
         SELECT $1, slug FROM UNNEST($2::varchar[]) AS slug
         ON CONFLICT (user_id, badge_slug) DO NOTHING`,
        [req.params.id, earnedSlugs]
      );
    }

    res.json({
      logsCount,
      reviewsCount,
      averageRatingGiven: logStats.rows[0].average_rating_given,
      uniqueArtistsCount,
      uniqueAlbumsCount: catalogStats.rows[0].unique_albums_count,
      ratingDistribution,
      topGenre: topGenreResult.rows[0]?.genre ?? null,
      topArtist: topArtistResult.rows[0]
        ? {
            id: topArtistResult.rows[0].artist_id,
            name: topArtistResult.rows[0].name,
            count: topArtistResult.rows[0].count,
          }
        : null,
      listsCount,
      followersCount,
      followingCount: followCounts.rows[0].following_count,
      badges,
    });
  })
);

usersRouter.get(
  "/:id/badge-notifications/unseen",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (req.userId !== req.params.id) throw new HttpError(403, "forbidden");

    const result = await pool.query(
      `SELECT badge_slug, earned_at FROM user_badge_notifications
       WHERE user_id = $1 AND seen_at IS NULL
       ORDER BY earned_at ASC`,
      [req.params.id]
    );
    const notifications = result.rows
      .map((row) => {
        const info = getBadgeInfo(row.badge_slug);
        if (!info) return null;
        return { slug: row.badge_slug, label: info.label, description: info.description, earnedAt: row.earned_at };
      })
      .filter((n): n is NonNullable<typeof n> => n !== null);

    res.json(notifications);
  })
);

usersRouter.post(
  "/:id/badge-notifications/:slug/seen",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (req.userId !== req.params.id) throw new HttpError(403, "forbidden");

    await pool.query(
      `UPDATE user_badge_notifications SET seen_at = now() WHERE user_id = $1 AND badge_slug = $2`,
      [req.params.id, req.params.slug]
    );
    res.status(204).send();
  })
);

usersRouter.get(
  "/:id/followers",
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      `${SELECT_USER_JOINED}
       JOIN follows f ON f.follower_id = u.id
       WHERE f.followee_id = $1
       ORDER BY f.created_at DESC`,
      [req.params.id]
    );
    res.json(result.rows.map(mapUser));
  })
);

usersRouter.get(
  "/:id/following",
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      `${SELECT_USER_JOINED}
       JOIN follows f ON f.followee_id = u.id
       WHERE f.follower_id = $1
       ORDER BY f.created_at DESC`,
      [req.params.id]
    );
    res.json(result.rows.map(mapUser));
  })
);
