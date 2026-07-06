const TOKEN_URL = "https://accounts.spotify.com/api/token";
const API_BASE = "https://api.spotify.com/v1";

export function isSpotifyConfigured(): boolean {
  return Boolean(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET);
}

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 10_000) {
    return cachedToken.value;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Spotify is not configured");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  if (!res.ok) throw new Error(`Spotify token request failed: ${res.status} ${await res.text()}`);

  const body = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: body.access_token, expiresAt: Date.now() + body.expires_in * 1000 };
  return cachedToken.value;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const MAX_RETRIES = 4;

async function spotifyFetch<T>(path: string): Promise<T> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const token = await getAccessToken();
    const res = await fetch(`${API_BASE}${path}`, { headers: { Authorization: `Bearer ${token}` } });

    if (res.status === 429) {
      const retryAfter = Number(res.headers.get("Retry-After")) || attempt * 3;
      await sleep(retryAfter * 1000);
      continue;
    }
    if (res.status >= 500) {
      await sleep(attempt * 2000);
      continue;
    }
    if (!res.ok) throw new Error(`Spotify request failed: ${res.status} ${await res.text()} (${path})`);
    return res.json() as Promise<T>;
  }
  throw new Error(`Spotify request failed after ${MAX_RETRIES} attempts (${path})`);
}

export interface SpotifyImage {
  url: string;
  width: number | null;
  height: number | null;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  genres?: string[];
  images: SpotifyImage[];
  followers?: { total: number };
  external_urls: { spotify: string };
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  album_type: string;
  release_date: string;
  images: SpotifyImage[];
  external_urls: { spotify: string };
}

export interface SpotifyTrack {
  id: string;
  name: string;
  track_number: number;
  duration_ms: number;
  external_urls: { spotify: string };
}

export async function searchArtist(name: string): Promise<SpotifyArtist | null> {
  const data = await spotifyFetch<{ artists: { items: SpotifyArtist[] } }>(
    `/search?q=${encodeURIComponent(name)}&type=artist&limit=5`
  );
  const items = data.artists.items;
  const exact = items.find((a) => a.name.toLowerCase() === name.toLowerCase());
  return exact ?? items[0] ?? null;
}

// Spotify documents a max `limit` of 50 for this endpoint, but apps in
// Development Mode (the default for a freshly created app, before Spotify
// grants "Extended API Access") get a 400 "Invalid limit" above 10 - so this
// paginates in pages of 10 instead of requesting one large page.
const ARTIST_ALBUMS_PAGE_SIZE = 10;
const MAX_ARTIST_ALBUMS_PAGES = 3;

/** Spotify returns near-duplicate album entries per market/edition; dedupe by lowercased name, keeping the first (most relevant) one. */
export async function getArtistAlbums(artistId: string, limit: number): Promise<SpotifyAlbum[]> {
  const seen = new Set<string>();
  const deduped: SpotifyAlbum[] = [];

  for (let page = 0; page < MAX_ARTIST_ALBUMS_PAGES && deduped.length < limit; page++) {
    const offset = page * ARTIST_ALBUMS_PAGE_SIZE;
    const data = await spotifyFetch<{ items: SpotifyAlbum[]; next: string | null }>(
      `/artists/${artistId}/albums?include_groups=album&market=US&limit=${ARTIST_ALBUMS_PAGE_SIZE}&offset=${offset}`
    );
    for (const album of data.items) {
      const key = album.name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(album);
      if (deduped.length >= limit) break;
    }
    if (!data.next || data.items.length === 0) break;
  }

  return deduped;
}

export async function getAlbumTracks(albumId: string): Promise<SpotifyTrack[]> {
  const data = await spotifyFetch<{ items: SpotifyTrack[] }>(`/albums/${albumId}/tracks?market=US&limit=50`);
  return data.items;
}

export function bestImage(images: SpotifyImage[]): string | null {
  if (images.length === 0) return null;
  return [...images].sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0].url;
}
