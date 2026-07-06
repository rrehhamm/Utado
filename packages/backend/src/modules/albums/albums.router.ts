import { Router } from "express";
import { pool } from "../../db/pool";
import { asyncHandler, HttpError } from "../../middleware/errorHandler";
import { parseLimit } from "../../lib/pagination";

export const albumsRouter = Router();

const SELECT_ALBUM = `
  SELECT al.id, al.title, al.artist_id, ar.name AS artist_name,
         al.cover_url, al.release_date, al.genre, al.spotify_url
  FROM albums al
  JOIN artists ar ON ar.id = al.artist_id
`;

function mapAlbum(a: any) {
  return {
    id: a.id,
    title: a.title,
    artistId: a.artist_id,
    artistName: a.artist_name,
    coverUrl: a.cover_url,
    releaseDate: a.release_date,
    genre: a.genre,
    spotifyUrl: a.spotify_url,
  };
}

albumsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { artistId } = req.query;
    if (typeof artistId === "string") {
      const limit = parseLimit(req.query.limit, 20, 50);
      const result = await pool.query(
        `${SELECT_ALBUM} WHERE al.artist_id = $1 ORDER BY al.release_date DESC NULLS LAST, al.title LIMIT $2`,
        [artistId, limit]
      );
      res.json(result.rows.map(mapAlbum));
      return;
    }
    const result = await pool.query(`${SELECT_ALBUM} ORDER BY al.title`);
    res.json(result.rows.map(mapAlbum));
  })
);

albumsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const result = await pool.query(`${SELECT_ALBUM} WHERE al.id = $1`, [req.params.id]);
    const album = result.rows[0];
    if (!album) throw new HttpError(404, "album_not_found");

    const songs = await pool.query(
      "SELECT id, title, duration, genre, spotify_url FROM songs WHERE album_id = $1 ORDER BY title",
      [req.params.id]
    );

    res.json({ ...mapAlbum(album), songs: songs.rows });
  })
);
