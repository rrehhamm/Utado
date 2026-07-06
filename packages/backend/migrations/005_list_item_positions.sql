ALTER TABLE list_items ADD COLUMN position INTEGER NOT NULL DEFAULT 0;

WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY list_id ORDER BY added_at ASC) - 1 AS rn
    FROM list_items
)
UPDATE list_items li
SET position = ranked.rn
FROM ranked
WHERE li.id = ranked.id;

CREATE INDEX idx_list_items_list_id_position ON list_items(list_id, position);
