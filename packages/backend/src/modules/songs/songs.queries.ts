export const SELECT_SONG = `
  SELECT s.id, s.title, s.album_id, al.title AS album_title, al.cover_url,
         s.artist_id, ar.name AS artist_name,
         s.duration, s.genre, s.release_date, s.credits, s.spotify_url
  FROM songs s
  JOIN artists ar ON ar.id = s.artist_id
  LEFT JOIN albums al ON al.id = s.album_id
`;

export function mapSong(s: any) {
  return {
    id: s.id,
    title: s.title,
    albumId: s.album_id,
    albumTitle: s.album_title,
    coverUrl: s.cover_url,
    artistId: s.artist_id,
    artistName: s.artist_name,
    duration: s.duration,
    genre: s.genre,
    releaseDate: s.release_date,
    credits: s.credits,
    spotifyUrl: s.spotify_url,
  };
}
