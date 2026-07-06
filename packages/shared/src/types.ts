export interface User {
  id: string;
  username: string;
  email: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export interface PublicUser {
  id: string;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  pinnedSongIds: string[];
  pinnedAlbumIds: string[];
  pinnedArtistIds: string[];
  createdAt: string;
  followersCount?: number;
  followingCount?: number;
  isFollowing?: boolean;
}

export interface Artist {
  id: string;
  name: string;
  bio: string | null;
  photoUrl: string | null;
  followersCount: number;
  spotifyUrl?: string | null;
}

export interface Album {
  id: string;
  title: string;
  artistId: string;
  artistName?: string;
  coverUrl: string | null;
  releaseDate: string | null;
  genre: string | null;
  spotifyUrl?: string | null;
}

export interface Song {
  id: string;
  title: string;
  albumId: string | null;
  albumTitle?: string;
  artistId: string;
  artistName?: string;
  coverUrl?: string | null;
  duration: number | null;
  genre: string | null;
  releaseDate: string | null;
  credits: string | null;
  averageRating?: number | null;
  logsCount?: number;
  spotifyUrl?: string | null;
}

export interface Log {
  id: string;
  userId: string;
  username?: string;
  userAvatarUrl?: string | null;
  songId: string;
  songTitle?: string;
  songCoverUrl?: string | null;
  artistName?: string;
  rating: number | null;
  review: string | null;
  loggedAt: string;
  createdAt: string;
  updatedAt: string;
  likesCount: number;
  commentsCount: number;
  likedByMe: boolean;
}

export interface Comment {
  id: string;
  logId: string;
  userId: string;
  username: string;
  userAvatarUrl: string | null;
  body: string;
  createdAt: string;
}

export interface List {
  id: string;
  userId: string;
  username?: string;
  title: string;
  description: string | null;
  itemsCount: number;
  coverUrls?: (string | null)[];
  createdAt: string;
  updatedAt: string;
}

export interface ListItem {
  id: string;
  listId: string;
  songId: string;
  songTitle: string;
  songCoverUrl: string | null;
  artistName: string;
  addedAt: string;
  position: number;
}

export interface ListWithItems extends List {
  items: ListItem[];
}

export interface RatingBucket {
  rating: number;
  count: number;
}

export interface Badge {
  slug: string;
  label: string;
  description: string;
  earned: boolean;
}

export interface BadgeNotification {
  slug: string;
  label: string;
  description: string;
  earnedAt: string;
}

export interface UserStats {
  logsCount: number;
  reviewsCount: number;
  averageRatingGiven: number | null;
  uniqueArtistsCount: number;
  uniqueAlbumsCount: number;
  ratingDistribution: RatingBucket[];
  topGenre: string | null;
  topArtist: { id: string; name: string; count: number } | null;
  listsCount: number;
  followersCount: number;
  followingCount: number;
  badges: Badge[];
}

export interface SearchResults {
  artists: Artist[];
  albums: Album[];
  songs: Song[];
}

export interface AuthTokens {
  accessToken: string;
}
