import { Router } from "express";
import {
  addListItemSchema,
  createListSchema,
  reorderListItemsSchema,
  updateListSchema,
} from "@utado/shared";
import { pool } from "../../db/pool";
import { asyncHandler, HttpError } from "../../middleware/errorHandler";
import { AuthedRequest, requireAuth } from "../../middleware/requireAuth";

export const listsRouter = Router();

const SELECT_LIST = `
  SELECT l.id, l.user_id, u.username, l.title, l.description, l.created_at, l.updated_at
  FROM lists l
  JOIN users u ON u.id = l.user_id
`;

const SELECT_LIST_ITEM = `
  SELECT li.id, li.list_id, li.song_id, s.title AS song_title, al.cover_url AS song_cover_url,
         ar.name AS artist_name, li.added_at, li.position
  FROM list_items li
  JOIN songs s ON s.id = li.song_id
  JOIN artists ar ON ar.id = s.artist_id
  LEFT JOIN albums al ON al.id = s.album_id
`;

function mapList(l: any, itemsCount: number, coverUrls: (string | null)[]) {
  return {
    id: l.id,
    userId: l.user_id,
    username: l.username,
    title: l.title,
    description: l.description,
    itemsCount,
    coverUrls,
    createdAt: l.created_at,
    updatedAt: l.updated_at,
  };
}

function mapListItem(i: any) {
  return {
    id: i.id,
    listId: i.list_id,
    songId: i.song_id,
    songTitle: i.song_title,
    songCoverUrl: i.song_cover_url,
    artistName: i.artist_name,
    addedAt: i.added_at,
    position: i.position,
  };
}

async function attachListStats(rows: any[]) {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);

  const counts = await pool.query(
    `SELECT list_id, COUNT(*)::int AS items_count FROM list_items WHERE list_id = ANY($1::uuid[]) GROUP BY list_id`,
    [ids]
  );
  const countMap = new Map(counts.rows.map((r) => [r.list_id, r.items_count]));

  const covers = await pool.query(
    `SELECT li.list_id, al.cover_url
     FROM list_items li
     JOIN songs s ON s.id = li.song_id
     LEFT JOIN albums al ON al.id = s.album_id
     WHERE li.list_id = ANY($1::uuid[])
     ORDER BY li.position ASC`,
    [ids]
  );
  const coverMap = new Map<string, (string | null)[]>();
  for (const row of covers.rows) {
    const arr = coverMap.get(row.list_id) ?? [];
    if (arr.length < 4) arr.push(row.cover_url);
    coverMap.set(row.list_id, arr);
  }

  return rows.map((row) => mapList(row, countMap.get(row.id) ?? 0, coverMap.get(row.id) ?? []));
}

async function requireOwnedList(listId: string, userId?: string) {
  const result = await pool.query(`SELECT user_id FROM lists WHERE id = $1`, [listId]);
  if (!result.rows[0]) throw new HttpError(404, "list_not_found");
  if (result.rows[0].user_id !== userId) throw new HttpError(403, "forbidden");
}

listsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { userId } = req.query;
    if (!userId) throw new HttpError(400, "userId_required");
    const result = await pool.query(`${SELECT_LIST} WHERE l.user_id = $1 ORDER BY l.updated_at DESC`, [
      userId,
    ]);
    res.json(await attachListStats(result.rows));
  })
);

listsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const result = await pool.query(`${SELECT_LIST} WHERE l.id = $1`, [req.params.id]);
    if (!result.rows[0]) throw new HttpError(404, "list_not_found");
    const [list] = await attachListStats(result.rows);

    const items = await pool.query(`${SELECT_LIST_ITEM} WHERE li.list_id = $1 ORDER BY li.position ASC`, [
      req.params.id,
    ]);
    res.json({ ...list, items: items.rows.map(mapListItem) });
  })
);

listsRouter.post(
  "/",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const input = createListSchema.parse(req.body);
    const inserted = await pool.query(
      `INSERT INTO lists (user_id, title, description) VALUES ($1, $2, $3) RETURNING id`,
      [req.userId, input.title, input.description ?? null]
    );
    const full = await pool.query(`${SELECT_LIST} WHERE l.id = $1`, [inserted.rows[0].id]);
    const [list] = await attachListStats(full.rows);
    res.status(201).json({ ...list, items: [] });
  })
);

listsRouter.put(
  "/:id",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    await requireOwnedList(req.params.id, req.userId);
    const input = updateListSchema.parse(req.body);

    await pool.query(
      `UPDATE lists SET
         title = COALESCE($1, title),
         description = COALESCE($2, description),
         updated_at = now()
       WHERE id = $3`,
      [input.title ?? null, input.description ?? null, req.params.id]
    );
    const full = await pool.query(`${SELECT_LIST} WHERE l.id = $1`, [req.params.id]);
    const [list] = await attachListStats(full.rows);
    res.json(list);
  })
);

listsRouter.delete(
  "/:id",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    await requireOwnedList(req.params.id, req.userId);
    await pool.query(`DELETE FROM lists WHERE id = $1`, [req.params.id]);
    res.status(204).send();
  })
);

listsRouter.post(
  "/:id/items",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    await requireOwnedList(req.params.id, req.userId);
    const input = addListItemSchema.parse(req.body);

    const song = await pool.query(`SELECT id FROM songs WHERE id = $1`, [input.songId]);
    if (!song.rows[0]) throw new HttpError(404, "song_not_found");

    await pool.query(
      `INSERT INTO list_items (list_id, song_id, position)
       VALUES ($1, $2, (SELECT COALESCE(MAX(position), -1) + 1 FROM list_items WHERE list_id = $1))
       ON CONFLICT DO NOTHING`,
      [req.params.id, input.songId]
    );
    await pool.query(`UPDATE lists SET updated_at = now() WHERE id = $1`, [req.params.id]);

    const items = await pool.query(`${SELECT_LIST_ITEM} WHERE li.list_id = $1 ORDER BY li.position ASC`, [
      req.params.id,
    ]);
    res.status(201).json(items.rows.map(mapListItem));
  })
);

listsRouter.put(
  "/:id/items/reorder",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    await requireOwnedList(req.params.id, req.userId);
    const input = reorderListItemsSchema.parse(req.body);

    const existing = await pool.query(`SELECT song_id FROM list_items WHERE list_id = $1`, [
      req.params.id,
    ]);
    const existingIds = new Set(existing.rows.map((r) => r.song_id));
    const providedIds = new Set(input.songIds);
    const sameSet =
      existingIds.size === providedIds.size &&
      [...existingIds].every((id) => providedIds.has(id));
    if (!sameSet) {
      throw new HttpError(400, "songIds_must_match_existing_items");
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      for (let i = 0; i < input.songIds.length; i++) {
        await client.query(
          `UPDATE list_items SET position = $1 WHERE list_id = $2 AND song_id = $3`,
          [i, req.params.id, input.songIds[i]]
        );
      }
      await client.query(`UPDATE lists SET updated_at = now() WHERE id = $1`, [req.params.id]);
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }

    const items = await pool.query(`${SELECT_LIST_ITEM} WHERE li.list_id = $1 ORDER BY li.position ASC`, [
      req.params.id,
    ]);
    res.json(items.rows.map(mapListItem));
  })
);

listsRouter.delete(
  "/:id/items/:songId",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    await requireOwnedList(req.params.id, req.userId);
    await pool.query(`DELETE FROM list_items WHERE list_id = $1 AND song_id = $2`, [
      req.params.id,
      req.params.songId,
    ]);
    await pool.query(`UPDATE lists SET updated_at = now() WHERE id = $1`, [req.params.id]);
    res.status(204).send();
  })
);
