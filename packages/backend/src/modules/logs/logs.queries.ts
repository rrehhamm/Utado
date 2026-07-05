import { pool } from "../../db/pool";

export const SELECT_LOG = `
  SELECT l.id, l.user_id, u.username, u.avatar_url AS user_avatar_url,
         l.song_id, s.title AS song_title, al.cover_url AS song_cover_url,
         ar.name AS artist_name,
         l.rating, l.review, l.logged_at, l.created_at, l.updated_at,
         COALESCE(lc.likes_count, 0) AS likes_count,
         COALESCE(cc.comments_count, 0) AS comments_count
  FROM logs l
  JOIN users u ON u.id = l.user_id
  JOIN songs s ON s.id = l.song_id
  JOIN artists ar ON ar.id = s.artist_id
  LEFT JOIN albums al ON al.id = s.album_id
  LEFT JOIN (SELECT log_id, COUNT(*) AS likes_count FROM log_likes GROUP BY log_id) lc ON lc.log_id = l.id
  LEFT JOIN (SELECT log_id, COUNT(*) AS comments_count FROM comments GROUP BY log_id) cc ON cc.log_id = l.id
`;

export function mapLogRow(l: any, likedLogIds?: Set<string>) {
  return {
    id: l.id,
    userId: l.user_id,
    username: l.username,
    userAvatarUrl: l.user_avatar_url,
    songId: l.song_id,
    songTitle: l.song_title,
    songCoverUrl: l.song_cover_url,
    artistName: l.artist_name,
    rating: l.rating !== null ? Number(l.rating) : null,
    review: l.review,
    loggedAt: l.logged_at,
    createdAt: l.created_at,
    updatedAt: l.updated_at,
    likesCount: Number(l.likes_count),
    commentsCount: Number(l.comments_count),
    likedByMe: likedLogIds ? likedLogIds.has(l.id) : false,
  };
}

export async function mapLogRows(rows: any[], userId?: string) {
  if (!userId || rows.length === 0) {
    return rows.map((row) => mapLogRow(row));
  }
  const ids = rows.map((row) => row.id);
  const liked = await pool.query(
    `SELECT log_id FROM log_likes WHERE user_id = $1 AND log_id = ANY($2::uuid[])`,
    [userId, ids]
  );
  const likedLogIds = new Set(liked.rows.map((r) => r.log_id));
  return rows.map((row) => mapLogRow(row, likedLogIds));
}
