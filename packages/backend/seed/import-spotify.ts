import "dotenv/config";
import { pool } from "../src/db/pool";
import {
  bestImage,
  getAlbumTracks,
  getArtistAlbums,
  isSpotifyConfigured,
  searchArtist,
} from "../src/media/spotify";

/**
 * Populates the same artists/albums/songs tables as seed/seed.ts and
 * import-musicbrainz.ts, but from Spotify's real catalog - a much bigger and
 * more current dataset, with real high-res cover art and an external
 * "Listen on Spotify" link per artist/album/song. Run on demand
 * (npm run import:spotify) - not part of normal setup or CI, since it needs
 * real SPOTIFY_CLIENT_ID/SECRET credentials and network access.
 *
 * Spotify's Web API no longer returns preview_url or popularity for apps
 * created after Nov 2024, so this only imports metadata (no audio previews),
 * unlike what older Spotify integrations could rely on.
 */

function normalizeReleaseDate(raw: string | undefined): string | null {
  if (!raw) return null;
  if (/^\d{4}$/.test(raw)) return `${raw}-01-01`;
  if (/^\d{4}-\d{2}$/.test(raw)) return `${raw}-01`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  return null;
}

function buildBio(genres: string[], followers: number): string {
  const parts: string[] = [];
  if (genres.length > 0) parts.push(genres.slice(0, 3).join(", "));
  if (followers > 0) parts.push(`${followers.toLocaleString()} Spotify followers`);
  return parts.length > 0 ? parts.join(" · ") : "Imported from Spotify.";
}

async function importArtist(name: string, albumsPerArtist: number) {
  console.log(`\nImporting ${name}...`);

  const match = await searchArtist(name);
  if (!match) {
    console.warn(`  no Spotify match for "${name}", skipping`);
    return;
  }

  const genres = match.genres ?? [];
  const followers = match.followers?.total ?? 0;

  const existing = await pool.query(`SELECT id FROM artists WHERE name = $1`, [match.name]);
  let artistId: string;
  if (existing.rows[0]) {
    artistId = existing.rows[0].id;
    console.log(`  artist already imported, reusing id ${artistId}`);
    await pool.query(`UPDATE artists SET spotify_url = $1 WHERE id = $2 AND spotify_url IS NULL`, [
      match.external_urls.spotify,
      artistId,
    ]);
  } else {
    const inserted = await pool.query(
      `INSERT INTO artists (name, bio, photo_url, followers_count, spotify_url)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [match.name, buildBio(genres, followers), bestImage(match.images), followers, match.external_urls.spotify]
    );
    artistId = inserted.rows[0].id;
    console.log(`  inserted artist ${match.name} (${artistId})`);
  }

  const artistGenre = genres[0] ?? null;
  const albums = await getArtistAlbums(match.id, albumsPerArtist);

  for (const album of albums) {
    const existingAlbum = await pool.query(`SELECT id FROM albums WHERE title = $1 AND artist_id = $2`, [
      album.name,
      artistId,
    ]);
    if (existingAlbum.rows[0]) {
      console.log(`  album "${album.name}" already imported, skipping`);
      continue;
    }

    const releaseDate = normalizeReleaseDate(album.release_date);
    const insertedAlbum = await pool.query(
      `INSERT INTO albums (title, artist_id, cover_url, release_date, genre, spotify_url)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [album.name, artistId, bestImage(album.images), releaseDate, artistGenre, album.external_urls.spotify]
    );
    const albumId = insertedAlbum.rows[0].id;
    console.log(`  inserted album "${album.name}" (${albumId})`);

    const tracks = await getAlbumTracks(album.id);
    for (const track of tracks) {
      await pool.query(
        `INSERT INTO songs (title, album_id, artist_id, duration, genre, release_date, credits, spotify_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          track.name,
          albumId,
          artistId,
          Math.round(track.duration_ms / 1000),
          artistGenre,
          releaseDate,
          null,
          track.external_urls.spotify,
        ]
      );
    }
    console.log(`    imported ${tracks.length} tracks`);
  }
}

const DEFAULT_ARTISTS = [
  "The Weeknd",
  "Dua Lipa",
  "Tyler, The Creator",
  "Billie Eilish",
  "Tame Impala",
  "SZA",
  "Arctic Monkeys",
  "Frank Ocean",
];

async function run() {
  if (!isSpotifyConfigured()) {
    console.error("SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET are not set - aborting.");
    process.exit(1);
  }

  const artistNames = process.argv.slice(2).length > 0 ? process.argv.slice(2) : DEFAULT_ARTISTS;
  const albumsPerArtist = 3;

  console.log(`Importing ${artistNames.length} artist(s) from Spotify (up to ${albumsPerArtist} albums each)...`);

  for (const name of artistNames) {
    try {
      await importArtist(name, albumsPerArtist);
    } catch (err) {
      console.error(`  failed to import "${name}":`, (err as Error).message);
    }
  }

  await pool.end();
  console.log("\nImport complete.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
